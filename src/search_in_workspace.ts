import * as vscode from 'vscode';
import * as rg from 'ripgrep-wrapper';
import { rgPath } from '@vscode/ripgrep';
import { PickedItem, Picker, Separator } from './picker';

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
async function pickResult(pattern: string): Promise<PickedItem | undefined> {
    const SEARCHING_TEXT = "Searching...   ";

    const resultPicker = new Picker();

    resultPicker.rawPicker.title = SEARCHING_TEXT;
    resultPicker.rawPicker.step = 2;
    resultPicker.rawPicker.totalSteps = 2;
    resultPicker.rawPicker.canSelectMany = false;
    resultPicker.rawPicker.busy = true;

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

            resultPicker.addResults({
                separator: new Separator({
                    filePath: matchResult.path,

                    toString() : string {
                        return this.filePath;
                    }
                }),
                items: matchResult.results.filter(isITextSearchMatch).map(result => {
                    const lineNumber = (result.ranges as rg.ISearchRange[])[0].startLineNumber;
                    return {
                        // default is [(start_line = end_line)]
                        lineNumber: lineNumber,
                        column: (result.ranges as rg.ISearchRange[])[0].startColumn,
                        text: result.preview.text,
                        filePath: vscode.Uri.file(matchResult.path),
                        label: (lineNumber + 1) + ": " + result.preview.text
                    };
                })
            });
        }

        resultPicker.rawPicker.title = SEARCHING_TEXT + resultPicker.count;
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
        resultPicker.rawPicker.busy = false;
        // rg is faster than user, just wait for user complete it works
        return await pickedResult;
    }
}

export async function cmdSearchInWorkspace() {
    // get highlight word as default pattern
    const activeEditor = vscode.window.activeTextEditor;
    const cursorStart = activeEditor?.selection.start;

    let prePattern = "";

    if (activeEditor && cursorStart) {
        const wordRange = activeEditor.document.getWordRangeAtPosition(cursorStart);
        if (wordRange) {
            prePattern = activeEditor.document.getText(wordRange);
        }
    }

    let pattern = await promptPattern(prePattern);
    if (pattern === undefined) {
        return;
    }

    const result = await pickResult(pattern);
    if (result === undefined) {
        return;
    }

    // console.log('will jump to:', result);

    await result.jumpTo();
}

