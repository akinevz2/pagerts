import { parseHTML } from 'linkedom';
import { validateUrl } from '../security.js';

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];
const MAX_REDIRECTS = 5;

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
  private readonly userAgent?: string;
  private readonly allowPrivateHosts: boolean;

  constructor(timeout = 10000, maxRetries = 2, userAgent?: string, allowPrivateHosts = false) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.userAgent = userAgent;
    this.allowPrivateHosts = allowPrivateHosts;
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

  private async readResponseWithLimit(response: Response): Promise<ArrayBuffer> {
    if (!response.body) {
      return new ArrayBuffer(0);
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
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

  private async fetchPage(url: string, retryCount = 0, redirectCount = 0): Promise<PageResponse> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          controller.abort(new Error('Request timeout'));
        }, this.timeout);
      }

      const headers = this.userAgent ? { 'user-agent': this.userAgent } : undefined;
      const content = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'manual',
      }).then(
        async (response) => {
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location) {
              throw new Error(`Redirect response missing Location header (HTTP ${response.status})`);
            }

            if (redirectCount >= MAX_REDIRECTS) {
              throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
            }

            const redirectedUrl = new URL(location, url).toString();
            const validation = validateUrl(redirectedUrl, {
              allowPrivateHosts: this.allowPrivateHosts,
            });

            if (!validation.isValid || !validation.sanitizedUrl) {
              throw new Error(
                `Blocked unsafe redirect target: ${validation.error ?? 'Invalid redirect URL'}`
              );
            }

            return this.fetchPage(validation.sanitizedUrl, retryCount, redirectCount + 1).then(
              (result) => {
                if (!result.content) {
                  throw new Error(result.error ?? 'Unknown redirect fetch error');
                }

                return result.content;
              }
            );
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
          }

          const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
          const isAllowedContentType = ALLOWED_CONTENT_TYPES.some((allowedType) =>
            contentType.includes(allowedType)
          );
          if (!isAllowedContentType) {
            throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
          }

          const contentLengthHeader = response.headers.get('content-length');
          const contentLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;
          if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
            throw new Error(`Response exceeds max allowed size (${MAX_HTML_BYTES} bytes)`);
          }

          const buffer = await this.readResponseWithLimit(response);
          if (buffer.byteLength > MAX_HTML_BYTES) {
            throw new Error(`Response exceeds max allowed size (${MAX_HTML_BYTES} bytes)`);
          }

          const charsetMatch = /charset=([^\s;]+)/i.exec(contentType);
          const html = this.decodeHtml(buffer, charsetMatch?.[1] ?? 'utf-8');
          return this.buildDOMResult(html, url);
        }
      );

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
        return this.fetchPage(url, retryCount + 1, redirectCount);
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
