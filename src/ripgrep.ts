import { rgPath } from "@vscode/ripgrep";
import * as vscode from "vscode";
import * as child_process from "child_process";

export const path = rgPath;

export interface RipGrepArgs {
    folders?: string
    pattern: string
}

const defaultArgs = {
    folder: ".",
    pattern: ""
};

export async function runRgHere(args: string[] = []): Promise<string>{
    let process = child_process.spawn(path, args);
    process.kill();
    return "";
}
