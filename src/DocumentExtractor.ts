import { JSDOM } from 'jsdom';

export abstract class DocumentExtractor<T> {
    abstract execute(dom: JSDOM): Promise<T[]>;
}
