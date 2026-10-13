import { JSDOM, VirtualConsole } from 'jsdom';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PageResponse {
  url: string;
  content?: JSDOM;
  error?: string;
}

export class PageFetcher {
  private async fetchPage(url: string): Promise<PageResponse> {
    const virtualConsole = new VirtualConsole().on('jsdomError', (error) => {
      process.stderr.write(`Error parsing ${url}:${error.message}\n`);
    });
    return this.load(url, virtualConsole)
      .then((content) => ({ url, content }))
      .catch(({ message }) => ({ url, error: `JSDOM failed to parse: ${message}` }));
  }
  private async load(url: string, virtualConsole: VirtualConsole): Promise<JSDOM> {
    if (url.startsWith('file://')) {
      return JSDOM.fromFile(fileURLToPath(url), { virtualConsole });
    }
    // no scheme: treat as a local path
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
      return JSDOM.fromFile(resolve(url), { virtualConsole });
    }
    return JSDOM.fromURL(url, { virtualConsole });
  }

  async fetchAll(urls: string[]): Promise<PageResponse[]> {
    return Promise.all(urls.map((url) => this.fetchPage(url)));
  }
}
