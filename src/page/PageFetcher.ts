import { JSDOM, VirtualConsole } from 'jsdom';
import type { Page } from './PageMetadata';

export type PageResponse = JSDOM | Page

export const isJSDOM = (page: PageResponse): page is JSDOM => 'window' in page;

export class PageFetcher {
    async fetchPage(url: string): Promise<PageResponse> {
        try {
            const dom = await JSDOM.fromURL(url, {
                virtualConsole: new VirtualConsole().on('jsdomError', (error) => {
                    console.error(`Error parsing ${url}:`, error.message);
                })
            });
            return dom;
        } catch (error) {
            throw error;
        }
    }
    async fetchAll(urls: string[]): Promise<PageResponse[]> {
        return await Promise.all(urls.map(url => this.fetchPage(url)));
    }
    constructor() { }
}
