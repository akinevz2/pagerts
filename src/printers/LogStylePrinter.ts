import type { PageMetadata } from '../page/PageMetadata';
import { AbstractResourcePrinter } from './AbstractResourcePrinter';

export class LogStylePrinter extends AbstractResourcePrinter {

    write(str: string): void {
        process.stdout.write(str)
    }

    async print(page: PageMetadata): Promise<void> {
        const { resources, title, url } = page

        this.write(`Title: ${title}\n`)
        this.write(`URL: ${url}\n\n`)

        for (const resource of resources) {
            const { link: { href }, text: { value } } = resource
            this.write(`${value}: ${href}\n`)
        }
    }
}
