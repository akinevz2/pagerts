import { JSDOM, VirtualConsole } from 'jsdom';
import type { Page, PageMetadata } from './Page';

interface PageResponse {
    url: string;
    content?: JSDOM;
    error?: string;
}

export class PageFetcher {
    private async fetchPage(url: string): Promise<PageResponse> {
        let dom: Promise<JSDOM>;
        const virtualConsole = new VirtualConsole().on('jsdomError', (error) => {
            process.stderr.write(`Error parsing ${url}:${error.message}\n`);
        });
        if (url.startsWith("file://")) {
            dom = JSDOM.fromFile(url, { virtualConsole });
        } else {
            dom = JSDOM.fromURL(url, { virtualConsole });
        }

        return dom.then(content => ({ url, content }))
            .catch(({ message }) => ({ url, error: `JSDOM failed to parse: ${message}` }));
    }
    async fetchAll(urls: string[]): Promise<PageResponse[]> {
        const responses = await Promise.all(urls.map(url => this.fetchPage(url)));
        return responses.filter(response => response.content !== undefined);
    }

}
