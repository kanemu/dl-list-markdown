import * as vscode from "vscode";
import dlList from "markdown-it-dl-list";

export function activate() {
    return {
        extendMarkdownIt(md: any) {
            md.core.ruler.push('remove_dl_source_map', (state: any) => {
                state.tokens.forEach((token: any) => {
                    if (token.type === 'dl_list_open') {
                        token.map = null;
                        if (token.attrs) {
                            token.attrs = token.attrs.filter((attr: [string, string]) =>
                                attr[0] !== 'data-line' && attr[0] !== 'class'
                            );
                        }
                    }
                });
            });

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
