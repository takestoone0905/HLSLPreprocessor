import * as vscode from 'vscode';
import { SdfAnalyzer, ShaderDefinition } from './sdfAnalyzer';

class ShaderEntry {
    constructor(public readonly shaderDefinition: ShaderDefinition) {
    }

    get name() {
        return this.shaderDefinition.name;
    }
}

class VsdfFile {
    constructor(public readonly name: string) {

    }
}

export class ShaderListEntry extends vscode.TreeItem {
    constructor(
        public readonly model: ShaderEntry | VsdfFile,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(model.name, collapsibleState);
        if (this.isFile) {
            this.contextValue = 'vsdf';
        } else {
            this.contextValue = model.name === 'USER CUSTOM' ? 'USER CUSTOM' : 'shader';
        }
        this.tooltip = `${this.name}-Hello!`;
        this.description = `${this.name}ですよ`;
    }

    get name() {
        return this.model.name;
    }

    get isFile() {
        return this.model instanceof VsdfFile;
    }

    get isShader() {
        return this.model instanceof ShaderEntry;
    }

    get shaderDefinition() {
        return this.model instanceof ShaderEntry ? this.model.shaderDefinition : null;
    }
}
type ShaderTreeProviderEventType = ShaderListEntry | undefined | null | void;
export class ShaderTreeProvider implements vscode.TreeDataProvider<ShaderListEntry> {
    #shaderMap: Map<string, ShaderDefinition[]> = new Map<string, ShaderDefinition[]>();
    private _onDidChangeTreeData: vscode.EventEmitter<ShaderTreeProviderEventType> = new vscode.EventEmitter<ShaderTreeProviderEventType>();
    readonly onDidChangeTreeData: vscode.Event<ShaderTreeProviderEventType> = this._onDidChangeTreeData.event;
    constructor() { }

    async refresh() {
        return this.loadShaderList().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    async loadShaderList() {
        const toFileName = (uri: vscode.Uri) => uri.toString().split('/').pop()!;
        const shaderMap: Map<string, ShaderDefinition[]> = new Map<string, ShaderDefinition[]>();
        const promises: any[] = [];
        await vscode.workspace.findFiles('**/*.vsdf.json').then((uris) => {
            uris.forEach((uri) => {
                promises.push(
                    vscode.workspace.fs.readFile(uri).then((content: any) => {
                        const fileName = toFileName(uri);
                        shaderMap.set(fileName, []);
                        const analyzeResult = SdfAnalyzer.analyze(content);
                        for (let i = 0; i < analyzeResult.length; i++) {
                            shaderMap.get(fileName)!.push(analyzeResult[i]);
                        }
                    })
                );
            });
        });
        await Promise.all(promises);
        // userがカスタムのdefineの組み合わせを作成できるようにする
        shaderMap.set("USER CUSTOM", []);
        this.#shaderMap = shaderMap;
    }

    getTreeItem(element: ShaderListEntry): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ShaderListEntry): Thenable<ShaderListEntry[]> {
        if (!element) {
            const result: ShaderListEntry[] = [];
            for (const key of this.#shaderMap.keys()) {
                result.push(new ShaderListEntry(new VsdfFile(key), vscode.TreeItemCollapsibleState.Collapsed));
            }
            return Promise.resolve(result);
        } else {
            const shaderFile = element.model as VsdfFile;
            return Promise.resolve(this.#shaderMap.get(shaderFile.name)!.map(shader => new ShaderListEntry(new ShaderEntry(shader), vscode.TreeItemCollapsibleState.None)));
        }
    }
}