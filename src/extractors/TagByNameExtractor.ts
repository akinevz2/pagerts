import { JSDOM } from 'jsdom';
import { DocumentExtractor } from '../DocumentExtractor';
import type { IsTag } from '../tags';

export class TagByNameExtractor<T extends string, R extends IsTag<T,C>, C = HTMLElementTagNameMap> implements DocumentExtractor<R> {
    constructor(private readonly tagName: T) { };
    execute(dom: JSDOM): Promise<R[]> {
        console.debug(`Extracting ${this.tagName} tags from DOM...`)
        const linkNodes = dom.window.document.getElementsByName(this.tagName);
        const links = Array.from(linkNodes).map(node => node as R);
        console.debug(`${links.length} ${this.tagName} tags found.`)
        return Promise.resolve(links);
    }

}