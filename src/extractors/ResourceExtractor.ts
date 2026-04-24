import type { DOMResult } from '../page/index.js';
import {
  findResourceLink,
  findResourceText,
  type ExternalResource,
  type Resource,
  type Tag,
} from '../resource.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class ResourceExtractor extends AbstractExtractor<DOMResult, ExternalResource[]> {
  constructor(private readonly tags: Tag[]) {
    super('page-extractor');
  }
  async extract(value: DOMResult): Promise<ExternalResource[]> {
    const { document } = value.window;
    return this.tags.flatMap((tag) =>
      Array.from(document.querySelectorAll<Resource>(tag)).flatMap((element) => {
        const link = findResourceLink(element);
        if (!link) return [];
        const text = findResourceText(element) ?? { key: 'src' as const, value: link.value };
        return [{ text, link }];
      })
    );
  }
}
