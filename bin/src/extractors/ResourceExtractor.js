"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceExtractor = void 0;
const resource_1 = require("../resource");
const AbstractExtractor_1 = require("./AbstractExtractor");
class ResourceExtractor extends AbstractExtractor_1.AbstractExtractor {
    tags;
    constructor(tags) {
        super("page-extractor");
        this.tags = tags;
    }
    async extract(value) {
        const { document } = value.window;
        const externalResources = [];
        for (const tag of this.tags) {
            const selector = document.querySelectorAll(tag);
            const elements = Array.from(selector);
            for (const element of elements) {
                const text = (0, resource_1.findResourceText)(element);
                const link = (0, resource_1.findResourceLink)(element);
                if (!text || !link)
                    continue;
                if (!link.url.startsWith("http"))
                    continue;
                externalResources.push({ text, link });
            }
        }
        return externalResources;
    }
}
exports.ResourceExtractor = ResourceExtractor;
//# sourceMappingURL=ResourceExtractor.js.map