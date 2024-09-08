import * as vscode from 'vscode';
import { DefinedSymbol } from './conditions';
import { HLSLParser } from './hlslParser';

export class PHlslProvider implements vscode.TextDocumentContentProvider {
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): string {
        const defines = [];
        defines.push(new DefinedSymbol("FEATURE_LEVEL", 5));
        defines.push(new DefinedSymbol("FEATURE_LEVEL_SM5", 1));
        defines.push(new DefinedSymbol("MATERIAL_SINGLE_SHADINGMODEL", 1));
        defines.push(new DefinedSymbol("MATERIAL_SHADINGMODEL_HAIR", 0));
        defines.push(new DefinedSymbol("MATERIAL_SHADINGMODEL_SINGLELAYERWATER", 0));
        defines.push(new DefinedSymbol("FORWARD_SHADING", 0));
        defines.push(new DefinedSymbol("PRIMTIVE_BILLBOARD"));
        defines.push(new DefinedSymbol("TEXTURE_BLEND"));
        const text = vscode.window.activeTextEditor!.document.getText();
        const hlsl = HLSLParser.parse(text);
        return hlsl.getProcessedCode(defines, []);
    }
}
