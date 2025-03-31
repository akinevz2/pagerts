import type { PageMetadata } from "../page/Page";
import { AbstractResourcePrinter } from "./AbstractResourcePrinter";


export class JSONStylePrinter extends AbstractResourcePrinter {
    print(...pages: PageMetadata[]): void | Promise<void> {
        const json = JSON.stringify(pages);
        process.stdout.write(json + "\n")
    }
   

}
