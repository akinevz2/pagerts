#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const package_json_1 = require("../package.json");
const PageExtractor_1 = require("./extractors/PageExtractor");
const ResourceExtractor_1 = require("./extractors/ResourceExtractor");
const PageFetcher_1 = require("./page/PageFetcher");
const JSONStylePrinter_1 = require("./printers/JSONStylePrinter");
const program = new commander_1.Command();
const url = (0, commander_1.createArgument)("<url|file...>", "remote URL or local file to extract remote resources from");
(async () => {
    await program
        .name(package_json_1.name)
        .version(package_json_1.version, "-v, --version")
        .description(package_json_1.description)
        .addArgument(url)
        .action(async (urls) => {
        const printer = new JSONStylePrinter_1.JSONStylePrinter();
        // simple log style printer
        // const printer = new LogStylePrinter();
        const pageFetcher = new PageFetcher_1.PageFetcher();
        const pageExtractor = new PageExtractor_1.PageExtractor();
        const resourceExtractor = new ResourceExtractor_1.ResourceExtractor(["a", "meta", "link", "embed"]);
        const pageResponses = await pageFetcher.fetchAll(urls);
        const pageMetadatas = [];
        for (const page of pageResponses) {
            // check if page has an error
            if ((0, PageFetcher_1.isJSDOM)(page)) {
                const resources = await resourceExtractor.extract(page);
                const descriptor = await pageExtractor.extract(page);
                pageMetadatas.push({
                    ...descriptor, resources
                });
            }
            else
                pageMetadatas.push({
                    ...page, resources: []
                });
        }
        await printer.print(...pageMetadatas);
    })
        .parseAsync(process.argv);
})();
//# sourceMappingURL=main.js.map