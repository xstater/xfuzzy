import * as vscode from 'vscode';
import { Picker, Separator } from './picker';

export async function cmdSearchInActiveEditor() {
    const picker = new Picker();

    picker.rawPicker.title = "Pick Result";
    picker.rawPicker.canSelectMany = false;
    picker.rawPicker.busy = false;

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showInformationMessage("No active editor");
        return;
    }
    const range = (start: number, end: number) =>
        Array.from(Array(end - start + 1).keys()).map(x => x + start);
    // const text = activeEditor.document.getText();
    // const lines = text.split(/\r?\n/);
    const lines = range(0, activeEditor.document.lineCount - 1)
        .map(activeEditor.document.lineAt);
    const results = lines
        .filter((lineText, _, __) => !lineText.isEmptyOrWhitespace)
        .map((lineText, _, __) => {
            return {
                lineNumber: lineText.lineNumber + 1,
                column: 1,
                filePath: activeEditor.document.uri,
                text: lineText.text,
                label: lineText.lineNumber + ": " + lineText.text
            };
        });
    
    picker.addResults({
        separator: new Separator({
            document: activeEditor.document,
            toString(): string {
                return this.document.fileName;
            }
        }),
        items: results
    });

    const result = await picker.pickOne();
    if (result === undefined)
    {
        return;
    }

    await result.jumpTo();

}