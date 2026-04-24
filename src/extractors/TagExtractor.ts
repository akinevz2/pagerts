import type { DOMResult } from '../page/index.js';
import type { Resource, Tag } from '../resource.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class TagExtractor<T extends Tag> extends AbstractExtractor<DOMResult, Resource[]> {
  extract(value: DOMResult): Promise<Resource[]> {
    const linkNodes = value.window.document.querySelectorAll<Resource>(this.tagName);
    return Promise.resolve(Array.from(linkNodes));
  }
  constructor(private readonly tagName: T) {
    super(`extract <${tagName}>`);
  }
}
