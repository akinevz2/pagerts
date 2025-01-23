import { AbstractPageExtractor } from './AbstractPageExtractor';
import { ByClassNameExtractor } from './extractors/ByClassNameExtractor';

export default class PageExtractor extends AbstractPageExtractor {
    constructor(...tags: string[]) {
        super(tags.map(tag => new ByClassNameExtractor(tag)));
    }
}