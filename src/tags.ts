/**
 * @license MIT
 * We are interested in visualising a page as a collection of tags.
 * 
 * We wish to work with tags that can be compactly previewed on a webpage.
 * Here we must declare all of the element types that can be used to represent
 * a resource that can be hyperlinked off a webpage.
 * 
 */


export type HasKey<K, T> = { [C in keyof T]: C extends K ? T : never }[keyof T];

type Tags = HTMLElementTagNameMap
export type IsTag<K, T> = K extends keyof T ? T[K] : never;

export type IsResource<T, K, C> = HasKey<T, IsTag<K, C>>;

export type ResourceElement<T, C> = { [K in keyof C]: IsResource<T, K, C> }[keyof C];

export type ResourceKey = 'href' | 'src' | 'url';
export type Resource = ResourceElement<ResourceKey, Tags>;

export function isResource<T extends R, R extends string = ResourceKey>(element: HTMLElement, key: T): element is ResourceElement<T, Tags> {
    return key in element
}


type test1 = IsTag<'a', Tags>;