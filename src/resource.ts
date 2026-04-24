/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 *
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */
type Tags = HTMLElementTagNameMap;

export const RESOURCE_DISPLAYABLE_KEYS = [
  'id',
  'innerText',
  'textContent',
  'class',
  'ariaLabel',
  'ariaDescription',
  'alt',
] as const;

export type DisplayableKey = (typeof RESOURCE_DISPLAYABLE_KEYS)[number];

export const RESOURCE_LINK_KEYS = ['href', 'data-src', 'target', 'action', 'src', 'url'] as const;

export type LinkKey = (typeof RESOURCE_LINK_KEYS)[number];

export type AttributeKey = DisplayableKey | LinkKey;

export type ResourceKey = { key: AttributeKey; value: string };
export type ResourceLink = { key: LinkKey; value: string };

export type ExternalResource = {
  text: ResourceKey;
  link: ResourceLink;
};

export type Tag = keyof Tags;

export type Resource = HTMLElement & {
  [K in AttributeKey]?: string | null;
};

export type ResourceByName<T extends keyof Tags> = Tags[T];

// --- adapters ---

const readAttr = (element: Resource, key: AttributeKey): string | undefined => {
  const v = element.getAttribute(key);
  return v != null && v.trim() !== '' ? v : undefined;
};

export function findResourceText(element: Resource): ResourceKey | undefined {
  for (const key of RESOURCE_DISPLAYABLE_KEYS) {
    const value = readAttr(element, key);
    if (value !== undefined) return { key, value };
  }
  return undefined;
}

export function findResourceLink(element: Resource): ResourceLink | undefined {
  for (const key of RESOURCE_LINK_KEYS) {
    const value = readAttr(element, key);
    if (value !== undefined) return { key, value };
  }
  return undefined;
}

export const isResourceKey = (key: string): key is AttributeKey =>
  (RESOURCE_DISPLAYABLE_KEYS as readonly string[]).includes(key) ||
  (RESOURCE_LINK_KEYS as readonly string[]).includes(key);
