import { JSDOM, VirtualConsole } from 'jsdom';
export class PageFetcher {
    async fetchPage(url: string): Promise<JSDOM> {
        const dom = await JSDOM.fromURL(url, {
            virtualConsole: new VirtualConsole().on('jsdomError', (error) => {
                console.error(`Error parsing ${url}:`, error.message);
            })
        });
        return dom;
    }
    async fetchAll(urls:string[]): Promise<JSDOM[]> {
        return await Promise.all(urls.map(url => this.fetchPage(url)));
    }
    constructor() {}
}
