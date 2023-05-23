import * as vscode from 'vscode';
import * as rg from 'ripgrep-wrapper';
import { rgPath } from '@vscode/ripgrep';

async function cmdSearchLines() {
	const picker = vscode.window.createQuickPick();

	picker.title = "Search Results:";
	picker.canSelectMany = false;
	picker.busy = true;

	const tokenSource = new rg.CancellationTokenSource();

	picker.onDidAccept(() => {
		const selected = picker.selectedItems[0];
		vscode.window.showInformationMessage(selected.label);
		tokenSource.cancel();
		picker.dispose();
	});
	picker.onDidHide(() => {
		tokenSource.cancel();
		picker.dispose();
	});

	picker.show();

	const query: rg.ITextQuery = {
		maxResults: 100000,
		contentPattern: {
			pattern: 'asddddd'
		},
		folderQueries: [
			{ folder: '.' }
		],
	};

	const searchEngine = new rg.TextSearchEngineAdapter(rgPath, query);
	const result = await searchEngine.search(tokenSource.token, (res) => {
		console.log('result:', res);

		for (const r of res) {
			r.results?.forEach(rr => {

				function isITextSearchMatch(param: rg.ITextSearchResult): param is rg.ITextSearchMatch {
					return !!(param as rg.ITextSearchMatch).preview;
				}

				if (isITextSearchMatch(rr)) {
					picker.items =
						picker.items.concat([{
							label: rr.preview.text,
							detail: rr.path
						}]);
				} else {
					picker.items =
						picker.items.concat([{
							label: rr.text,
							detail: rr.path
						}]);
				}
			});
		}

	}, message => {
		console.log('message', message);
	});

	console.log("asd", result);
	if (picker.items.length === 0) {
		vscode.window.showInformationMessage("No result can be found");
		picker.hide();
	}
	if (result.limitHit) {
		picker.title = picker.title + "(Results is up to 100000, stop searching)";
	}
	picker.busy = false;

}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('xfuzzy.searchLines', cmdSearchLines);

	context.subscriptions.push(disposable);
}

export function deactivate() { }
