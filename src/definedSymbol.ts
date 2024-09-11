export type SymbolValue = number | string | boolean | null;

export class DefinedSymbol {
    #symbol: string = "";
    #value: SymbolValue = null;
    #isActive: boolean = true;
    constructor(symbol: string, value: SymbolValue = null, isActive: boolean = true) {
        this.#symbol = symbol;
        this.#value = value;
    }
    get symbol() { return this.#symbol; }
    get value() { return this.#value; }
    get isActive() { return this.#isActive; }
    set isActive(value: boolean) { this.#isActive = value; }
}
