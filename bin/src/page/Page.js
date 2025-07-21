"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPage = exports.isError = void 0;
const isError = (page) => 'error' in page;
exports.isError = isError;
const isPage = (page) => "resources" in page && Array.isArray(page.resources);
exports.isPage = isPage;
//# sourceMappingURL=Page.js.map