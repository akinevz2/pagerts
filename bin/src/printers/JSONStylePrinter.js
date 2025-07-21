"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONStylePrinter = void 0;
const AbstractResourcePrinter_1 = require("./AbstractResourcePrinter");
class JSONStylePrinter extends AbstractResourcePrinter_1.AbstractResourcePrinter {
    print(...pages) {
        const json = JSON.stringify(pages);
        process.stdout.write(json + "\n");
    }
}
exports.JSONStylePrinter = JSONStylePrinter;
//# sourceMappingURL=JSONStylePrinter.js.map