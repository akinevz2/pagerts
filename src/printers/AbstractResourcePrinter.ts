import type { Page, PageMetadata  } from "../page/Page";

export abstract class AbstractResourcePrinter {
    constructor() {  }
    abstract print(...pages: PageMetadata[]): void | Promise<void>;
}
