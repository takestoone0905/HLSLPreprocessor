import * as vscode from 'vscode';
import { DefinedSymbol } from './definedSymbol';
import { ShaderDefinition } from './sdfAnalyzer';
export class ShaderDefineEntry extends vscode.TreeItem {
    constructor(
        public readonly model: DefinedSymbol,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(model.symbol, collapsibleState);
        this.checkboxState = model.isActive ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
    }

    get name() {
        return this.model.symbol;
    }
}
type ShaderDefineProviderEventType = ShaderDefineEntry | undefined | null | void;
export class ShaderDefineProvider implements vscode.TreeDataProvider<ShaderDefineEntry> {
    private _onDidChangeTreeData: vscode.EventEmitter<ShaderDefineProviderEventType> = new vscode.EventEmitter<ShaderDefineProviderEventType>();
    readonly onDidChangeTreeData: vscode.Event<ShaderDefineProviderEventType> = this._onDidChangeTreeData.event;
    public currentShader: ShaderDefinition | null = null;

    constructor() { }

    showShaderDefinition(shader: ShaderDefinition | null) {
        this.currentShader = shader;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ShaderDefineEntry): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ShaderDefineEntry): Thenable<ShaderDefineEntry[]> {
        if (!element) {
            const result: ShaderDefineEntry[] = [];
            if (this.currentShader) {
                for (const key of this.currentShader.defines) {
                    result.push(new ShaderDefineEntry(key, vscode.TreeItemCollapsibleState.None));
                }
            }
            return Promise.resolve(result);
        } else {
            return Promise.resolve([]);
        }
    }

    addDefine(symbol: string) {
        if (this.currentShader && this.currentShader.isUserCustom && !this.currentShader.defines.find((define) => define.symbol === symbol)) {
            this.currentShader.defines.push(new DefinedSymbol(symbol));
            this._onDidChangeTreeData.fire();
        }
    }

    removeDefine(symbol: string) {
        if (this.currentShader && this.currentShader.isUserCustom) {
            const index = this.currentShader.defines.findIndex((define) => define.symbol === symbol);
            if (index >= 0) {
                this.currentShader.defines.splice(index, 1);
                this._onDidChangeTreeData.fire();
            }
        }
    }
}