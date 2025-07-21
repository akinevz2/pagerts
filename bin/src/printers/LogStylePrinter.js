"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStylePrinter = void 0;
const Page_1 = require("../page/Page");
const AbstractResourcePrinter_1 = require("./AbstractResourcePrinter");
class LogStylePrinter extends AbstractResourcePrinter_1.AbstractResourcePrinter {
    write(str) {
        process.stdout.write(str);
    }
    async print(...pages) {
        for (const page of pages) {
            if (!(0, Page_1.isPage)(page)) {
                this.write(page.error);
                continue;
            }
            const { resources, title, url } = page;
            this.write(`Title: ${title}\n`);
            this.write(`URL: ${url}\n\n`);
            for (const resource of resources) {
                const { link: { url }, text: { value } } = resource;
                this.write(`${value}: ${url}\n`);
            }
        }
    }
}
exports.LogStylePrinter = LogStylePrinter;
//# sourceMappingURL=LogStylePrinter.js.map