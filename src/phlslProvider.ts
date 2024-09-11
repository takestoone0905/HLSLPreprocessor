import * as vscode from 'vscode';
import { DefinedSymbol } from './definedSymbol';
import { HLSLParser } from './hlslParser';

export class PHlslProvider implements vscode.TextDocumentContentProvider {
    public currentDefines: DefinedSymbol[] = [];

    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): string {
        const text = vscode.window.activeTextEditor!.document.getText();
        const hlsl = HLSLParser.parse(text);
        return hlsl.getProcessedCode(this.currentDefines, []);
    }
}
