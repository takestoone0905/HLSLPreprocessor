import { AndNode, DefinedNode, Expression, IConditionNode, NotNode, OrNode } from "./conditions";

export class ConditionParser {
    static test() {
        const conditonA = this.parseCondition("!(MATERIAL_SINGLE_SHADINGMODEL && MATERIAL_SHADINGMODEL_HAIR) && (!MATERIAL_SHADINGMODEL_SINGLELAYERWATER || FORWARD_SHADING)");
        const conditonB = this.parseCondition("FORWARD_SHADING || TRANSLUCENCY_LIGHTING_SURFACE_FORWARDSHADING || TRANSLUCENCY_LIGHTING_SURFACE_LIGHTINGVOLUME || MATERIAL_SHADINGMODEL_SINGLELAYERWATER");
        const conditonC = this.parseCondition("SIMPLE_FORWARD_DIRECTIONAL_LIGHT && !MATERIAL_SHADINGMODEL_SINGLELAYERWATER && !MATERIAL_SHADINGMODEL_THIN_TRANSLUCENT");
        const conditonD = this.parseCondition("FEATURE_LEVEL >= FEATURE_LEVEL_SM5");
        const conditonE = this.parseCondition("defined(PRIMTIVE_BILLBOARD) || defined(PRIMITIVE_POLYGON)");        
    }

    // ifdef専用のParse。ifndefの場合はinvertをtrueにする。
    static parseIfdefCondition(conditionStr: string, invert: boolean): IConditionNode {
        const trimmed = conditionStr.replaceAll(/\s/g, "");
        if (invert) {
            return new NotNode(new DefinedNode(trimmed));
        } else {
            return new DefinedNode(trimmed);
        }
    }

    // #if #elif専用のParse。
    static parseCondition(conditionStr: string) {
        // 簡単のため空白を削除、短絡評価を置換する。
        const trimmed = conditionStr.replaceAll(/\s/g, "").replaceAll("&&", "&").replaceAll("||", "|");
        return ConditionParser.#parseExpression(trimmed);
    }

    static #parseExpression(conditionStr: string): IConditionNode {
        // top-levelの演算子を見つける。 !,&,|,nullのいずれか。
        const findOperator = (str: string) => {
            let indent = 0;
            let operator = null;
            let index = -1;
            for (let i = 0; i < str.length; i++) {
                if (str[i] === "(") {
                    indent++;
                } else if (str[i] === ")") {
                    indent--;
                } else if (indent === 0) {
                    if (str[i] === "&" || str[i] === "|") {
                        return { "token": str[i], "index": i };
                    } else if (str[i] === "!") {
                        // &と|に比べて優先度が低い ⇒ Top-levelの演算子としては最弱。
                        // &と/が見つからない場合のために記憶しておくが、もし見つかればそちらを返す。
                        operator = "!";
                        index = i;
                    }
                }
            }

            // !が見つかっている場合。
            if (operator !== null) {
                return { "token": operator, "index": index };
            }
            return { "token": null, "index": -1 };
        }

        const operator = findOperator(conditionStr);
        switch (operator.token) {
            case "&":
                {
                    const left = this.#parseExpression(conditionStr.slice(0, operator.index));
                    const right = this.#parseExpression(conditionStr.slice(operator.index + 1));
                    return new AndNode(left, right);
                }
            case "|":
                {
                    const left = this.#parseExpression(conditionStr.slice(0, operator.index));
                    const right = this.#parseExpression(conditionStr.slice(operator.index + 1));
                    return new OrNode(left, right);
                }
            case "!":
                {
                    const expression = this.#parseExpression(conditionStr.slice(operator.index + 1));
                    return new NotNode(expression);
                }
            default:
                // 括弧で囲まれている場合、そぎ落とす。
                if (conditionStr.startsWith("(") && conditionStr.endsWith(")")) {
                    return this.#parseExpression(conditionStr.slice(1, conditionStr.length - 1));
                } else { // それすらない場合はこれが最小単位。
                    if (conditionStr.startsWith("defined(") && conditionStr.endsWith(")")) {
                        const symbol = conditionStr.slice(8, conditionStr.length - 1);
                        return new DefinedNode(symbol);
                    } else {
                        return new Expression(conditionStr);
                    }
                }
        }
    }

    static readCondition(sourceCode: string) {
        const result = new ConditionString();
        const lines = sourceCode.split("\r\n");
        for (let i = 0; i < lines.length; i++) {
            result.length += lines[i].length + 2; // 改行文字分の長さを足しておく。
            if (lines[i].endsWith("\\")) { // 末尾がバックスラッシュなら次の行も読み込む。
                result.condition += lines[i].slice(0, lines[i].length - 2).trim();
            } else {
                result.condition += lines[i].trim();
                break;
            }
        }
        return result;
    }
}

class ConditionString {
    #condition: string = "";
    #length: number = 0;
    constructor(condition: string = "", length: number = 0) {
        this.#condition = condition;
        this.#length = length;
    }
    get condition() { return this.#condition; }
    set condition(value: string) { this.#condition = value; }
    get length() { return this.#length; }
    set length(value: number) { this.#length = value; }
}