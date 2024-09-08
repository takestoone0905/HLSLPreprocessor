import * as vscode from 'vscode';
import { PHlslProvider } from './phlslProvider';
import { ShaderDefinition } from './sdfAnalyzer';
import { SdfAnalyzer } from './sdfAnalyzer';

export function activate(context: vscode.ExtensionContext) {
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

	context.subscriptions.push(
		vscode.commands.registerCommand('hlslpreprocessor.loadVsdf', () => {
			let shaderDefinisions = null;
			if (shaderDefinisions !== null) {
				showQuickPick(context, shaderDefinisions);
				return;
			} else {
				loadVsdf(context).then((result) => {
					shaderDefinisions = result;
					showQuickPick(context, shaderDefinisions);
				});
			}
		})
	);


	const disposable = vscode.commands.registerCommand('hlslpreprocessor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HlslPreprocessor!');
	});

	context.subscriptions.push(disposable);
}

function showQuickPick(context: vscode.ExtensionContext, shaderDefinisions: ShaderDefinition[]) {
	vscode.window.showQuickPick(shaderDefinisions.map((arg) => arg.name)).then((selectedShaderName) => {
		if (selectedShaderName) {
			const shaderDefinision = shaderDefinisions.find((shaderDefinision) => {
				return shaderDefinision.name === selectedShaderName;
			});
			vscode.window.showInformationMessage(shaderDefinision!.toString());
		}
	});
}

async function loadVsdf(context: vscode.ExtensionContext) {
	const shaderDefinisions: ShaderDefinition[] = [];
	const promises: any[] = [];
	await vscode.workspace.findFiles('**/*.vsdf.json').then((uris) => {
		uris.forEach((uri) => {
			promises.push(
				vscode.workspace.fs.readFile(uri).then((content: any) => {
					const analyzeResult = SdfAnalyzer.analyze(content);
					for (let i = 0; i < analyzeResult.length; i++) {
						shaderDefinisions.push(analyzeResult[i]);
					}
				})
			);
		});
	});

	await Promise.all(promises);
	return shaderDefinisions;
}

// This method is called when your extension is deactivated
export function deactivate() { }
