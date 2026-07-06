#!/usr/bin/env node

// src/main.ts
import { Command, createArgument, Option } from "commander";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

// src/extractors/AbstractExtractor.ts
var AbstractExtractor = class {
  constructor(name2) {
    this.name = name2;
  }
  name;
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
  tags;
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

// src/security.ts
import { isIP } from "node:net";
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
function isPrivateHostname(hostname) {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return true;
  }
  const ipType = isIP(normalized);
  if (ipType === 0) {
    return false;
  }
  if (ipType === 4) {
    const octets = normalized.split(".").map(Number);
    if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
      return false;
    }
    const [a, b] = octets;
    return a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 0;
  }
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
}
function validateUrl(url, options = {}) {
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
  if (parsedUrl.username || parsedUrl.password) {
    return {
      isValid: false,
      error: "URLs with embedded credentials are not allowed"
    };
  }
  if (!options.allowPrivateHosts && isPrivateHostname(parsedUrl.hostname)) {
    return {
      isValid: false,
      error: "Private or loopback hostnames are blocked by default. Use --allow-private-hosts if you trust the target."
    };
  }
  return {
    isValid: true,
    sanitizedUrl: parsedUrl.toString()
  };
}
function validateUrls(urls, options = {}) {
  const validUrls = [];
  const errors = [];
  for (const url of urls) {
    const result = validateUrl(url, options);
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

// src/page/PageFetcher.ts
var MAX_HTML_BYTES = 2 * 1024 * 1024;
var ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];
var MAX_REDIRECTS = 5;
var PageFetcher = class {
  timeout;
  maxRetries;
  userAgent;
  allowPrivateHosts;
  constructor(timeout = 1e4, maxRetries = 2, userAgent, allowPrivateHosts = false) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.userAgent = userAgent;
    this.allowPrivateHosts = allowPrivateHosts;
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
  async readResponseWithLimit(response) {
    if (!response.body) {
      return new ArrayBuffer(0);
    }
    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error(`Response exceeds max allowed size (${MAX_HTML_BYTES} bytes)`);
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return merged.buffer;
  }
  async fetchPage(url, retryCount = 0, redirectCount = 0) {
    const controller = new AbortController();
    let timeoutId = null;
    try {
      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          controller.abort(new Error("Request timeout"));
        }, this.timeout);
      }
      const headers = this.userAgent ? { "user-agent": this.userAgent } : void 0;
      const content = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: "manual"
      }).then(
        async (response) => {
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) {
              throw new Error(`Redirect response missing Location header (HTTP ${response.status})`);
            }
            if (redirectCount >= MAX_REDIRECTS) {
              throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
            }
            const redirectedUrl = new URL(location, url).toString();
            const validation = validateUrl(redirectedUrl, {
              allowPrivateHosts: this.allowPrivateHosts
            });
            if (!validation.isValid || !validation.sanitizedUrl) {
              throw new Error(
                `Blocked unsafe redirect target: ${validation.error ?? "Invalid redirect URL"}`
              );
            }
            return this.fetchPage(validation.sanitizedUrl, retryCount, redirectCount + 1).then(
              (result) => {
                if (!result.content) {
                  throw new Error(result.error ?? "Unknown redirect fetch error");
                }
                return result.content;
              }
            );
          }
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
          }
          const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
          const isAllowedContentType = ALLOWED_CONTENT_TYPES.some(
            (allowedType) => contentType.includes(allowedType)
          );
          if (!isAllowedContentType) {
            throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
          }
          const contentLengthHeader = response.headers.get("content-length");
          const contentLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;
          if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
            throw new Error(`Response exceeds max allowed size (${MAX_HTML_BYTES} bytes)`);
          }
          const buffer = await this.readResponseWithLimit(response);
          if (buffer.byteLength > MAX_HTML_BYTES) {
            throw new Error(`Response exceeds max allowed size (${MAX_HTML_BYTES} bytes)`);
          }
          const charsetMatch = /charset=([^\s;]+)/i.exec(contentType);
          const html = this.decodeHtml(buffer, charsetMatch?.[1] ?? "utf-8");
          return this.buildDOMResult(html, url);
        }
      );
      return { url, content };
    } catch (error) {
      const abortTimeout = error instanceof Error && error.name === "AbortError";
      const message = abortTimeout ? "Request timeout" : error instanceof Error ? error.message : "Unknown error";
      if (retryCount < this.maxRetries && this.isRetryableError(message)) {
        process.stderr.write(`Retrying ${url} (attempt ${retryCount + 1}/${this.maxRetries})...
`);
        await this.delay(1e3 * (retryCount + 1));
        return this.fetchPage(url, retryCount + 1, redirectCount);
      }
      return { url, error: `Failed to fetch: ${message}` };
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }
  isRetryableError(message) {
    const retryablePatterns = [/timeout/i, /ECONNRESET/i, /ETIMEDOUT/i, /ENOTFOUND/i, /network/i];
    return retryablePatterns.some((pattern) => pattern.test(message));
  }
  delay(ms) {
    return new Promise((resolve2) => setTimeout(resolve2, ms));
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
function normalizeLocalPath(value) {
  if (value.startsWith("file://")) {
    return fileURLToPath(value);
  }
  return value;
}
async function runFileCommand(paths, options) {
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
  const normalizedPaths = paths.map((pathValue) => normalizeLocalPath(pathValue));
  const responses = await fileFetcher.fetchAll(normalizedPaths);
  const pageMetadatas = await buildPageMetadata(
    responses.map(({ path, content, error }) => ({ path, content, error }))
  );
  await printer.print(...pageMetadatas);
}
function isCliEntrypoint() {
  const invokedPath = process.argv[1];
  if (!invokedPath) {
    return false;
  }
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(invokedPath));
  } catch {
    return false;
  }
}
async function runCli(argv = process.argv) {
  program.name(name).version(version, "-v, --version").description(description);
  program.addArgument(fileArg).addOption(
    new Option("--no-failsafe", `bypass the ${MAX_FILES_FAILSAFE}-file limit safety check`)
  ).action(async (paths, options) => {
    try {
      await runFileCommand(paths, options);
    } catch (error) {
      console.error("\n\u274C An error occurred:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
  program.command("fetch").description("fetch and extract resources from remote URL(s)").addArgument(urlArg).addOption(
    new Option(
      "--watch",
      "keep running: SIGWINCH re-fetches after resize, Ctrl-D releases in-flight requests, Ctrl-C exits"
    )
  ).addOption(new Option("-A, --user-agent <value>", "override the HTTP User-Agent header")).addOption(
    new Option(
      "--allow-private-hosts",
      "allow localhost/private-network targets (disabled by default for SSRF safety)"
    )
  ).action(
    async (urls, options) => {
      try {
        const { validUrls, errors } = validateUrls(urls, {
          allowPrivateHosts: options.allowPrivateHosts
        });
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
        const pageFetcher = new PageFetcher(
          options.watch ? 0 : 1e4,
          2,
          options.userAgent,
          options.allowPrivateHosts
        );
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
                console.error(
                  "\n\u274C An error occurred:",
                  err instanceof Error ? err.message : err
                );
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
    }
  );
  program.command("file").description("extract resources from local file(s) via direct filesystem access").addArgument(fileArg).addOption(
    new Option("--no-failsafe", `bypass the ${MAX_FILES_FAILSAFE}-file limit safety check`)
  ).action(async (paths, options) => {
    try {
      await runFileCommand(paths, options);
    } catch (error) {
      console.error("\n\u274C An error occurred:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
  await program.parseAsync(argv);
}
if (isCliEntrypoint()) {
  runCli().catch((error) => {
    console.error("\n\u274C An error occurred:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
export {
  runCli
};
/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 *
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */
//# sourceMappingURL=main.js.map
