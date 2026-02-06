import { JSDOM } from 'jsdom';
import type { Resource, Tag } from '../resource.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class TagExtractor<T extends Tag> extends AbstractExtractor<JSDOM, Resource[]> {
  extract(value: JSDOM): Promise<Resource[]> {
    const linkNodes = value.window.document.querySelectorAll<Resource>(this.tagName);
    return Promise.resolve(Array.from(linkNodes));
  }
  constructor(private readonly tagName: T) {
    super(`extract <${tagName}>`);
  }
}
