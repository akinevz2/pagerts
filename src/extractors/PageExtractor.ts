import { Page } from '../page/Page';
import type { PageDescriptor } from '../page/PageMetadata';
import { AbstractExtractor } from './AbstractExtractor';

export class PageExtractor extends AbstractExtractor<Page, PageDescriptor> {
    constructor() { super("page-extractor"); }

    async extract(value: Page): Promise<PageDescriptor> {
        const { title, location: { href: url } } = value.window.document
        return {
            url,
            title,
        };
    }
}