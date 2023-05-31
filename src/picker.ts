import * as vscode from 'vscode';

export interface ToString {
    toString(): string;
}

export class Separator<T extends ToString> implements vscode.QuickPickItem {
    label: string;
    private _data: T;

    kind = vscode.QuickPickItemKind.Separator;

    constructor(data: T) {
        this._data = data;
        this.label = data.toString();
    }


    public set data(value: T) {
        this._data = value;
        this.label = this._data.toString();
    }


    public get data(): T {
        return this._data;
    }
}

export interface CanBePickedItem extends vscode.QuickPickItem {
    filePath: vscode.Uri;
    lineNumber: number;
    column: number;
}


export interface Results {
    separator: Separator<ToString>,
    items: CanBePickedItem[]
}

export class PickedItem {
    readonly rawItem: CanBePickedItem;
    readonly filePath: vscode.Uri;
    readonly lineNumber: number;
    readonly column: number;

    constructor(rawItem: CanBePickedItem) {
        this.rawItem = rawItem;
        this.filePath = rawItem.filePath;
        this.lineNumber = rawItem.lineNumber;
        this.column = rawItem.column;
    }

    async jumpTo() {
        const doc = await vscode.workspace.openTextDocument(this.filePath);
        const editor = await vscode.window.showTextDocument(doc);

        const pos = new vscode.Position(this.lineNumber - 1, this.column - 1);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }

}

export class Picker {
    readonly rawPicker: vscode.QuickPick<CanBePickedItem | Separator<ToString>>;

    private _count = 0;

    constructor() {
        this.rawPicker = vscode.window.createQuickPick();
        this.rawPicker.canSelectMany = false;
    }

    public get count() {
        return this._count;
    }

    dispose() {
        this.rawPicker.dispose();
    }

    addResults(results: Results) {
        const newResults =
            ([results.separator] as (CanBePickedItem | Separator<ToString>)[])
                .concat(results.items);
        this._count += results.items.length;
        this.rawPicker.items = this.rawPicker.items.concat(newResults);
    }

    clear() {
        this.rawPicker.items = [];
        this._count = 0;
    }

    pickOne(): Promise<PickedItem | undefined> {
        this.rawPicker.show();

        return new Promise((resolve, _) => {
            this.rawPicker.onDidAccept(() => {
                /// Can only be the PickedItem
                /// [0] is safe, because DidAccept must have one element at least 
                const selected = this.rawPicker.selectedItems[0] as CanBePickedItem;

                resolve(new PickedItem(selected));

                this.dispose();
            });

            this.rawPicker.onDidHide(() => {
                resolve(undefined);
                this.dispose();
            });
        });
    }

}