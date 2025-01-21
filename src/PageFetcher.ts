import { type Browser, type Page } from "puppeteer";

export class PageFetcher {
    constructor(private readonly browser: Browser) { }
    async fetchPage(url: string): Promise<Page> {
        const browser = this.browser;
        const page = await browser.newPage();
        await page.goto(url);
        return page;
    }
}