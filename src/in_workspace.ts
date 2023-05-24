import * as vscode from 'vscode';
import * as rg from 'ripgrep-wrapper';
import { rgPath } from '@vscode/ripgrep';
import { resolve } from 'path';

function promptPattern(): Promise<string | undefined> {
    return new Promise((resolve, _) => {
        /// input a pattern to search
        const inputBox = vscode.window.createInputBox();
        inputBox.step = 1;
        inputBox.totalSteps = 2;
        inputBox.title = "Search In Workspace";
        inputBox.prompt = "input a pattern to search";
        inputBox.value = "*";
        inputBox.valueSelection = undefined; // select all
        inputBox.onDidAccept(() => {
            resolve(inputBox.value);
            inputBox.dispose();
        });
        inputBox.onDidHide(() => {
            resolve(undefined);
            inputBox.dispose();
        });
        inputBox.show();
    }); 
}
function pickResult(pattern: string): Promise<string | undefined> {
    return new Promise(async (resolve, _) => {
        const picker = vscode.window.createQuickPick();

        picker.title = "Searching...";
        picker.step = 2;
        picker.totalSteps = 2;
        picker.canSelectMany = false;
        picker.busy = true;

        const tokenSource = new rg.CancellationTokenSource();

        picker.onDidAccept(() => {
            const selected = picker.selectedItems[0];
            resolve(selected.label);

            tokenSource.cancel();
            picker.dispose();
        });

        picker.onDidHide(() => {
            resolve(undefined);

            tokenSource.cancel();
            picker.dispose();
        });

        picker.show();

        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders === undefined) {
            // just quit
            picker.hide();
            return;
        }

        const query: rg.ITextQuery = {
            maxResults: 100000,
            contentPattern: {
                pattern: pattern
            },
            folderQueries: 
                workspaceFolders.map(folder => {
                    return { folder: folder.uri.fsPath };
                })
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
                                description: rr.path
                            }]);
                    } else {
                        picker.items =
                            picker.items.concat([{
                                label: rr.text,
                                description: rr.path
                            }]);
                    }

                    picker.title = "Searching...  " + picker.items.length.toString();
                });
            }

        }, message => {
            console.log('message', message);
        });

        console.log("result", result);

        picker.busy = false;
        picker.title = "Results:  " + picker.items.length.toString();

        if (picker.items.length === 0) {
            vscode.window.showInformationMessage("No result can be found");
            picker.hide();
        }

        if (result.limitHit) {
            picker.title = picker.title + "(Results is up to 100000, stop searching)";
        }
    });
}

export async function cmdSearchInWorkspace() {
    let pattern = await promptPattern();
    if (pattern === undefined) {
        return;
    }

    let result = await pickResult(pattern);
    if (result === undefined) {
        return;
    }

    vscode.window.showInformationMessage(result);
}
