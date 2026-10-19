import { JSDOM, VirtualConsole } from 'jsdom';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface PageResponse {
  url: string;
  content?: JSDOM;
  error?: string;
}

const SCHEMED_URL = /^[a-z][a-z0-9+.-]*:/i;

export class PageFetcher {
  constructor(private readonly timeoutMs?: number) {}

  async fetchAll(urls: string[]): Promise<PageResponse[]> {
    return Promise.all(urls.map((url) => this.fetchPage(url)));
  }

  private async fetchPage(url: string): Promise<PageResponse> {
    const virtualConsole = new VirtualConsole().on('jsdomError', (error) => {
      process.stderr.write(`Error parsing ${url}:${error.message}\n`);
    });
    try {
      return { url, content: await this.loadWithTimeout(url, virtualConsole) };
    } catch (error) {
      return { url, error: describeFailure(url, error) };
    }
  }

  private loadWithTimeout(url: string, virtualConsole: VirtualConsole): Promise<JSDOM> {
    const load = this.load(url, virtualConsole);
    if (!this.timeoutMs) {
      return load;
    }
    let timer: NodeJS.Timeout | undefined;
    return Promise.race([
      load,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timed out after ${this.timeoutMs}ms`)),
          this.timeoutMs
        );
        timer.unref();
      }),
    ]).finally(() => clearTimeout(timer));
  }

  private async load(url: string, virtualConsole: VirtualConsole): Promise<JSDOM> {
    if (url.startsWith('file://')) {
      return JSDOM.fromFile(fileURLToPath(url), { virtualConsole });
    }
    // no scheme: treat as a local path
    if (!SCHEMED_URL.test(url)) {
      return JSDOM.fromFile(resolve(url), { virtualConsole });
    }
    return JSDOM.fromURL(url, { virtualConsole });
  }
}

function describeFailure(url: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Failed to load ${url}: ${message}`;
}
