import type MarkdownIt from "markdown-it";

/**
 * Options for the colon-based definition list plugin.
 */
export type DlListOptions = {
    /** Indent (spaces) required for dd lines. Default: 4 */
    ddIndent?: number;
    /** If true, dt-only items are allowed only when followed by blank line or EOF. Default: true */
    requireDd?: boolean;
    /** If true, stop parsing the current dl at the first blank line after items. Default: true */
    breakOnBlankLine?: boolean;
};

type DlItem = { dtLine: number; dtText: string; dds: Array<{ line: number; text: string }> };

type DtBlock = { baseIndent: number; text: string; nextLine: number };
type DdBlock = { text: string; nextLine: number };
type DdHeader = { text: string };

const RULE_NAME = "dl_list_colon";

// token names
const T_DL_OPEN = "dl_list_open";
const T_DL_CLOSE = "dl_list_close";
const T_DT_OPEN = "dl_dt_open";
const T_DT_CLOSE = "dl_dt_close";
const T_DD_OPEN = "dl_dd_open";
const T_DD_CLOSE = "dl_dd_close";

const DEFAULT_DD_INDENT = 4;
const DEFAULT_REQUIRE_DD = true;
const DEFAULT_BREAK_ON_BLANK = true;

export function markdownItDlList(md: MarkdownIt, opts: DlListOptions = {}) {
    const ddIndent = clampInt(opts.ddIndent ?? DEFAULT_DD_INDENT, 1, 12);
    const requireDd = opts.requireDd ?? DEFAULT_REQUIRE_DD;
    const breakOnBlankLine = opts.breakOnBlankLine ?? DEFAULT_BREAK_ON_BLANK;

    md.block.ruler.before("paragraph", RULE_NAME, (state, startLine, endLine, silent) => {
        const begin = startLine;

        // Fast check: must start with a valid dt
        const firstDt = readDtBlock(state, begin, endLine, ddIndent);
        if (!firstDt) return false;

        // If dd is required, we only accept dt-only when followed by blank line or EOF.
        const firstHasDd = hasDdHeaderAtSameLevel(state, firstDt, ddIndent, endLine);
        const firstDtOnlyOk =
            !firstHasDd &&
            (isDtOnlyBoundary(state, firstDt.nextLine, endLine) ||
                isNextLineAnotherDt(state, firstDt.nextLine, endLine));
        if (requireDd && !firstHasDd && !firstDtOnlyOk) return false;

        if (silent) return true;

        const parsed = parseDlItems(state, begin, endLine, { ddIndent, requireDd, breakOnBlankLine });
        if (!parsed) return false;

        renderDlTokens(state, begin, parsed.endLine, parsed.items, ddIndent);
        state.line = parsed.endLine;
        return true;
    });

    // NOTE:
    // We intentionally do NOT define renderer rules here.
    // markdown-it will fall back to its default renderer,
    // which simply calls `slf.renderToken(...)` for these tokens.
}

/**
 * Parse a dl-list block starting at `begin`.
 * Returns items + the final consumed line (state.line should be set to this endLine).
 */
function parseDlItems(
    state: any,
    begin: number,
    endLine: number,
    ctx: { ddIndent: number; requireDd: boolean; breakOnBlankLine: boolean }
): { items: DlItem[]; endLine: number } | null {
    const items: DlItem[] = [];
    let line = begin;

    while (line < endLine) {
        const dtBlock = readDtBlock(state, line, endLine, ctx.ddIndent);
        if (!dtBlock) break;

        const { dds, nextLineAfterDds } = collectDds(state, dtBlock, endLine, ctx.ddIndent);

        // dt-only handling
        if (dds.length === 0) {
            const afterDt = dtBlock.nextLine;
            const dtOnlyHere = isDtOnlyBoundary(state, afterDt, endLine);
            const followedByDt = isNextLineAnotherDt(state, afterDt, endLine);

            // Allow consecutive dt lines (multiple terms) before a dd appears:
            //   : Apple
            //   : Grapes
            //       : purple...
            // In this case, "Apple" is a term without dd, but it's still part of the same dl.
            if (ctx.requireDd && !dtOnlyHere && !followedByDt) break;

            items.push({ dtLine: line, dtText: dtBlock.text, dds: [] });
            line = afterDt;
            if (followedByDt) continue; // keep consuming dt's until we meet dd / blank / EOF
            break; // dt-only ends the dl block at boundary (blank/EOF) by design
        }

        items.push({ dtLine: line, dtText: dtBlock.text, dds });
        line = nextLineAfterDds;

        if (ctx.breakOnBlankLine && line < endLine && isBlankLine(state, line)) break;
    }

    if (items.length === 0) return null;
    return { items, endLine: line };
}

