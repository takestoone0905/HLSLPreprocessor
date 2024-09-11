import { CodeNode } from "./hlslCodeTree";
import { DefinedSymbol } from "./definedSymbol";

export class HLSLFile {
    #rawCode: string;
    #codeNodes: CodeNode[];
    constructor(rawCode: string, codeNodes: CodeNode[]) {
        this.#rawCode = rawCode;
        this.#codeNodes = codeNodes;
    }
    get rawCode() { return this.#rawCode; }

    getProcessedCode(defines: DefinedSymbol[], knownSymbols: DefinedSymbol[]) {
        let result = "";
        for (let i = 0; i < this.#codeNodes.length; i++) {
            const code = this.#codeNodes[i].getProcessedCode(defines, knownSymbols, this.#rawCode);
            result += code;
        }
        return result;
    }

    debugNodes() {
        let result = "<details>";
        const dumpNode = (node: CodeNode) => {
            if (node.children.length === 0) {
                result += `<li>${node.begin}-${node.end}</li>`;
            } else {
                result += `<details><summary>${node.token === "" ? "(empty)" : node.token + " " + node.condition}</summary>`;
                result += "<ul>";
                node.children.forEach(child => {
                    dumpNode(child);
                });
                result += "</ul>";
                result += "</details>";
            }
        }
        this.#codeNodes.forEach(node => {
            dumpNode(node);
        });
        result += "</details>";
        console.log(result);
    }
}
