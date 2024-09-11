import { DefinedSymbol } from './definedSymbol';
export class ShaderDefinition {
    #name: string = "";
    #defines: DefinedSymbol[] = [];
    constructor(name: string, defines: DefinedSymbol[]) {
        this.#name = name;
        this.#defines = defines;
    }

    get name() {
        return this.#name;
    }

    get defines() {
        return this.#defines;
    }

    static Parse(json: { name: string, VS: string, PS: string }) {
        const defineSet = new Set<string>();
        const gatherDefines = (definesStr: string) => {
            definesStr.split(' ').forEach(line => {
                const define = line.trim();
                if (define.startsWith("-D")) {
                    defineSet.add(define.substring(2));
                }
            });
        };
        gatherDefines(json.VS);
        gatherDefines(json.PS);

        return new ShaderDefinition(json.name, Array.from(defineSet).map((d: string) => new DefinedSymbol(d)) as DefinedSymbol[]);
    }

    toString() {
        return this.#name + " " + this.#defines.join(" ");
    }
}

class Shader {
    name: string;
    VS: string[];
    PS: string[];
    constructor(name: string = "", VS: string[] = ["", "", ""], PS: string[] = ["", "", ""]) {
        this.name = name;
        this.VS = VS;
        this.PS = PS;
    }
}

export class SdfAnalyzer {
    static analyze(content: string) {
        let combineResult = [new Shader()];
        const sdf = JSON.parse(content.toString());
        for (let i = 0; i < sdf.ShaderCombiners.length; i++) {
            const combiner = sdf.ShaderCombiners[i].ShaderStages;
            combineResult = SdfAnalyzer.#combine(combineResult, combiner);
        }
        const result: ShaderDefinition[] = [];
        combineResult.forEach(combine => {
            result.push(ShaderDefinition.Parse({ "name": combine.name, "VS": combine.VS[2], "PS": combine.PS[2] }));
        });
        return result;
    }

    static #combine(combineA: Shader[], combineB: Shader[]) {
        const result = [];
        for (let aIdx = 0; aIdx < combineA.length; aIdx++) {
            const srcA = combineA[aIdx];
            for (let bIdx = 0; bIdx < combineB.length; bIdx++) {
                const srcB = combineB[bIdx];
                result.push({
                    name: srcA.name + srcB.name,
                    VS: ["", "", srcA.VS[2] + " " + srcB.VS[2]],
                    PS: ["", "", srcA.PS[2] + " " + srcB.PS[2]]
                });
            }
        }
        return result;
    }
}