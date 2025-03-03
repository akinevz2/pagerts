import type { PageMetadata } from "../page/PageMetadata";
import { AbstractResourcePrinter } from "./AbstractResourcePrinter";


export class JSONStylePrinter extends AbstractResourcePrinter {
    print(page: PageMetadata): void | Promise<void> {
        const json = JSON.stringify(page);
        process.stdout.write(json + "\n")
    }
   

}
