import { ResultPicker } from "./results_picker";
import * as vscode from 'vscode';

export async function cmdSearchInActiveEditor() {
    const resultPicker = new ResultPicker();

    resultPicker.picker.title = "Pick Result";
    resultPicker.picker.canSelectMany = false;
    resultPicker.picker.busy = false;

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showInformationMessage("No active editor");
        return;
    }

    const text = activeEditor.document.getText();
    const lines = text.split(/\r?\n/);
    const results = lines
        .map((lineText, lineIndex, _) => {
            return {
                lineNumber: lineIndex + 1,
                column: 1,
                text: lineText
            };
        });
    
    resultPicker.addResultsInFile({
        filePath: activeEditor.document.uri.fsPath,
        results: results
    });

    const result = await resultPicker.pickOne();
    if (result === undefined)
    {
        return;
    }

    await result.jumpTo();

}