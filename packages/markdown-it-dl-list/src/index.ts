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
type DdHeader = { text: string; isNestedDlStart: boolean };

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

export default function dlListPlugin(md: MarkdownIt, opts: DlListOptions = {}) {
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
        const firstDtOnlyOk = !firstHasDd && isDtOnlyBoundary(state, firstDt.nextLine, endLine);
        if (requireDd && !firstHasDd && !firstDtOnlyOk) return false;

        if (silent) return true;

        const parsed = parseDlItems(state, begin, endLine, { ddIndent, requireDd, breakOnBlankLine });
        if (!parsed) return false;

        renderDlTokens(state, begin, parsed.endLine, parsed.items);
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

            if (ctx.requireDd && !dtOnlyHere) break;

            items.push({ dtLine: line, dtText: dtBlock.text, dds: [] });
            line = afterDt;
            break; // dt-only ends the dl block by design in this implementation
        }

        items.push({ dtLine: line, dtText: dtBlock.text, dds });
        line = nextLineAfterDds;

        if (ctx.breakOnBlankLine && line < endLine && isBlankLine(state, line)) break;
    }

    if (items.length === 0) return null;
    return { items, endLine: line };
}

function renderDlTokens(state: any, begin: number, endLine: number, items: DlItem[]) {
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
                parseDdContentIntoTokens(state, d.text, d.line);
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
        !!parseDdHeaderAtLevel(state, dtBlock.nextLine, minIndent) ||
        isEmptyDdHeaderAtLevel(state, dtBlock.nextLine, minIndent)
    );
}

function isDtOnlyBoundary(state: any, line: number, endLine: number) {
    return line >= endLine || isBlankLine(state, line);
}

function shouldBlockParseDd(text: string) {
    return looksLikeNestedDl(text) || text.indexOf("\n") >= 0;
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
function parseDdHeaderAtLevel(state: any, line: number, minIndent: number): DdHeader | null {
    if (line >= state.lineMax) return null;
    const raw = getLineText(state, line);
    const indent = countLeadingSpaces(raw);

    if (indent < minIndent || indent > minIndent + 3) return null;

    // Accept both:
    //   ":  text"  -> normal dd
    //   ":: text"  -> dd that starts a nested dl (shorthand for ": : text")
    const re = new RegExp(`^( {${indent}})(::?)[ \\t]+(.+?)\\s*$`);
    const m = raw.match(re);
    if (!m) return null;
    const marker = m[2]; // ":" or "::"
    return { text: m[3], isNestedDlStart: marker === "::" };
}

/** True if line is a dd header `:` (no text) at same level (minIndent..minIndent+3). */
function isEmptyDdHeaderAtLevel(state: any, line: number, minIndent: number) {
    if (line >= state.lineMax) return false;
    const raw = getLineText(state, line);
    const indent = countLeadingSpaces(raw);
    if (indent < minIndent || indent > minIndent + 3) return false;
    // Allow ":" or "::" with no text
    const re = new RegExp(`^( {${indent}})(::?)\\s*$`);
    return re.test(raw);
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
        if (parseDdHeaderAtLevel(state, line, minIndent) || isEmptyDdHeaderAtLevel(state, line, minIndent)) break;

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

    const dd0 = parseDdHeaderAtLevel(state, startLine, minIndent);
    const emptyHeader = !dd0 && isEmptyDdHeaderAtLevel(state, startLine, minIndent);
    if (!dd0 && !emptyHeader) return null;

    const lines: string[] = [];
    if (dd0) {
        // ":: apple" is shorthand for a nested dl start, so convert it to ": apple"
        // inside dd text. Existing nested-dl detection will then work.
        lines.push(dd0.isNestedDlStart ? `: ${dd0.text}` : dd0.text);
    }

    let line = startLine + 1;

    while (line < endLine) {
        // whitespace-only lines: keep only when dd continues
        if (isWhitespaceOnlyLine(state, line)) {
            const next = line + 1;

            if (next >= endLine) break;
            if (isWhitespaceOnlyLine(state, next)) break;
            if (parseDtLine(state, next)) break;

            if (parseDdHeaderAtLevel(state, next, minIndent) || isEmptyDdHeaderAtLevel(state, next, minIndent)) break;

            const rawNext = getLineText(state, next);
            const indentNext = countLeadingSpaces(rawNext);
            if (!emptyHeader && indentNext < minIndent) break;

            lines.push("");
            line++;
            continue;
        }

        if (parseDtLine(state, line)) break;

        if (parseDdHeaderAtLevel(state, line, minIndent) || isEmptyDdHeaderAtLevel(state, line, minIndent)) break;

        const raw = getLineText(state, line);
        const indent = countLeadingSpaces(raw);

        if (!emptyHeader && indent < minIndent) break;

        const cut = emptyHeader ? Math.min(indent, minIndent) : minIndent;
        lines.push(stripUpTo(raw, cut).replace(/\s+$/, ""));
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

function stripUpTo(s: string, n: number) {
    let i = 0;
    while (i < s.length && i < n && s.charCodeAt(i) === 32) i++;
    return s.slice(i);
}

function clampInt(n: number, min: number, max: number) {
    if (typeof n !== "number" || !isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeNestedDlText(text: string) {
    const lines = text.split("\n");
    if (lines.length <= 1) return text;

    // Normalize ": ..." lines after the first line to 4-space indent so nested parsing is stable.
    for (let i = 1; i < lines.length; i++) {
        const m = lines[i].match(/^(\s*):(.*)$/);
        if (m) lines[i] = "    :" + m[2];
    }
    return lines.join("\n");
}

function normalizeIndentedBlock(text: string) {
    const lines = text.split("\n");

    // Compute minimum indent of non-empty lines and strip it.
    let min = Infinity;
    for (const l of lines) {
        if (l.trim().length === 0) continue;
        const n = countLeadingSpaces(l);
        if (n < min) min = n;
    }
    if (!isFinite(min) || min === 0) return text;

    return lines.map((l) => (l.trim().length === 0 ? "" : stripUpTo(l, min))).join("\n");
}

/**
 * Parse dd contents with markdown-it block parser, and unwrap a single paragraph
 * so `<dd>` doesn't become `<dd><p>...</p></dd>` for simple cases.
 */
function parseDdContentIntoTokens(state: any, text: string, line: number) {
    const ddText = looksLikeNestedDl(text) ? normalizeNestedDlText(text) : text;
    const normalized = normalizeIndentedBlock(ddText);

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
