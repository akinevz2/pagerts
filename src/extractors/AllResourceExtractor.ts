import type { JSDOM } from 'jsdom';
import { extractExternal, isResource, type External, type Resource } from '../resource.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class AllResourceExtractor extends AbstractExtractor<JSDOM, External<Resource>[]> {
  constructor(private readonly linkProperties?: readonly string[]) {
    super('all-resource-extractor');
  }

  async extract(value: JSDOM): Promise<External<Resource>[]> {
    const externalResources: External<Resource>[] = [];
    const elements = value.window.document.querySelectorAll('*');

    for (const element of elements) {
      if (!isResource(element, this.linkProperties)) continue;

      const external = extractExternal(element, this.linkProperties);
      if (external?.link.url.startsWith('http')) externalResources.push(external);
    }

    return externalResources;
  }
}
