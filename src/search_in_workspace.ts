import * as vscode from 'vscode';
import * as rg from 'ripgrep-wrapper';
import { rgPath } from '@vscode/ripgrep';
import { PickedItem, ResultPicker } from './results_picker';

function promptPattern(pattern = ""): Promise<string | undefined> {
    return new Promise((resolve, _) => {
        /// input a pattern to search
        const inputBox = vscode.window.createInputBox();
        inputBox.step = 1;
        inputBox.totalSteps = 2;
        inputBox.title = "Search In Workspace";
        inputBox.prompt = "input a pattern to search";
        inputBox.value = pattern;
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
async function pickResult(pattern: string): Promise<PickedItem| undefined> {
    const SEARCHING_TEXT = "Searching...   ";

    const resultPicker = new ResultPicker();

    resultPicker.picker.title = SEARCHING_TEXT;
    resultPicker.picker.step = 2;
    resultPicker.picker.totalSteps = 2;
    resultPicker.picker.canSelectMany = false;
    resultPicker.picker.busy = true;

    const pickedResult = resultPicker.pickOne();

    const rgCancelHandle = new rg.CancellationTokenSource();

    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders === undefined) {
        // just quit
        return undefined;
    }

    const query: rg.ITextQuery = {
        maxResults: 100000,
        contentPattern: {
            pattern: pattern,
        },
        folderQueries:
            workspaceFolders.map(folder => {
                return { folder: folder.uri.fsPath };
            })
    };

    const searchEngine = new rg.TextSearchEngineAdapter(rgPath, query);
    const searchResult = searchEngine.search(rgCancelHandle.token, res => {
        function isITextSearchMatch(param: rg.ITextSearchResult): param is rg.ITextSearchMatch {
            return !!(param as rg.ITextSearchMatch).preview;
        }

        for (const matchResult of res) {
            if (matchResult.results === undefined) {
                continue;
            }

            // console.log("Added:", matchResult);

            resultPicker.addResultsInFile({
                filePath: matchResult.path,
                results: matchResult.results.filter(isITextSearchMatch).map(result => {
                    return {
                        // default is [(start_line = end_line)]
                        lineNumber: (result.ranges as rg.ISearchRange[])[0].startLineNumber,
                        column: (result.ranges as rg.ISearchRange[])[0].startColumn,
                        text: result.preview.text
                    };
                })
            });
        }

        resultPicker.picker.title = SEARCHING_TEXT + resultPicker.count;
    }, message => {
        // console.log('message', message);
    });

    const result = await Promise.race([searchResult, pickedResult]);

    // console.log('race result:', result);

    if (result instanceof PickedItem || result === undefined) {
        // user action is faster than rg
        // cancel rg
        rgCancelHandle.cancel();

        return result;
    } else {
        resultPicker.picker.busy = false;
        // rg is faster than user, just wait for user complete it works
        return await pickedResult;
    }
}

export async function cmdSearchInWorkspace() {
    // get highlight word as default pattern
    const activeEditor = vscode.window.activeTextEditor;
    const cursorStart = activeEditor?.selection.start;
    let pattern : string | undefined = "";
    if (cursorStart)
    {
        const wordRange = activeEditor?.document.getWordRangeAtPosition(cursorStart);
        const highlight = activeEditor?.document.getText(wordRange);
        pattern = highlight;
    }

    pattern = await promptPattern(pattern);
    if (pattern=== undefined) {
        vscode.window.showInformationMessage("No result can be found");
        return;
    }

    const result = await pickResult(pattern);
    if (result === undefined) {
        return;
    }

    // console.log('will jump to:', result);

    const doc = await vscode.workspace.openTextDocument(result.filePath);
    const editor = await vscode.window.showTextDocument(doc );

    const pos = new vscode.Position(result.lineNumber, result.column);
    editor.selection = new vscode.Selection(pos, pos);
}

