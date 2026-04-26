#!/usr/bin/env node

// src/main.ts
import { Command, createArgument, Option } from "commander";
import { createRequire } from "node:module";

// src/extractors/AbstractExtractor.ts
var AbstractExtractor = class {
  constructor(name2) {
    this.name = name2;
  }
};

// src/extractors/PageExtractor.ts
var PageExtractor = class extends AbstractExtractor {
  constructor() {
    super("page-extractor");
  }
  async extract(value) {
    const {
      window: { document },
      url
    } = value;
    return { title: document.title, url };
  }
};

// src/resource.ts
var RESOURCE_DISPLAYABLE_KEYS = [
  "id",
  "innerText",
  "textContent",
  "class",
  "ariaLabel",
  "ariaDescription",
  "alt"
];
var RESOURCE_LINK_KEYS = ["href", "data-src", "target", "action", "src", "url"];
var readAttr = (element, key) => {
  const v = element.getAttribute(key);
  return v != null && v.trim() !== "" ? v : void 0;
};
function findResourceText(element) {
  for (const key of RESOURCE_DISPLAYABLE_KEYS) {
    const value = readAttr(element, key);
    if (value !== void 0) return { key, value };
  }
  return void 0;
}
function findResourceLink(element) {
  for (const key of RESOURCE_LINK_KEYS) {
    const value = readAttr(element, key);
    if (value !== void 0) return { key, value };
  }
  return void 0;
}

// src/extractors/ResourceExtractor.ts
var ResourceExtractor = class extends AbstractExtractor {
  constructor(tags) {
    super("page-extractor");
    this.tags = tags;
  }
  async extract(value) {
    const { document } = value.window;
    return this.tags.flatMap(
      (tag) => Array.from(document.querySelectorAll(tag)).flatMap((element) => {
        const link = findResourceLink(element);
        if (!link) return [];
        const text = findResourceText(element) ?? { key: "src", value: link.value };
        return [{ text, link }];
      })
    );
  }
};

// src/page/PageFetcher.ts
import { parseHTML } from "linkedom";
var PageFetcher = class {
  timeout;
  maxRetries;
  constructor(timeout = 1e4, maxRetries = 2) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }
  buildDOMResult(html, url) {
    const { document } = parseHTML(html);
    return { window: { document }, url };
  }
  decodeHtml(buffer, charset) {
    try {
      return new TextDecoder(charset).decode(new Uint8Array(buffer));
    } catch {
      return new TextDecoder("utf-8").decode(new Uint8Array(buffer));
    }
  }
  async fetchPage(url, retryCount = 0) {
    try {
      const domPromise = fetch(url).then(async (response) => {
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") ?? "";
        const charsetMatch = /charset=([^\s;]+)/i.exec(contentType);
        const html = this.decodeHtml(buffer, charsetMatch?.[1] ?? "utf-8");
        return this.buildDOMResult(html, url);
      });
      const content = await (this.timeout > 0 ? Promise.race([
        domPromise,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Request timeout")), this.timeout)
        )
      ]) : domPromise);
      return { url, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (retryCount < this.maxRetries && this.isRetryableError(message)) {
        process.stderr.write(`Retrying ${url} (attempt ${retryCount + 1}/${this.maxRetries})...
`);
        await this.delay(1e3 * (retryCount + 1));
        return this.fetchPage(url, retryCount + 1);
      }
      return { url, error: `Failed to fetch: ${message}` };
    }
  }
  isRetryableError(message) {
    const retryablePatterns = [/timeout/i, /ECONNRESET/i, /ETIMEDOUT/i, /ENOTFOUND/i, /network/i];
    return retryablePatterns.some((pattern) => pattern.test(message));
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async fetchAll(urls) {
    const responses = await Promise.all(urls.map((url) => this.fetchPage(url)));
    return responses.filter((response) => response.content !== void 0 || response.error);
  }
};

