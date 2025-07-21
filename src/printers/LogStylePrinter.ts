import { isPage, type Page, type PageMetadata } from '../page/Page';
import { AbstractResourcePrinter } from './AbstractResourcePrinter';

export class LogStylePrinter extends AbstractResourcePrinter {

    write(str: string): void {
        process.stdout.write(str)
    }

    async print(...pages: PageMetadata[]): Promise<void> {
        for (const page of pages) {
            if (!isPage(page)) {
                this.write(page.error)
                continue
            }

            const {resources, title, url } = page

            this.write(`Title: ${title}\n`)
            this.write(`URL: ${url}\n\n`)

            for (const resource of resources) {
                const { link: { url }, text: { value } } = resource
                this.write(`${value}: ${url}\n`)
            }
        }
    }
}
