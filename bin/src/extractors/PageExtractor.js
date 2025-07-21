"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageExtractor = void 0;
const Page_1 = require("../page/Page");
const AbstractExtractor_1 = require("./AbstractExtractor");
const PageFetcher_1 = require("../page/PageFetcher");
class PageExtractor extends AbstractExtractor_1.AbstractExtractor {
    constructor() { super("page-extractor"); }
    async extract(value) {
        if ((0, PageFetcher_1.isJSDOM)(value)) {
            const { window: { document: { title, location: { href: url } } } } = value;
            return { title, url };
        }
        if ((0, Page_1.isError)(value)) {
            const { error } = value;
            throw new Error(error);
        }
        const { title, url } = value;
        return { title, url };
    }
}
exports.PageExtractor = PageExtractor;
//# sourceMappingURL=PageExtractor.js.map