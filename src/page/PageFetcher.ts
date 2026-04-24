import { JSDOM, VirtualConsole } from 'jsdom';
import { legacyHookDecode } from '@exodus/bytes/encoding.js';

interface PageResponse {
  url: string;
  content?: JSDOM;
  error?: string;
}

export class PageFetcher {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly executeScripts: boolean;

  constructor(timeout = 10000, maxRetries = 2, executeScripts = false) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.executeScripts = executeScripts;
  }

  private async fetchPage(url: string, retryCount = 0): Promise<PageResponse> {
    const virtualConsole = new VirtualConsole().on('jsdomError', (error: Error) => {
      process.stderr.write(`Error parsing ${url}: ${error.message}\n`);
    });

    try {
      let dom: Promise<JSDOM>;

      if (url.startsWith('file://')) {
        dom = JSDOM.fromFile(url.substring(7), { virtualConsole });
      } else {
        // Add timeout and security options for remote URLs
        dom = fetch(url).then(async (response) => {
          const buffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') ?? '';
          const charsetMatch = /charset=([^\s;]+)/i.exec(contentType);
          const html = legacyHookDecode(new Uint8Array(buffer), charsetMatch?.[1] ?? 'utf-8');
          const executeScripts = this.executeScripts;
          return new JSDOM(html, {
            url,
            virtualConsole,
            resources: 'usable',
            runScripts: executeScripts ? 'dangerously' : 'outside-only',
          });
        });
      }

      const content = await (this.timeout > 0
        ? Promise.race([
            dom,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), this.timeout)
            ),
          ])
        : dom);

      return { url, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic for transient errors
      if (retryCount < this.maxRetries && this.isRetryableError(message)) {
        process.stderr.write(`Retrying ${url} (attempt ${retryCount + 1}/${this.maxRetries})...\n`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.fetchPage(url, retryCount + 1);
      }

      return { url, error: `Failed to fetch: ${message}` };
    }
  }

  private isRetryableError(message: string): boolean {
    const retryablePatterns = [/timeout/i, /ECONNRESET/i, /ETIMEDOUT/i, /ENOTFOUND/i, /network/i];
    return retryablePatterns.some((pattern) => pattern.test(message));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async fetchAll(urls: string[]): Promise<PageResponse[]> {
    const responses = await Promise.all(urls.map((url) => this.fetchPage(url)));
    return responses.filter((response) => response.content !== undefined || response.error);
  }
}
