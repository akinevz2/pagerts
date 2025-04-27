import { isError, type Page } from '../page/Page';
import { JSDOM } from 'jsdom';
import { AbstractExtractor } from './AbstractExtractor';
import { isJSDOM, isMetadata, type PageResponse } from '../page/PageFetcher';

export class PageExtractor extends AbstractExtractor<PageResponse, Page> {
    constructor() { super("page-extractor"); }

    async extract(value: PageResponse): Promise<Page> {
        if (isJSDOM(value)) {
            const { window: { document: { title, location: { href: url } } } } = value
            return { title, url }
        }
        if (isError(value)) {
            const { error } = value
            throw new Error(error)
        }
        const { title, url } = value
        return { title, url }
    }
}