function renderDlTokens(state: any, begin: number, endLine: number, items: DlItem[], tabSize: number) {
    const dlOpen = state.push(T_DL_OPEN, "dl", 1);
    dlOpen.map = [begin, endLine];

    for (const it of items) {
        const dtOpen = state.push(T_DT_OPEN, "dt", 1);
        dtOpen.map = [it.dtLine, it.dtLine + 1];

        pushInline(state, it.dtText, it.dtLine);
        state.push(T_DT_CLOSE, "dt", -1);

        for (const d of it.dds) {
            const ddOpen = state.push(T_DD_OPEN, "dd", 1) as any;
            ddOpen.map = [d.line, d.line + 1]; // 暫定

            if (shouldBlockParseDd(d.text)) {
                parseDdContentIntoTokens(state, d.text, d.line, tabSize);
            } else {
                pushInline(state, d.text, d.line);
            }

            state.push(T_DD_CLOSE, "dd", -1);
        }
    }

    state.push(T_DL_CLOSE, "dl", -1);
}

function collectDds(state: any, dtBlock: DtBlock, endLine: number, ddIndent: number) {
    const dds: Array<{ line: number; text: string }> = [];
    let next = dtBlock.nextLine;

    while (next < endLine) {
        if (isBlankLine(state, next)) break;

        const ddBlock = readDdBlock(state, next, endLine, dtBlock.baseIndent, ddIndent);
        if (!ddBlock) break;

        dds.push({ line: next, text: ddBlock.text });
        next = ddBlock.nextLine;
    }

    return { dds, nextLineAfterDds: next };
}

function hasDdHeaderAtSameLevel(state: any, dtBlock: DtBlock, ddIndent: number, endLine: number) {
    const minIndent = dtBlock.baseIndent + ddIndent;
    if (dtBlock.nextLine >= endLine) return false;
    return (
        !!parseDdHeaderAtLevel(state, dtBlock.nextLine, minIndent, ddIndent) ||
        isEmptyDdHeaderAtLevel(state, dtBlock.nextLine, minIndent, ddIndent)
    );
}

function isDtOnlyBoundary(state: any, line: number, endLine: number) {
    return line >= endLine || isBlankLine(state, line);
}

/**
 * True if the next line starts another dt (same dl level).
 * This enables multiple <dt> in a row before a <dd>.
 */
function isNextLineAnotherDt(state: any, line: number, endLine: number) {
    if (line >= endLine) return false;
    if (isBlankLine(state, line)) return false;
    // dt header is `: text` with up to 3 leading spaces
    return !!parseDtLine(state, line);
}

function shouldBlockParseDd(text: string) {
    return looksLikeNestedDl(text) || text.indexOf("\n") >= 0;
}

function isListItemStart(text: string) {
    // No leading spaces assumed for "start" (we’ll check exact "two-space offset" separately)
    // Unordered: - * +
    if (text.indexOf("- ") === 0 || text.indexOf("* ") === 0 || text.indexOf("+ ") === 0) return true;

    // Ordered: "1. " "2) " etc
    // Keep it simple and strict enough:
    // - digits + "." or ")"
    // - at least one space after
    return /^[0-9]{1,9}[.)]\s+/.test(text);
}

function isTwoSpaceOffsetListItem(text: string) {
    // The common case produced by current stripping:
    // "  - item", "  * item", "  1. item", "  2) item"
    if (text.indexOf("  ") !== 0) return false;
    return isListItemStart(text.slice(2));
}

function stripTwoLeadingSpaces(text: string) {
    return text.indexOf("  ") === 0 ? text.slice(2) : text;
}

function looksLikeNestedDl(text: string) {
    return text.replace(/^\s+/, "").indexOf(":") === 0;
}

