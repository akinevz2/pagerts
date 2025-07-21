"use strict";
/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 *
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKeyDefined = exports.isResourceKey = exports.RESOURCE_LINK_KEYS = exports.RESOURCE_DISPLAYABLE_KEYS = void 0;
exports.findResourceText = findResourceText;
exports.findResourceLink = findResourceLink;
function findDefinedKey(element, keys) {
    for (const key of keys) {
        if ((0, exports.isKeyDefined)(key, element)) {
            return key;
        }
    }
}
exports.RESOURCE_DISPLAYABLE_KEYS = [
    'id',
    'innerText',
    'textContent',
    'class',
    'ariaLabel',
    'ariaDescription',
    'alt',
    'rel'
];
exports.RESOURCE_LINK_KEYS = [
    "href",
    "data-src",
    "target",
    "action",
    "src",
    "url"
];
function findResourceText(element) {
    for (const key of exports.RESOURCE_DISPLAYABLE_KEYS) {
        const value = element[key];
        if (value && typeof value === 'string' && value.trim() !== '')
            return { key, value };
    }
}
function findResourceLink(element) {
    const key = findDefinedKey(element, [...exports.RESOURCE_LINK_KEYS]);
    const url = element[key];
    if (url && typeof url === 'string' && url.trim() !== '')
        return { key, url };
}
const isResourceKey = (key) => key in exports.RESOURCE_LINK_KEYS;
exports.isResourceKey = isResourceKey;
const isKeyDefined = (key, element) => key in element && element[key] !== undefined;
exports.isKeyDefined = isKeyDefined;
//# sourceMappingURL=resource.js.map