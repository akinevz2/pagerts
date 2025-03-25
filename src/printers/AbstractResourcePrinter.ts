import type { Page } from "../page/PageMetadata";

export abstract class AbstractResourcePrinter {
    constructor() {  }
    abstract print(...pages: Page[]): void | Promise<void>;
}
