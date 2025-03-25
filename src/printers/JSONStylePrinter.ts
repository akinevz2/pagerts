import type { Page } from "../page/PageMetadata";
import { AbstractResourcePrinter } from "./AbstractResourcePrinter";


export class JSONStylePrinter extends AbstractResourcePrinter {
    print(...pages: Page[]): void | Promise<void> {
        const json = JSON.stringify(pages);
        process.stdout.write(json + "\n")
    }
   

}
