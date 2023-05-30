import * as vscode from 'vscode';


type Formatter<T> = (data: T) => string;

class Separator<T> implements vscode.QuickPickItem {
    label: string;
    private _data: T;
    private _formatter: Formatter<T>;

    kind = vscode.QuickPickItemKind.Separator;

    constructor(data: T, formatter: Formatter<T>) {
        this._data = data;
        this._formatter = formatter;
        this.label = formatter(data);
    }


    public set data(value: T) {
        this._data = value;
        this.label = this._formatter(this._data);
    }


    public get data(): T {
        return this._data;
    }


    public set formatter(newFormatter: Formatter<T>) {
        this._formatter = newFormatter;
        this.label = this._formatter(this._data);
    }


    public get formatter(): Formatter<T> {
        return this._formatter;
    }
}

interface CanBePickedItem extends vscode.QuickPickItem {
    filePath: vscode.Uri;
    lineNumber: number;
    column: number;
}

async function jumpTo(item: CanBePickedItem) {
    const doc = await vscode.workspace.openTextDocument(item.filePath);
    const editor = await vscode.window.showTextDocument(doc);

    const pos = new vscode.Position(item.lineNumber - 1, item.column - 1);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);

}