function pushInline(state: any, text: string, line: number) {
    const token = state.push("inline", "", 0) as any;
    token.map = [line, line + 1];
    token.content = text;
    token.children = [];
}

function isBlankLine(state: any, line: number) {
    const start = state.bMarks[line] + state.tShift[line];
    const end = state.eMarks[line];
    return start >= end;
}

/** Parse a dt line in the form `: text` with up to 3 spaces indentation. */
function parseDtLine(state: any, line: number): { text: string } | null {
    if (line >= state.lineMax) return null;
    const raw = getLineText(state, line);
    const m = raw.match(/^( {0,3}):[ \t]+(.+?)\s*$/);
    return m ? { text: m[2] } : null;
}

/**
 * Parse a dd header at the "same level" as a dt.
 * Allowed indentation: minIndent..minIndent+3
 */
function parseDdHeaderAtLevel(state: any, line: number, minIndent: number, tabSize: number): DdHeader | null {
    if (line >= state.lineMax) return null;
    const raw = getLineText(state, line);
    const { cols: indentCols, nextIndex } = countLeadingIndentCols(raw, tabSize);

    if (indentCols < minIndent || indentCols > minIndent + 3) return null;

    // After indent, must start with ":"
    const a = raw.charCodeAt(nextIndex);
    if (a !== 58 /* : */) return null;
    const markerLen = 1;

    // Require at least one space/tab after marker
    const after = raw.charCodeAt(nextIndex + markerLen);
    const isWs = after === 32 /* space */ || after === 9 /* tab */;
    if (!isWs) return null;

    const text = raw.slice(nextIndex + markerLen).trim();
    if (text.length === 0) return null;

    return { text };
}

/** True if line is a dd header `:` (no text) at same level (minIndent..minIndent+3). */
function isEmptyDdHeaderAtLevel(state: any, line: number, minIndent: number, tabSize: number) {
    if (line >= state.lineMax) return false;
    const raw = getLineText(state, line);
    const { cols: indentCols, nextIndex } = countLeadingIndentCols(raw, tabSize);
    if (indentCols < minIndent || indentCols > minIndent + 3) return false;

    const a = raw.charCodeAt(nextIndex);
    if (a !== 58 /* : */) return false;
    const markerLen = 1;

    // Allow trailing whitespace only
    const rest = raw.slice(nextIndex + markerLen);
    return rest.trim().length === 0;
}

/**
 * Read a dt block (dt header + continuation lines).
 * Continuation lines are indented (space/tab) lines; blank lines end dt.
 */
function readDtBlock(state: any, startLine: number, endLine: number, ddMinIndent: number): DtBlock | null {
    const dt = parseDtLine(state, startLine);
    if (!dt) return null;

    const raw0 = getLineText(state, startLine);
    const baseIndent = countLeadingSpaces(raw0); // 0..3

    const lines: string[] = [dt.text];
    let line = startLine + 1;

    while (line < endLine) {
        // dt: blank line terminates (keeps dt-only detection correct)
        if (isWhitespaceOnlyLine(state, line)) break;

        // new dt starts
        if (parseDtLine(state, line)) break;

        // dd starts
        const minIndent = baseIndent + ddMinIndent;
        if (
            parseDdHeaderAtLevel(state, line, minIndent, ddMinIndent) ||
            isEmptyDdHeaderAtLevel(state, line, minIndent, ddMinIndent)
        ) break;

        // continuation line must start with space/tab
        const raw = getLineText(state, line);
        const first = raw.charCodeAt(0);
        const isSpaceOrTab = first === 32 /* space */ || first === 9 /* tab */;
        if (!isSpaceOrTab) break;

        // mimic paragraph continuation: strip baseIndent+2
        lines.push(stripUpTo(raw, baseIndent + 2).replace(/\s+$/, ""));
        line++;
    }

    return { baseIndent, text: lines.join("\n"), nextLine: line };
}

/**
 * Read a dd block:
 * - Header is at same level (minIndent..minIndent+3) and is either `: text` or `:` (empty).
 * - Continuation lines are absorbed while indentation matches (or empty-header rules allow looser continuation).
 */
