import { parseHTML } from 'linkedom';

type ParseHTMLResult = {
  document: Document;
};

export interface DOMResult {
  window: { document: Document };
  url: string;
}

interface PageResponse {
  url: string;
  content?: DOMResult;
  error?: string;
}

export class PageFetcher {
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(timeout = 10000, maxRetries = 2) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  private buildDOMResult(html: string, url: string): DOMResult {
    const { document } = parseHTML(html) as ParseHTMLResult;
    return { window: { document }, url };
  }

  private decodeHtml(buffer: ArrayBuffer, charset: string): string {
    try {
      return new TextDecoder(charset).decode(new Uint8Array(buffer));
    } catch {
      return new TextDecoder('utf-8').decode(new Uint8Array(buffer));
    }
  }

  private async fetchPage(url: string, retryCount = 0): Promise<PageResponse> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          controller.abort(new Error('Request timeout'));
        }, this.timeout);
      }

      const content = await fetch(url, { signal: controller.signal }).then(async (response) => {
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') ?? '';
        const charsetMatch = /charset=([^\s;]+)/i.exec(contentType);
        const html = this.decodeHtml(buffer, charsetMatch?.[1] ?? 'utf-8');
        return this.buildDOMResult(html, url);
      });

      return { url, content };
    } catch (error) {
      const abortTimeout = error instanceof Error && error.name === 'AbortError';
      const message = abortTimeout
        ? 'Request timeout'
        : error instanceof Error
          ? error.message
          : 'Unknown error';

      // Retry logic for transient errors
      if (retryCount < this.maxRetries && this.isRetryableError(message)) {
        process.stderr.write(`Retrying ${url} (attempt ${retryCount + 1}/${this.maxRetries})...\n`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.fetchPage(url, retryCount + 1);
      }

      return { url, error: `Failed to fetch: ${message}` };
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
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
