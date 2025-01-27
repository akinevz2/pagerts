import { JSDOM } from "jsdom";
import { AbstractExtractor } from "./AbstractExtractor";
import type { PageContent } from "./PageContent";
import { Resource } from "./tags";

export abstract class AbstractPageExtractor extends AbstractExtractor<JSDOM, Resource[]> {
    constructor(private readonly plugins: AbstractExtractor<JSDOM, Resource[]>[]) {
        super("page-extractor");
    }
    async executePlugins(document: JSDOM): Promise<PageContent> {
        const url = document.window.location.href;
        const title = document.window.document.title;
        const resources = await this.extract(document);
        return { title, url, resources };
    }
    async extract(value: JSDOM): Promise<Resource[]> {
        let resources: Resource[] = [];
        for (const plugin of this.plugins) {
            const result = await plugin.extract(value);
            resources.push(...result);
        }
        return resources;
    }
}