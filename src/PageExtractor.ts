import { JSDOM } from "jsdom";
import { TagByNameExtractor } from './extractors/TagByNameExtractor';

import type { Page } from "puppeteer";
import { DocumentExtractor } from "./DocumentExtractor";
import type { PageContent } from "./PageContent";
import type { Resource } from "./tags";

abstract class AbstractPageExtractor {
    constructor(private readonly plugins: DocumentExtractor<Resource>[]) { }
    async executePlugins(page: Page): Promise<PageContent> {
        const url = page.url();
        const title = await page.title();
        const content: string = await page.content();
        const document: JSDOM = new JSDOM(content);
        let resources: Resource[] = [];
        for (const plugin of this.plugins) {
            const result = await plugin.execute(document);
            if (result) resources.push(...result);
        }
        return { title, url, resources };
    }
}

export default class PageExtractor extends AbstractPageExtractor {
    constructor(...tags: string[]) {
        super(tags.map(tag => new TagByNameExtractor(tag)));
    }
}