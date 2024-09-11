import { DefinedSymbol, SymbolValue } from "./definedSymbol";

export interface IConditionNode {
    evaluate(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]): boolean;
}

export class AndNode implements IConditionNode {
    #left: IConditionNode;
    #right: IConditionNode;
    constructor(left: IConditionNode, right: IConditionNode) {
        this.#left = left;
        this.#right = right;
    }
    evaluate(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]): boolean {
        return this.#left.evaluate(defines, knownSymbols) && this.#right.evaluate(defines, knownSymbols);
    }
}

export class OrNode implements IConditionNode {
    #left: IConditionNode;
    #right: IConditionNode;
    constructor(left: IConditionNode, right: IConditionNode) {
        this.#left = left;
        this.#right = right;
    }
    evaluate(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]): boolean {
        return this.#left.evaluate(defines, knownSymbols) || this.#right.evaluate(defines, knownSymbols);
    }
}

export class NotNode implements IConditionNode {
    #expression: IConditionNode;
    constructor(expression: IConditionNode) {
        this.#expression = expression;
    }
    evaluate(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]): boolean {
        return !this.#expression.evaluate(defines, knownSymbols);
    }
}

export class DefinedNode implements IConditionNode {
    #symbol: string = "";
    constructor(symbol: string) {
        this.#symbol = symbol;
    }

    evaluate(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]): boolean {
        return defines.some(d => d.symbol === this.#symbol);
    }
    get symbol() { return this.#symbol; }
}

export class Expression implements IConditionNode {
    #token: string = "";
    #symbol: string = "";
    #opeartor: string = "";
    #leftSymbol: string = "";
    #rightSymbol: string = "";
    constructor(token: string) {
        this.#token = token;
        const compares = ["==", "!=", ">=", "<=", ">", "<"];
        for (let i = 0; i < compares.length; i++) {
            const index = this.#token.indexOf(compares[i]);
            if (index !== -1) {
                this.#leftSymbol = this.#token.slice(0, index);
                this.#rightSymbol = this.#token.slice(index + compares[i].length);
                this.#opeartor = compares[i];
                return;
            }
        }

        const hasNot = this.#token.includes("!");
        if (hasNot) {
            this.#symbol = this.#token.slice(1);
            this.#opeartor = "!";
        } else {
            this.#symbol = this.#token;
            this.#opeartor = "";
        }
    }

    evaluate(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]): boolean {
        if (this.#opeartor === "!" || this.#opeartor === "") {
            const value = Expression.#evaluateSymbol(defines, this.#symbol);
            if (value === undefined) {
                return false;
            }

            if (this.#opeartor === "!") {
                return !value;
            } else {
                return value as boolean;
            }
        }

        const left = Expression.#evaluateSymbol(defines, this.#leftSymbol);
        const right = Expression.#evaluateSymbol(defines, this.#rightSymbol);
        if (left === undefined || right === undefined) {
            return false;
        }

        switch (this.#opeartor) {
            case "==":
                return left === right;
            case "!=":
                return left !== right;
            case ">=":
                return (left as number) >= (right as number);
            case "<=":
                return (left as number) <= (right as number);
            case ">":
                return (left as number) > (right as number);
            case "<":
                return (left as number) < (right as number);
        }

        return false;
    }

    static #evaluateSymbol(defines: DefinedSymbol[], symbol: string): SymbolValue | undefined {
        const intLiteral = parseInt(symbol);
        if (!isNaN(intLiteral)) {
            return intLiteral;
        }
        const define = defines.find(d => d.symbol === symbol);
        if (define === undefined || define.value === null) {
            return undefined;
        }
        return define.value;
    }
}