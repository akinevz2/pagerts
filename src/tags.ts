/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 * 
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 */

type Tags = HTMLElementTagNameMap

export const resourceKeys = ['src', 'href', 'target', 'action', 'url'] as const;

export type ResourceKey = typeof resourceKeys[number];

export type HasKey<K, C> = K extends keyof C ? C[K] : never;

export type IfTagKey<T, C> = { [K in keyof C]: K extends T ? C : never }[keyof C];

export type IsResource<T, K, C> = IfTagKey<T, HasKey<K, C>>;

export type ResourceElement<T, C> = { [K in keyof C]: IsResource<T, K, C> }[keyof C];

export type Resource = ResourceElement<ResourceKey, Tags>;

export function isKeyDefined<T extends string = ResourceKey>(element: HTMLElement, key: T): element is ResourceElement<T, Tags> {
    return key in element && (element[key as string]?.trim() ?? '' !== '')
}

