import type { JSDOM } from 'jsdom';
import {
  DEFAULT_EXTRACTABLE_TAGS,
  extractExternal,
  isResource,
  queryResources,
  type External,
  type Resource,
  type Tag,
} from '../resource.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class ResourceExtractor extends AbstractExtractor<JSDOM, External<Resource>[]> {
  constructor(
    private readonly tags: Tag[] = DEFAULT_EXTRACTABLE_TAGS,
    private readonly linkProperties?: readonly string[]
  ) {
    super('page-extractor');
  }
  async extract(value: JSDOM): Promise<External<Resource>[]> {
    const { document } = value.window;
    const externalResources: External<Resource>[] = [];
    const elements =
      this.tags.length === 0
        ? queryResources(document, this.linkProperties)
        : this.tags.flatMap((tag) =>
            Array.from(document.querySelectorAll(tag)).filter((el): el is Resource =>
              isResource(el, this.linkProperties)
            )
          );
    for (const element of elements) {
      const external = extractExternal(element, this.linkProperties);
      if (!external?.link.url.startsWith('http')) continue;
      externalResources.push(external);
    }
    return externalResources;
  }
}
