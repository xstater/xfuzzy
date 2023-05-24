import * as vscode from 'vscode';
import { cmdSearchInWorkspace } from './search_in_workspace';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('xfuzzy.searchInWorkspace', cmdSearchInWorkspace);

	context.subscriptions.push(disposable);
}

export function deactivate() { }
