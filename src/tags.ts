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

export type GetKey<C, K> = K extends keyof C ? C[K] : never;

export type IfContainsKey<U, C> = { [K in keyof C]: K extends U ? C : never }[keyof C];

export type IsResource<U, K, C> = IfContainsKey<U, GetKey<C, K>>;

export type Resources<KU, C> = { [K in keyof C]: IsResource<KU, K, C> }[keyof C];

export type Resource = Resources<ResourceKey, Tags>;


export function isKeyDefined<T extends string = ResourceKey>(element: HTMLElement, key: T): element is Resource {
    return key in element && (element[key as string]?.trim() ?? '' !== '')
}

type test1 = keyof 'a' | 'b'
