import { JSDOM } from 'jsdom';
import { AbstractExtractor } from '../AbstractExtractor';
import type { GetKey } from '../tags';

export class ByClassNameExtractor<T extends string, R extends GetKey<T, C>, C = HTMLElementTagNameMap> extends AbstractExtractor<JSDOM, R[]> {
    extract(value: JSDOM): Promise<R[]> {
        const linkNodes = value.window.document.getElementsByTagName(this.tagName);
        const links = Array.from(linkNodes).map(node => node as R);
        return Promise.resolve(links);
    }
    constructor(private readonly tagName: T) {
        super(`TagByName<${tagName}>`)
    };

}