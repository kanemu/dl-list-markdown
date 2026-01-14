import * as vscode from "vscode";
import dlList from "markdown-it-dl-list";

export function activate() {
    return {
        extendMarkdownIt(md: any) {
            const cfg = vscode.workspace.getConfiguration("dlListPreview");
            const ddIndent = clampInt(cfg.get<number>("ddIndent", 4), 1, 12);

            md.use(dlList, { ddIndent });
            return md;
        }
    };
}

export function deactivate() { }

function clampInt(n: number, min: number, max: number) {
    if (typeof n !== "number" || !isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
}