function readDdBlock(state: any, startLine: number, endLine: number, baseIndent: number, ddIndent: number): DdBlock | null {
    const minIndent = baseIndent + ddIndent;

    const dd0 = parseDdHeaderAtLevel(state, startLine, minIndent, ddIndent);
    const emptyHeader = !dd0 && isEmptyDdHeaderAtLevel(state, startLine, minIndent, ddIndent);
    if (!dd0 && !emptyHeader) return null;

    const lines: string[] = [];
    if (dd0) {
        lines.push(dd0.text);
    }

    // If the first dd line starts with a list marker, subsequent lines often need
    // an extra 2-space compensation (because ": " consumes 2 columns on the header line).
    const ddStartsWithList = !!dd0 && isListItemStart(dd0.text);

    // If dd starts a nested dl (e.g. ": : Orin" -> dd text begins with ":"), then
    // dd continuation may include further ":" lines that would otherwise look like
    // "another dd". In that case, treat ":" lines deeper than minIndent as content,
    // and stop only when a ":" line appears back at minIndent (sibling dd).
    const startsNestedDl = !!dd0 && dd0.text.replace(/^\s+/, "").indexOf(":") === 0;

    let line = startLine + 1;

    while (line < endLine) {
        // whitespace-only lines: keep only when dd continues
        if (isWhitespaceOnlyLine(state, line)) {
            const next = line + 1;

            if (next >= endLine) break;
            if (isWhitespaceOnlyLine(state, next)) break;
            if (parseDtLine(state, next)) break;

            // If next line looks like a dd header, normally we would end this dd.
            // But for nested-dl dd, allow deeper-indented ":" lines to continue.
            const rawNext = getLineText(state, next);
            const indentNext = countLeadingIndentCols(rawNext, ddIndent).cols;
            const nextLooksLikeDd =
                !!parseDdHeaderAtLevel(state, next, minIndent, ddIndent) ||
                isEmptyDdHeaderAtLevel(state, next, minIndent, ddIndent);
            if (nextLooksLikeDd) {
                if (!(startsNestedDl && indentNext > minIndent)) break;
            }

            if (!emptyHeader && indentNext < minIndent) break;

            lines.push("");
            line++;
            continue;
        }

        if (parseDtLine(state, line)) break;

        // If this line looks like another dd header at the same "dd level":
        // - normal dd: end current dd
        // - nested-dl dd: treat deeper-indented ":" lines as content; only end when
        //   we return to minIndent (sibling dd)
        const raw = getLineText(state, line);
        const indent = countLeadingIndentCols(raw, ddIndent).cols;
        const looksLikeDdHere =
            !!parseDdHeaderAtLevel(state, line, minIndent, ddIndent) ||
            isEmptyDdHeaderAtLevel(state, line, minIndent, ddIndent);
        if (looksLikeDdHere) {
            if (!(startsNestedDl && indent > minIndent)) break;
        }

        if (!emptyHeader && indent < minIndent) break;

        const cutCols = emptyHeader ? Math.min(indent, minIndent) : minIndent;
        let out = stripUpToIndentCols(raw, cutCols, ddIndent).replace(/\s+$/, "");

        // Compensation for list items inside dd:
        // If dd header starts with "- item" (col 0), but continuation lines become "  - item",
        // unindent those 2 spaces so markdown-it doesn't treat them as a nested list.
        if (ddStartsWithList && isTwoSpaceOffsetListItem(out)) out = stripTwoLeadingSpaces(out);

        lines.push(out);
        line++;
    }

    return { text: lines.length === 0 ? "" : lines.join("\n"), nextLine: line };
}

function getLineText(state: any, line: number) {
    const start = state.bMarks[line];
    const end = state.eMarks[line];
    return state.src.slice(start, end);
}

function isWhitespaceOnlyLine(state: any, line: number) {
    return getLineText(state, line).trim().length === 0;
}

function countLeadingSpaces(s: string) {
    let i = 0;
    while (i < s.length && s.charCodeAt(i) === 32 /* space */) i++;
    return i;
}

/**
 * Count leading indent in *columns*.
 * - space = 1 col
 * - tab = tabSize cols (tabSize == ddIndent per plugin rule)
 */
