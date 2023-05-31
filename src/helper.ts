import * as vscode from 'vscode';

export async function jumpTo(editor: vscode.TextEditor, lineNumber: number, column: number) {
    const pos = new vscode.Position(lineNumber, column);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
}