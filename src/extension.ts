import * as vscode from 'vscode';
import { PHlslProvider } from './phlslProvider';
import { ShaderDefinition } from './sdfAnalyzer';
import { SdfAnalyzer } from './sdfAnalyzer';
import { ShaderTreeProvider } from './shaderTreeProvider';
import { ShaderDefineProvider } from './ShaderDefineProvider';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "hlslpreprocessor" is now active!');
	const phlslProvider = new PHlslProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('phlsl', phlslProvider));

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.showCode', async () => {
			const name = vscode.window.activeTextEditor!.document.fileName;
			let uri = vscode.Uri.parse('phlsl:' + name + "(processed)");
			if (vscode.workspace.textDocuments.find((doc) => doc.uri.toString() === uri.toString())) {
				phlslProvider.onDidChangeEmitter.fire(uri);
			}
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc, { preview: false });
		})
	);


	const shaderDefineProvider = new ShaderDefineProvider();
	vscode.window.registerTreeDataProvider(
		'shaderDefinesView',
		shaderDefineProvider
	);


	const shaderTreeProvider = new ShaderTreeProvider();
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


	const disposable = vscode.commands.registerCommand('hlslpreprocessor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HlslPreprocessor!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
