"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageFetcher = exports.isMetadata = exports.isJSDOM = void 0;
const jsdom_1 = require("jsdom");
const isJSDOM = (page) => 'window' in page;
exports.isJSDOM = isJSDOM;
const isMetadata = (page) => 'url' in page && 'title' in page;
exports.isMetadata = isMetadata;
class PageFetcher {
    async fetchPage(url) {
        const dom = jsdom_1.JSDOM.fromURL(url, {
            virtualConsole: new jsdom_1.VirtualConsole().on('jsdomError', (error) => {
                process.stderr.write(`Error parsing ${url}:${error.message}\n`);
            })
        });
        return dom.catch(({ message }) => {
            return { url, error: `Not an HTML page: ${message}` };
        });
    }
    async fetchAll(urls) {
        return await Promise.all(urls.map(url => this.fetchPage(url)));
    }
    constructor() { }
}
exports.PageFetcher = PageFetcher;
//# sourceMappingURL=PageFetcher.js.map