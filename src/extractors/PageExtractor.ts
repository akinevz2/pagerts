import type { Page } from '../page/Page.ts';
import { JSDOM } from 'jsdom';
import { AbstractExtractor } from './AbstractExtractor';
import { isMetadata, type PageResponse } from '../page/PageFetcher.js';

export class PageExtractor extends AbstractExtractor<PageResponse, Page> {
    constructor() { super("page-extractor"); }

    async extract(value: PageResponse): Promise<Page> {
        if (isMetadata(value)) return {
            title: value.title,
            url: value.url
        };
        const { title, location: { href: url } } = value.window.document
        return {
            url,
            title,
        };
    }
}