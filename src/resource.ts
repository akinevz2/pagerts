/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 *
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */

type Tags = HTMLElementTagNameMap;
type Key = [keyof ((Tags)[keyof Tags])][number];

const RESOURCE_DISPLAYABLE_KEYS = [
  'id',
  'innerText',
  'textContent',
  'className',
  'ariaLabel',
  'ariaDescription',
  'alt',
  'rel',
] as const;

const RESOURCE_LINK_KEYS = ['href', 'action', 'src'] as const;
/** Link attributes with no DOM property; read through getAttribute. */
export const RESOURCE_LINK_ATTRIBUTES = ['data-src', 'url'] as const;
export type LinkAttribute = (typeof RESOURCE_LINK_ATTRIBUTES)[number];

export type ResourceKey = (typeof RESOURCE_DISPLAYABLE_KEYS)[number];

export type Displayable<T = string> = {
  key: ResourceKey;
  value: T;
};


type RESOURCE_LINK_IDXS = (typeof RESOURCE_LINK_KEYS)[number];
type KeysOfUnion<T> = T extends unknown ? keyof T : never;
export type LinkKey = Extract<RESOURCE_LINK_IDXS, KeysOfUnion<ResourceElement<Tags, (typeof RESOURCE_LINK_KEYS)[number]>>>;

export function isResourceKey(key: string): key is LinkKey {
  return (RESOURCE_LINK_KEYS as readonly string[]).includes(key);
}

export const LINK_PROPERTIES: readonly LinkKey[] = RESOURCE_LINK_KEYS.filter(isResourceKey);

export type ResourceLink<T extends Resource = Resource> =
  | (T extends unknown ? { [K in keyof T & LinkKey]: { key: K; url: T[K] } }[keyof T & LinkKey] : never)
  | { key: LinkAttribute; url: string };

export function findResourceLink<T extends Resource>(resource: T): ResourceLink<T> | undefined {
  for (const key of LINK_PROPERTIES) {
    if (!(key in resource)) continue;
    const url = resource[key as keyof T];
    if (typeof url === 'string' && url.trim() !== '') {
      return { key, url } as ResourceLink<T>;
    }
  }
  for (const key of RESOURCE_LINK_ATTRIBUTES) {
    const url = resource.getAttribute(key);
    if (url && url.trim() !== '') return { key, url };
  }
  return undefined;
}

export type External<R extends Resource> = {
  text: Displayable;
  link: ResourceLink<R>;
};

export const isKeyDefined = <K extends Key, E extends Record<K, unknown>>(key: K, element: E): boolean =>
  key in element && element[key] !== undefined;

export function find<T extends Resource, V extends Key>(element: T, keys: V[]): V | undefined {
  for (const key of keys) {
    if (isKeyDefined(key, element)) {
      return key;
    }
  }
  return undefined;
}

export type ResourceElement<T, U> = {
  [K in keyof T]: U extends keyof T[K] ? T[K] : never;
}[keyof T];

export type Tag = keyof Tags;

export type Resource = ResourceElement<Tags, LinkKey>;

export type ResourceByName<T extends keyof Tags> = Tags[T];

/** tests **/

type test1 = HTMLAnchorElement extends Resource ? true : false; // true
type test2 = HTMLImageElement extends Resource ? true : false; // true
type test3 = HTMLDivElement extends Resource ? true : false; // false

type test4 = ResourceElement<Tags, 'src'>;

export function findDisplayable(element: Resource): Displayable {
  for (const key of RESOURCE_DISPLAYABLE_KEYS) {
    const value: unknown = element[key as keyof Resource];
    if (typeof value === 'string' && value.trim() !== '') return { key, value: value.trim() };
  }
  return { key: 'textContent', value: '' };
}

/** Matches any element carrying at least one link attribute, e.g. `[href],[src],...` */
export const RESOURCE_SELECTOR = [...RESOURCE_LINK_KEYS, ...RESOURCE_LINK_ATTRIBUTES].map((key) => `[${key}]`).join(',');

export const isResource = (element: Element): element is Resource =>
  LINK_PROPERTIES.some((key) => key in element) ||
  RESOURCE_LINK_ATTRIBUTES.some((key) => element.hasAttribute(key));

export function queryResources(root: ParentNode = window.document): Resource[] {
  return Array.from(root.querySelectorAll(RESOURCE_SELECTOR)).filter(isResource);
}

export function extractExternal<R extends Resource>(resource: R): External<R> | undefined {
  const link = findResourceLink(resource);
  return link && { text: findDisplayable(resource), link };
}

export function queryExternals(root: ParentNode = window.document): External<Resource>[] {
  return queryResources(root).flatMap((resource) => extractExternal(resource) ?? []);
}
