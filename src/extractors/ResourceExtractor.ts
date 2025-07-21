import type { JSDOM } from "jsdom";
import { findResourceLink, findResourceText, type ExternalResource, type Resource, type Tag } from "../resource";
import { AbstractExtractor } from './AbstractExtractor';

export class ResourceExtractor extends AbstractExtractor<JSDOM, ExternalResource[]> {
    constructor(private readonly tags: Tag[]) {
        super("page-extractor");
    }
    async extract(value: JSDOM): Promise<ExternalResource[]> {
        const { document } = value.window;
        const externalResources: ExternalResource[] = [];
        for (const tag of this.tags) {
            const selector = document.querySelectorAll<Resource>(tag)
            const elements = Array.from(selector)
            for (const element of elements) {
                const text = findResourceText(element);
                const link = findResourceLink(element);
                if(!text || !link) continue
                if (!link.url.startsWith("http")) continue
                externalResources.push({ text, link })
            }
        }
        return externalResources;
    }
}