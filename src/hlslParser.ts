import { CodeNode } from "./hlslCodeTree";
import { HLSLFile } from "./hlslFile";
import { ConditionParser } from "./conditionParser";

class CodeSpan {
    #token: string;
    #index: number;
    constructor(token: string, index: number) {
        this.#token = token;
        this.#index = index;
    }
    get token() { return this.#token; }
    get index() { return this.#index; }
}

export class HLSLParser {
    static parse(code: string) {
        const spans = HLSLParser.#gatherPreprocessors(code);
        const codeNodes = HLSLParser.#buildHierarchy(spans, code);
        return new HLSLFile(code, codeNodes);
    }

    static #gatherPreprocessors(code: string) {
        const spans = [];
        const regex = RegExp("#ifdef|#ifndef|#elif|#else|#endif|#if", "g");
        let result;
        while ((result = regex.exec(code)) !== null) {
            spans.push(new CodeSpan(result[0], result.index));
        }
        return spans;
    }

    static #buildHierarchy(spans: CodeSpan[], code: string) {
        const result = [];
        let parent = null;

        // 一時的に親ノードを保持するためのマップ。
        const parentMap = new Map();
        const addNode = (parentNode: CodeNode, token: string, begin: number, end: number) => {
            const child = new CodeNode(token, "", begin, end);
            if (parentNode === null) {
                result.push(child);
                parentMap.set(child, null);
            } else {
                parentNode.children.push(child);
                parentMap.set(child, parentNode);
            }
            return child;
        }

        const addPlaceHolder = (parentNode: CodeNode, token: string) => {
            const child = new CodeNode(token, "", -1, -1);
            if (parentNode === null) {
                result.push(child);
                parentMap.set(child, null);
            } else {
                parentNode.children.push(child);
                parentMap.set(child, parentNode);
            }
            return child;
        }

        const addConditionNode = (parentNode: CodeNode, token: string, condition: string) => {
            const child = new CodeNode(token, condition, -1, -1);
            if (parentNode === null) {
                result.push(child);
                parentMap.set(child, null);
            } else {
                parentNode.children.push(child);
                parentMap.set(child, parentNode);
            }
            return child;
        }

        let prevEnd = 0;
        for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            // 最後のノードからこのノードまでの文字列を取り出して"条件なしノード"として切り出しておく。
            addNode(parent, "", prevEnd, span.index - 1);
            if (span.token === "#if" || span.token === "#ifdef" || span.token === "#ifndef") {
                // if,elif,...の兄弟を子に持つ空のノード挿入しておく。
                parent = addPlaceHolder(parent, "");
                // そして#ifノードを挿入する。
                const condition = ConditionParser.readCondition(code.substring(span.index + span.token.length));
                parent = addConditionNode(parent, span.token, condition.condition);
                prevEnd = span.index + span.token.length + condition.length;
            } else if (span.token === "#elif") {
                if (parent === null) { // elifなのだから親がいないとおかしい。
                    throw new Error("Invalid syntax.");
                }
                // ifの親である空ノードを取り出す。
                parent = parentMap.get(parent);
                // elifノードを挿入する。
                const condition = ConditionParser.readCondition(code.substring(span.index + span.token.length));
                parent = addConditionNode(parent, span.token, condition.condition);
                prevEnd = span.index + span.token.length + condition.length;
            } else if (span.token === "#else") {
                if (parent === null) { // elseなのだから親がいないとおかしい。
                    throw new Error("Invalid syntax.");
                }
                // ifの親である空ノードを取り出す。
                parent = parentMap.get(parent);
                // elseノードを挿入する。
                parent = addPlaceHolder(parent, span.token);
                prevEnd = span.index + span.token.length;
            } else if (span.token === "#endif") {
                if (parent === null) { // endifなのだから親がいないとおかしい。
                    throw new Error("Invalid syntax.");
                }
                // これはノードにならないで、親を戻すだけ。
                // ifの時に作った空ノードのそのまた親まで戻る。
                parent = parentMap.get(parentMap.get(parent));
                prevEnd = span.index + span.token.length;
            } else {
                throw new Error("Invalid syntax.");
            }
        }
        // 最後のノードを追加。
        result.push(new CodeNode("", "", prevEnd, code.length - 1));
        return result;
    }
}
