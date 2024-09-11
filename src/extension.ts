import * as vscode from 'vscode';
import { PHlslProvider } from './phlslProvider';
import { ShaderDefinition } from './sdfAnalyzer';
import { SdfAnalyzer } from './sdfAnalyzer';
import { ShaderTreeProvider } from './shaderTreeProvider';
import { ShaderDefineProvider } from './ShaderDefineProvider';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "hlslpreprocessor" is now active!');
	const shaderDefineProvider = new ShaderDefineProvider();
	{
		vscode.window.registerTreeDataProvider(
			'shaderDefinesView',
			shaderDefineProvider
		);
		const treeView = vscode.window.createTreeView('shaderDefinesView', { treeDataProvider: shaderDefineProvider });
		treeView.onDidChangeCheckboxState((e) => {
			for (const element of e.items) {
				element[0].model.isActive = element[1] === vscode.TreeItemCheckboxState.Checked;
			}
		});
	}

	const shaderTreeProvider = new ShaderTreeProvider();
	{
		await shaderTreeProvider.loadShaderList();
		vscode.window.registerTreeDataProvider(
			'shaderTreeView',
			shaderTreeProvider
		);

		const treeView = vscode.window.createTreeView('shaderTreeView', { treeDataProvider: shaderTreeProvider });
		treeView.onDidChangeSelection((e) => {
			const selected = e.selection[0];
			if (selected && selected.isShader) {
				shaderDefineProvider.showShaderDefinition(selected.shaderDefinition);
			}
		});
		context.subscriptions.push(treeView);

		context.subscriptions.push(
			vscode.commands.registerCommand('hlslpreprocessor.loadVsdf', () => {
				shaderTreeProvider.refresh();
			})
		);
	}

	const phlslProvider = new PHlslProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('phlsl', phlslProvider));

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.showCode', async () => {
			if (shaderDefineProvider.currentShader === null) {
				return;
			}
			const defines = shaderDefineProvider.currentShader.defines.filter((define) => define.isActive);
			phlslProvider.currentDefines = defines;
			const name = vscode.window.activeTextEditor!.document.fileName;
			let uri = vscode.Uri.parse('phlsl:' + name + "(processed)");
			if (vscode.workspace.textDocuments.find((doc) => doc.uri.toString() === uri.toString())) {
				phlslProvider.onDidChangeEmitter.fire(uri);
			}
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc, { preview: false });
		})
	);


	const disposable = vscode.commands.registerCommand('hlslpreprocessor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HlslPreprocessor!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
