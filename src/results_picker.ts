
import * as vscode from 'vscode';

export class PickedItem implements vscode.QuickPickItem{
    readonly filePath: string;
    readonly lineNumber: number;
    readonly column: number;
    readonly text: string;

    readonly label: string;

    constructor(filePath: string, text: string, lineNumber: number, column: number = 0) {
        this.filePath = filePath;
        this.lineNumber = lineNumber;
        this.column = column;
        this.text = text;

        this.label = this.lineNumber + ": " + text;
    }
}

class Separator implements vscode.QuickPickItem {
    filePath: string;

    label: string;
    kind = vscode.QuickPickItemKind.Separator;
    
    constructor(filePath: string) {
        this.filePath = filePath;
        this.label = filePath;
    }
}


export interface Result {
    lineNumber: number
    column?: number
    text: string
}

export interface ResultsInFile {
    filePath: string
    results: Result[]
}


export class ResultPicker {
    picker: vscode.QuickPick<PickedItem | Separator>;

    onAccept = () => { };
    onHide = () => { };

    private _count: number;

    constructor() {
        this.picker = vscode.window.createQuickPick();
        this._count = 0;
    }

    addResultsInFile(resultInFile: ResultsInFile) {
        const results =
            ([new Separator(resultInFile.filePath)] as (PickedItem | Separator)[])
                .concat(resultInFile.results.map(result =>
                    new PickedItem(resultInFile.filePath, result.text, result.lineNumber, result.column)
                ));
        this._count += resultInFile.results.length;
        this.picker.items = this.picker.items.concat(results);
    }

    
    get count() : number {
        return this._count;
    }


    pickOne(): Promise<PickedItem | undefined>{
        this.picker.show();

        return new Promise((resolve, _) => {
            this.picker.onDidAccept(() => {
                /// Can only be the PickedItem
                /// [0] is safe, because DidAccept must have one element at least 
                const selected = this.picker.selectedItems[0] as PickedItem;

                resolve(selected);

                this.picker.dispose();
            });

            this.picker.onDidHide(() => {
                resolve(undefined);
                this.picker.dispose();
            });
        });
    }
}