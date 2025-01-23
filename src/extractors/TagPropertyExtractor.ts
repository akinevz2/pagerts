import { AbstractExtractor } from '../AbstractExtractor';
import type { ElementDescription } from '../PageContent';
import { isKeyDefined, type ResourceKey } from '../tags';

function tryKeys(value: HTMLElement, keys: string[]): string {
    for (const key of keys) {
        const resourceKey = value[key]
        if (resourceKey && resourceKey.trim() !== '') {
            return resourceKey.trim()
        }
    }
    return undefined
}
export class TagPropertyExtractor extends AbstractExtractor<HTMLElement, ElementDescription> {
    constructor(public readonly property: ResourceKey) {
        super(`${property} Extractor`)
    }
    extract(value: HTMLElement): Promise<ElementDescription> {
        if (isKeyDefined(value, this.property)) {
            const key = this.property
            const url = value[this.property] as string
            const keys = ['innerText', 'ariaDescription', 'ariaLabel', 'class', 'rel', 'id', 'textContent']
            const text = tryKeys(value, keys) ?? `non-descript ${value}`
            return Promise.resolve({ key, url, text });
        }
        return Promise.reject(`${value} does not have a '${this.property}'`);
    }
}