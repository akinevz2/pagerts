import type { JSDOM } from 'jsdom';
import {
  extractExternal,
  type External,
  type Resource,
  type Tag,
} from '../resource.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class ResourceExtractor extends AbstractExtractor<JSDOM, External<Resource>[]> {
  constructor(private readonly tags: Tag[]) {
    super('page-extractor');
  }
  async extract(value: JSDOM): Promise<External<Resource>[]> {
    const { document } = value.window;
    const externalResources: External<Resource>[] = [];
    for (const tag of this.tags) {
      const selector = document.querySelectorAll<Resource>(tag);
      const elements = Array.from(selector);
      for (const element of elements) {
        const external = extractExternal(element);
        if (!external?.link.url.startsWith('http')) continue;
        externalResources.push(external);
      }
    }
    return externalResources;
  }
}
