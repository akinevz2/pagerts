/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 * 
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */

type Tags = HTMLElementTagNameMap

function findDefinedKey(element: Resource, keys: LinkKey[]): LinkKey | undefined {
    for (const key of keys) {
        if (isKeyDefined(key, element)) {
            return key;
        }
    }
}

export const RESOURCE_DISPLAYABLE_KEYS = [
    'id',
    'innerText',
    'textContent',
    'class',
    'ariaLabel',
    'ariaDescription',
    'alt',
    'rel'
] as const;

export type DisplayableKey = (typeof RESOURCE_DISPLAYABLE_KEYS)[number];

export type ResourceKey = {
    key: DisplayableKey;
    value: string;
};

export const RESOURCE_LINK_KEYS = [
    "href",
    "data-src",
    "target",
    "action",
    "src",
    "url"
] as const;

export type LinkKey = typeof RESOURCE_LINK_KEYS[number];

export type ResourceLink = {
    key: LinkKey;
    url: string;
}

export function findResourceText(element: Resource): ResourceKey | undefined {
    for (const key of RESOURCE_DISPLAYABLE_KEYS) {
        const value = element[key]
        if (value && typeof value === 'string' && value.trim() !== '')
            return { key, value };
    }
}

export function findResourceLink(element: Resource): ResourceLink | undefined {
    const key = findDefinedKey(element, [...RESOURCE_LINK_KEYS]);
    const url = element[key];
    if (url && typeof url === 'string' && url.trim() !== '')
        return { key, url };
}

export type ExternalResource = {
    text: ResourceKey;
    link: ResourceLink;
};

export const isResourceKey = (key: string): key is LinkKey => key in RESOURCE_LINK_KEYS;

export const isKeyDefined = <E extends Tags[keyof Tags]>(key: string, element: E): boolean =>
    key in element && element[key] !== undefined;

export type ResourceElement<T, U> = {
    [K in keyof T]: U extends keyof T[K] ? T[K] : never
}[keyof T];

export type Tag = keyof Tags

export type Resource = ResourceElement<Tags, (typeof RESOURCE_LINK_KEYS)[number]>;

export type ResourceByName<T extends keyof Tags> = Tags[T]

/** tests **/

type test1 = HTMLAnchorElement extends Resource ? true : false // true
type test2 = HTMLImageElement extends Resource ? true : false // true
type test3 = HTMLDivElement extends Resource ? true : false // false

type test4 = ResourceElement<Tags, "src">

