import blessed from 'blessed';
import { Resource } from "./tags";

export interface PageContent {
    title: string;
    url: string;
    resources: Resource[];
}

export class PageContentPrinter {
    print(...contents: PageContent[]) {
        this.list = blessed.list({
            parent: this.screen,
            alignment: 'center',
            padding: 2,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            style: {
                fg: '#fff',
                bg: '#000'
            }
        });
    }
    screen: blessed.Widgets.Screen;
    list: blessed.Widgets.ListElement;
    constructor() {
        this.screen = blessed.screen({
            width: '100%',
            height: '100%',
            title: 'Page Content Printer',
            border: 'line'
        });

    }
}