import * as vscode from 'vscode';
import { CanBePickedItem, PickedItem, Picker, Separator, ToString } from './picker';
import { jumpTo } from './helper';

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
                lineNumber: lineText.lineNumber,
                column: 0,
                filePath: activeEditor.document.uri,
                text: lineText.text,
                label: (lineText.lineNumber + 1) + ": " + lineText.text
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

    const currentPos = activeEditor.selection.start;
    picker.rawPicker.onDidChangeActive(async selected => {
        if (!selected) {
            return;
        }
        const item = selected[0];
        if (!(item instanceof Separator<ToString>)){
            await (new PickedItem(item)).jumpTo();
        } else {
            await jumpTo(activeEditor, currentPos.line, currentPos.character);
        }
    });

    const result = await picker.pickOne();
    if (result === undefined) {
        return;
    }

    await result.jumpTo();

}