// src/page/FileFetcher.ts
import { readFile } from "node:fs/promises";
import { parseHTML as parseHTML2 } from "linkedom";
var MAX_FILES_FAILSAFE = 254;
var FileFetcher = class {
  buildDOMResult(html, filePath) {
    const { document } = parseHTML2(html);
    return { window: { document }, url: `file://${filePath}` };
  }
  async fetchFile(filePath) {
    try {
      const html = await readFile(filePath, "utf-8");
      return { path: filePath, content: this.buildDOMResult(html, filePath) };
    } catch (error) {
      return {
        path: filePath,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async fetchAll(filePaths) {
    return Promise.all(filePaths.map((p) => this.fetchFile(p)));
  }
};

// src/printers/AbstractResourcePrinter.ts
var AbstractResourcePrinter = class {
  constructor() {
  }
};

// src/printers/JSONStylePrinter.ts
var JSONStylePrinter = class extends AbstractResourcePrinter {
  print(...pages) {
    const json = JSON.stringify(pages);
    process.stdout.write(json + "\n");
  }
};

// src/security.ts
var ALLOWED_PROTOCOLS = ["http:", "https:"];
var MAX_URL_LENGTH = 2048;
var SUSPICIOUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /<script/i,
  /on\w+=/i
  // Event handlers like onclick=
];
function validateUrl(url) {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: "URL cannot be empty"
    };
  }
  const trimmedUrl = url.trim();
  if (trimmedUrl.length > MAX_URL_LENGTH) {
    return {
      isValid: false,
      error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`
    };
  }
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedUrl)) {
      return {
        isValid: false,
        error: "URL contains suspicious patterns"
      };
    }
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      error: "Invalid URL format"
    };
  }
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: `Protocol ${parsedUrl.protocol} is not allowed. Allowed protocols: ${ALLOWED_PROTOCOLS.join(", ")}`
    };
  }
  const hostname = parsedUrl.hostname.toLowerCase();
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
  if (isLocalhost) {
    console.warn(`Warning: Accessing local network resource: ${trimmedUrl}`);
  }
  return {
    isValid: true,
    sanitizedUrl: parsedUrl.toString()
  };
}
function validateUrls(urls) {
  const validUrls = [];
  const errors = [];
  for (const url of urls) {
    const result = validateUrl(url);
    if (result.isValid && result.sanitizedUrl) {
      validUrls.push(result.sanitizedUrl);
    } else {
      errors.push({
        url,
        error: result.error || "Unknown validation error"
      });
    }
  }
  return { validUrls, errors };
}

// src/main.ts
var require2 = createRequire(import.meta.url);
var pkg = require2("../package.json");
var { description, name, version } = pkg;
var program = new Command();
var urlArg = createArgument("<url...>", "remote https://URL to extract from");
var fileArg = createArgument("<paths...>", "local file paths to extract from");
var pageExtractor = new PageExtractor();
var resourceExtractor = new ResourceExtractor(["a", "meta", "link", "embed", "script"]);
var printer = new JSONStylePrinter();
async function buildPageMetadata(responses) {
  const pageMetadatas = [];
  for (const { content, url: responseUrl, path, error } of responses) {
    const resolvedUrl = responseUrl ?? path ?? "";
    const resources = error !== void 0 || !content ? [] : await resourceExtractor.extract(content);
    const descriptor = error !== void 0 || !content ? { url: resolvedUrl, error: error ?? "Unknown error", resources } : await pageExtractor.extract(content);
    pageMetadatas.push({ ...descriptor, resources });
  }
  return pageMetadatas;
}
(async () => {
  program.name(name).version(version, "-v, --version").description(description);
  program.command("fetch", { isDefault: true }).description("fetch and extract resources from remote URL(s)").addArgument(urlArg).addOption(
    new Option(
      "--watch",
      "keep running: SIGWINCH re-fetches after resize, Ctrl-D releases in-flight requests, Ctrl-C exits"
    )
  ).action(async (urls, options) => {
    try {
      const { validUrls, errors } = validateUrls(urls);
      if (errors.length > 0) {
        console.error("\n\u274C URL Validation Errors:");
        errors.forEach(({ url: invalidUrl, error }) => {
          console.error(`  - ${invalidUrl}: ${error}`);
        });
      }
      if (validUrls.length === 0) {
        console.error("\n\u274C No valid URLs to process. Exiting.");
        process.exit(1);
      }
      console.error(`
\u2705 Processing ${validUrls.length} valid URL(s)...`);
      const pageFetcher = new PageFetcher(options.watch ? 0 : 1e4, 2);
      const execute = async () => {
        const responses = await pageFetcher.fetchAll(validUrls);
        const pageMetadatas = await buildPageMetadata(responses);
        await printer.print(...pageMetadatas);
      };
      if (options.watch) {
        process.stdin.resume();
        process.on("SIGINT", () => process.exit(0));
        let activeExecution = null;
        process.stdin.on("end", () => {
          activeExecution = null;
        });
        let winchTimer = null;
        process.on("SIGWINCH", () => {
          if (winchTimer !== null) clearTimeout(winchTimer);
          winchTimer = setTimeout(() => {
            winchTimer = null;
            activeExecution = execute().catch((err) => {
              console.error("\n\u274C An error occurred:", err instanceof Error ? err.message : err);
            });
          }, 150);
        });
        activeExecution = execute();
        await activeExecution;
      } else {
        await execute();
      }
    } catch (error) {
      console.error("\n\u274C An error occurred:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
  program.command("file").description("extract resources from local file(s) via direct filesystem access").addArgument(fileArg).addOption(
    new Option("--no-failsafe", `bypass the ${MAX_FILES_FAILSAFE}-file limit safety check`)
  ).action(async (paths, options) => {
    try {
      if (options.failsafe && paths.length > MAX_FILES_FAILSAFE) {
        console.error(
          `
\u274C ${paths.length} files specified exceeds the safety limit of ${MAX_FILES_FAILSAFE}.`
        );
        console.error(`   Pass --no-failsafe to bypass this check and process all files.`);
        process.exit(1);
      }
      if (!options.failsafe && paths.length > MAX_FILES_FAILSAFE) {
        console.error(
          `
\u26A0\uFE0F  Failsafe bypassed: processing ${paths.length} files (limit is ${MAX_FILES_FAILSAFE}).`
        );
      }
      console.error(`
\u2705 Processing ${paths.length} file(s)...`);
      const fileFetcher = new FileFetcher();
      const responses = await fileFetcher.fetchAll(paths);
      const pageMetadatas = await buildPageMetadata(
        responses.map(({ path, content, error }) => ({ path, content, error }))
      );
      await printer.print(...pageMetadatas);
    } catch (error) {
      console.error("\n\u274C An error occurred:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
  await program.parseAsync(process.argv);
})();
/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 *
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */
//# sourceMappingURL=main.js.map
