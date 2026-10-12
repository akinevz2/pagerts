import type { PageMetadata } from '../page/Page.js';

export abstract class AbstractResourcePrinter {
  constructor() {}
  abstract print(...pages: PageMetadata[]): void | Promise<void>;
}
