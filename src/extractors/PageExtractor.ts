import type { Page } from '../page/index.js';
import { JSDOM } from 'jsdom';
import { AbstractExtractor } from './AbstractExtractor.js';

export class PageExtractor extends AbstractExtractor<JSDOM, Page> {
  constructor() {
    super('page-extractor');
  }

  async extract(value: JSDOM): Promise<Page> {
    const {
      window: {
        document: {
          title,
          location: { href: url },
        },
      },
    } = value;
    return { title, url };
  }
}
