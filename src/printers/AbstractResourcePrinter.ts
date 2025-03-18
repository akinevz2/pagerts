import type { PageMetadata } from "../page/PageMetadata";

export abstract class AbstractResourcePrinter {
    constructor() {  }
    abstract print(...pages: PageMetadata[]): void | Promise<void>;
}
