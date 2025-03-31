import { JSDOM, VirtualConsole } from 'jsdom';
import type { Page, PageMetadata } from './Page';

export type PageResponse = JSDOM | PageMetadata

export const isJSDOM = (page: PageResponse): page is JSDOM => 'window' in page;
export const isMetadata = (page: PageResponse): page is PageMetadata => 'url' in page && 'title' in page;

export class PageFetcher {
    async fetchPage(url: string): Promise<PageResponse> {
        const dom = JSDOM.fromURL(url, {
            virtualConsole: new VirtualConsole().on('jsdomError', (error) => {
                process.stderr.write(`Error parsing ${url}:${error.message}\n`);
            })
        });
        return dom.catch(({ message }) => {
            return { url, error: `Not an HTML page: ${message}` };
        })
    }
    async fetchAll(urls: string[]): Promise<PageResponse[]> {
        return await Promise.all(urls.map(url => this.fetchPage(url)));
    }
    constructor() { }
}
