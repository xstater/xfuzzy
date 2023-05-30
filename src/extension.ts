import * as vscode from 'vscode';
import { cmdSearchInWorkspace } from './search_in_workspace';
import { cmdSearchInActiveEditor } from './search_in_active_editor';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('xfuzzy.searchInWorkspace', cmdSearchInWorkspace);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('xfuzzy.searchInActiveEditor', cmdSearchInActiveEditor);
	context.subscriptions.push(disposable);
}

export function deactivate() { }
