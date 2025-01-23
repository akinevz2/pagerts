import type { AbstractExtractor } from "./AbstractExtractor";
import { TagPropertyExtractor } from "./extractors/TagPropertyExtractor";
import type { ElementDescription } from "./PageContent";
import { isKeyDefined, resourceKeys, type Resource, type ResourceKey } from "./tags";

export async function getPropertyKey(element: Resource): Promise<ResourceKey> {
    for (const key of resourceKeys) {
        if (isKeyDefined(element, key)) {
            return key
        }
    }
    return Promise.reject(`${element} does not have a defined property key for an external resource`)
}

type ExtractorMap = { [K in ResourceKey]: AbstractExtractor<Resource, ElementDescription> };

export abstract class AbstractResourcePrinter {
    abstract print(): void | Promise<void>;
    extractors: ExtractorMap = {
        url: new TagPropertyExtractor('url'),
        src: new TagPropertyExtractor('src'),
        href: new TagPropertyExtractor('href'),
        target: new TagPropertyExtractor('target'),
        action: new TagPropertyExtractor('action'),
    }

    async extract(resource: Resource): Promise<ElementDescription> {
        try {
            const key = await getPropertyKey(resource);
            const extractor = this.extractors[key];
            return extractor.extract(resource);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
