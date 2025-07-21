
export abstract class AbstractExtractor<V, R> {
    constructor(readonly name:string) { }
    abstract extract(value: V): Promise<R>;
}
