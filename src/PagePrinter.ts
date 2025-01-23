import { AbstractResourcePrinter } from "./AbstractResourcePrinter";
import type { ElementDescription, PageContent } from "./PageContent";

export class LogStylePagePrinter extends AbstractResourcePrinter {
    async print(): Promise<void> {
        const { pageContents } = this
        for (const pageContent of pageContents) {
            const { title, url, resources } = pageContent
            console.log(`Title: ${title}`)
            console.log(`URL: ${url}`)
            console.log("Resources:")
            for (const resource of resources) {
                try {
                    const { key, text, url }: ElementDescription = await this.extract(resource)
                    console.log(`\t- ${text}(${key}): ${url}`)
                } catch (error) {
                    console.error(`\t- ResourceElement with no external resource found:`)
                    console.error(`\t `, error)
                }
            }
        }
    }
    constructor(private readonly pageContents: PageContent[]) { super(); }
}