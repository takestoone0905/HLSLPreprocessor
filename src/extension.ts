import * as vscode from 'vscode';
import { PHlslProvider } from './phlslProvider';
import { ShaderDefinition } from './sdfAnalyzer';
import { SdfAnalyzer } from './sdfAnalyzer';
import { ShaderListEntry, ShaderTreeProvider } from './shaderTreeProvider';
import { ShaderDefineEntry, ShaderDefineProvider } from './ShaderDefineProvider';

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
		vscode.commands.registerCommand('hlslpreprocessor.showCode', async (element) => {
			const selectedEntry = element as ShaderListEntry;
			if (!selectedEntry) {
				return;
			}
			phlslProvider.currentDefines = selectedEntry.shaderDefinition!.defines.filter((define) => define.isActive);
			const name = vscode.window.activeTextEditor!.document.fileName;
			let uri = vscode.Uri.parse('phlsl:' + name + "(processed)");
			if (vscode.workspace.textDocuments.find((doc) => doc.uri.toString() === uri.toString())) {
				phlslProvider.onDidChangeEmitter.fire(uri);
			}
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc, { preview: false });
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.addUserCustomShader', () => {
			vscode.window.showInputBox().then((name) => {
				if (!name) {
					return;
				}
				shaderTreeProvider.addShader(name);
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.removeUserCustomShader', (element) => {
			shaderTreeProvider.removeShader(element.name);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.addDefinedSymbol', () => {
			vscode.window.showInputBox().then((symbol) => {
				if (!symbol) {
					return;
				}
				shaderDefineProvider.addDefine(symbol!);
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.removeDefinedSymbol', (element) => {
			shaderDefineProvider.removeDefine(element.name);
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