function countLeadingIndentCols(s: string, tabSize: number): { cols: number; nextIndex: number } {
    let cols = 0;
    let i = 0;
    while (i < s.length) {
        const c = s.charCodeAt(i);
        if (c === 32 /* space */) {
            cols += 1;
            i++;
            continue;
        }
        if (c === 9 /* tab */) {
            cols += tabSize;
            i++;
            continue;
        }
        break;
    }
    return { cols, nextIndex: i };
}

function stripUpTo(s: string, n: number) {
    let i = 0;
    while (i < s.length && i < n && s.charCodeAt(i) === 32) i++;
    return s.slice(i);
}

/**
 * Strip leading indent up to `nCols` columns (space=1, tab=tabSize).
 * If a tab would overshoot remaining cols, we still strip that tab (consistent with "tab counts as tabSize").
 */
function stripUpToIndentCols(s: string, nCols: number, tabSize: number) {
    let cols = 0;
    let i = 0;
    while (i < s.length && cols < nCols) {
        const c = s.charCodeAt(i);
        if (c === 32 /* space */) {
            cols += 1;
            i++;
            continue;
        }
        if (c === 9 /* tab */) {
            cols += tabSize;
            i++;
            continue;
        }
        break;
    }
    return s.slice(i);
}

function clampInt(n: number, min: number, max: number) {
    if (typeof n !== "number" || !isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeNestedDlText(text: string) {
    const lines = text.split("\n");
    if (lines.length <= 1) return text;

    let dtShift = 0;
    for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (l === undefined) continue;
        if (l.trim().length === 0) continue;
        // (Keep it simple: treat leading tabs as 0 here; nested dl normalization is best-effort.)
        const m = l.match(/^( {0,3}):/);
        if (m) {
            dtShift = countLeadingSpaces(m[1] ?? ""); // 0..3
            break;
        }
    }

    for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (l === undefined) continue;
        if (l.trim().length === 0) {
            lines[i] = "";
            continue;
        }

        let shifted = l;
        if (dtShift > 0) shifted = stripUpTo(shifted, dtShift);

        const m2 = shifted.match(/^(\s*):(.*)$/);
        if (m2) {
            const indent = countLeadingSpaces(m2[1] ?? "");
            if (indent >= 4) shifted = "    :" + m2[2];
        }

        lines[i] = shifted;
    }

    return lines.join("\n");
}

function normalizeIndentedBlock(text: string, tabSize: number) {
    const lines = text.split("\n");

    // Compute minimum indent of non-empty lines and strip it.
    let min = Infinity;
    for (const l of lines) {
        if (l.trim().length === 0) continue;
        // Use ddIndent-as-tabSize rule (default 4) when normalizing blocks too.
        const n = countLeadingIndentCols(l, tabSize).cols;
        if (n < min) min = n;
    }
    if (!isFinite(min) || min === 0) return text;

    return lines
        .map((l) => (l.trim().length === 0 ? "" : stripUpToIndentCols(l, min, tabSize)))
        .join("\n");
}

/**
 * Parse dd contents with markdown-it block parser, and unwrap a single paragraph
 * so `<dd>` doesn't become `<dd><p>...</p></dd>` for simple cases.
 */
function parseDdContentIntoTokens(state: any, text: string, line: number, tabSize: number) {
    const ddText = looksLikeNestedDl(text) ? normalizeNestedDlText(text) : text;
    const normalized = normalizeIndentedBlock(ddText, tabSize);

    const start = state.tokens.length;
    state.md.block.parse(normalized, state.md, state.env, state.tokens);
    const added = state.tokens.slice(start);

    for (const t of added) {
        if (Array.isArray(t.map)) {
            t.map = [t.map[0] + line, t.map[1] + line];
        }
    }

    if (
        added.length === 3 &&
        added[0]?.type === "paragraph_open" &&
        added[1]?.type === "inline" &&
        added[2]?.type === "paragraph_close"
    ) {
        const pOpen = added[0];
        const inline = added[1];

        if (!Array.isArray(inline.map) && Array.isArray(pOpen.map)) {
            inline.map = pOpen.map;
        }
        state.tokens.length = start;
        state.tokens.push(inline);
    }
}

export default markdownItDlList
