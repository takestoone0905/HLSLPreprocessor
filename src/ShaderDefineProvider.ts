import * as vscode from 'vscode';
import { DefinedSymbol } from './conditions';
import { ShaderDefinition } from './sdfAnalyzer';
export class ShaderDefineEntry extends vscode.TreeItem {
    constructor(
        public readonly model: DefinedSymbol,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(model.symbol, collapsibleState);
        this.checkboxState = vscode.TreeItemCheckboxState.Checked;
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
                    result.push(new ShaderDefineEntry(new DefinedSymbol(key), vscode.TreeItemCollapsibleState.None));
                }
            }
            return Promise.resolve(result);
        } else {
            return Promise.resolve([]);
        }
    }
}