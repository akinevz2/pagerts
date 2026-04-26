import type { Page } from '../page/index.js';
import type { DOMResult } from '../page/index.js';
import { AbstractExtractor } from './AbstractExtractor.js';

export class PageExtractor extends AbstractExtractor<DOMResult, Page> {
  constructor() {
    super('page-extractor');
  }

  async extract(value: DOMResult): Promise<Page> {
    const {
      window: { document },
      url,
    } = value;
    return { title: document.title, url };
  }
}
