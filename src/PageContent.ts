import blessed from 'blessed';
import { Resource } from "./tags";

export interface PageContent {
    title: string;
    url: string;
    resources: Resource[];
}

export class PageContentPrinter {
    screen: blessed.Widgets.Screen;
    list: blessed.Widgets.ListElement;
    constructor(private readonly pageContent: PageContent) {
        this.screen = blessed.screen({
            width: '100%',
            height: '100%',
            title: 'Page Content Printer',
            border: 'line'
        });
        
    }
}