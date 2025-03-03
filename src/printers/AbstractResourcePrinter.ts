import type { PageMetadata } from "../page/PageMetadata";

export abstract class AbstractResourcePrinter {
    constructor() {  }
    abstract print(page: PageMetadata): void | Promise<void>;
}
