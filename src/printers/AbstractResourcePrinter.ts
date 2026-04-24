import type { PageMetadata } from '../page/index.js';

export abstract class AbstractResourcePrinter {
  constructor() {}
  abstract print(...pages: PageMetadata[]): void | Promise<void>;
}
