import { ConditionParser } from "./conditionParser";
import { DefinedSymbol, IConditionNode } from "./conditions";

export class CodeNode {
    #token: string = "";
    #condition: IConditionNode | null = null;
    #begin: number = 0;
    #end: number = 0;
    #children: CodeNode[] = [];

    constructor(token: string = "", conditionStr: string = "", begin: number = -1, end: number = -1) {
        this.#token = token;
        this.#begin = begin;
        this.#end = end;
        if (conditionStr !== "") {
            this.#condition = ConditionParser.parseCondition(conditionStr);
        } else {
            this.#condition = null;
        }
    }

    // if elif else endifの兄弟をまとめるために挿入されたノードかどうか。
    get isPlaceHolder() { return this.#token === "" && this.#begin == -1 && this.#end == -1; }
    get children() { return this.#children; }
    get token() { return this.#token; }
    get condition() { return this.#condition; }
    get hasCondition() { return this.#condition !== null; }
    get begin() { return this.#begin; }
    get end() { return this.#end; }

    getRawCode(code: string) {
        if (this.#begin == -1 || this.#end == -1) {
            let result = this.#token;
            for (let i = 0; i < this.#children.length; i++) {
                result += this.#children[i].getRawCode(code);
            }
            return result;
        } else {
            return code.substring(this.#begin, this.#end);
        }
    }

    getProcessedCode(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[], code: string): string {
        // 子供がいるのは条件文があるときのみ。
        // if elif elif ... else endif.のつらなり。
        // 最大で1つの子供が評価される(0個の場合もある)
        if (this.#children.length > 0) {
            for (let i = 0; i < this.#children.length; i++) {
                let child = this.#children[i];
                if (child.evaluateCondition(defines, knownSymbols)) {
                    return child.getProcessedCode(defines, knownSymbols, code);
                }
            }
            return "";
        } else {
            // 子供がいないのは条件文がないときであり、自分の文字列を持っている。
            return code.substring(this.#begin, this.#end);
        }
    }

    evaluateCondition(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]) {
        if (this.#condition === null) {
            return true;
        }
        return this.#condition.evaluate(defines, knownSymbols);
    }
}