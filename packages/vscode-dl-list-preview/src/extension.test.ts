import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks (must be defined at top-level) ---
const getConfigurationMock = vi.fn();
const dlListMock = vi.fn();

// `import * as vscode from "vscode"` を確実に差し替える
vi.mock("vscode", () => {
    return {
        workspace: {
            getConfiguration: (...args: any[]) => getConfigurationMock(...args),
        },
    };
});

// `import dlList from "markdown-it-dl-list"` を差し替える
vi.mock("markdown-it-dl-list", () => {
    return { default: dlListMock };
});

function createMdStub() {
    return {
        use: vi.fn(),
        core: {
            ruler: {
                push: vi.fn(),
            },
        },
    };
}

function findCoreRule(md: any, name: string) {
    const calls = md.core.ruler.push.mock.calls as any[];
    const hit = calls.find((c) => c?.[0] === name);
    return hit ? hit[1] : undefined;
}

describe("vscode-dl-list-preview extension", () => {
    beforeEach(() => {
        vi.resetModules(); // extension.ts を毎回 fresh import するため
        getConfigurationMock.mockReset();
        dlListMock.mockReset();

        // default config behavior: cfg.get(key, defaultValue) => defaultValue
        getConfigurationMock.mockReturnValue({
            get: (_key: string, defaultValue: any) => defaultValue,
        });
    });

    async function load() {
        // mocks are already registered above (hoisted)
        return await import("./extension");
    }

    it("registers markdown-it-dl-list with default ddIndent (4) and registers a core rule", async () => {
        const { activate } = await load();

        const api = activate();
        expect(api).toBeTruthy();
        expect(typeof api.extendMarkdownIt).toBe("function");

        const md = createMdStub();
        const returned = api.extendMarkdownIt(md);

        // returns same md instance
        expect(returned).toBe(md);

        // reads config namespace
        expect(getConfigurationMock).toHaveBeenCalledWith("dlListPreview");

        // plugin is registered
        expect(md.use).toHaveBeenCalledTimes(1);
        expect(md.use).toHaveBeenCalledWith(
            dlListMock,
            expect.objectContaining({ ddIndent: 4 })
        );

        // core rule is registered
        expect(md.core.ruler.push).toHaveBeenCalledTimes(1);
        expect(md.core.ruler.push).toHaveBeenCalledWith(
            "remove_dl_source_map",
            expect.any(Function)
        );
    });

    it("core rule removes map from dl_list_open tokens (so VS Code doesn't attach data-line/code-line)", async () => {
        const { activate } = await load();

        const md = createMdStub();
        activate().extendMarkdownIt(md);

        const rule = findCoreRule(md, "remove_dl_source_map");
        expect(typeof rule).toBe("function");

        const state: any = {
            tokens: [
                { type: "paragraph_open", map: [0, 1] },
                { type: "dl_list_open", map: [1, 10] },
                { type: "dl_dt_open", map: [1, 2] },
                { type: "inline", map: [1, 2] },
                { type: "dl_dt_close", map: [1, 2] },
                { type: "dl_dd_open", map: [2, 3] },
                { type: "inline", map: [2, 3] },
                { type: "dl_dd_close", map: [2, 3] },
                { type: "dl_list_close", map: [1, 10] },
                { type: "paragraph_close", map: [0, 1] },
            ],
        };

        rule(state);

        // Non-dl tokens keep map
        expect(state.tokens[0].map).toEqual([0, 1]);
        expect(state.tokens[state.tokens.length - 1].map).toEqual([0, 1]);

        // dl_list_open loses map (null or undefined)
        const dlOpen = state.tokens.find((t: any) => t.type === "dl_list_open");
        expect(dlOpen).toBeTruthy();
        expect(dlOpen.map == null).toBe(true);

        // (Optional) Ensure at least one other dl token still has map (current behavior)
        // This guards that we're not accidentally over-clearing maps.
        const dtOpen = state.tokens.find((t: any) => t.type === "dl_dt_open");
        expect(dtOpen).toBeTruthy();
        expect(dtOpen.map).toEqual([1, 2]);
    });

    it("clamps ddIndent to min=1", async () => {
        getConfigurationMock.mockReturnValue({
            get: () => 0,
        });

        const { activate } = await load();

        const md = createMdStub();
        activate().extendMarkdownIt(md);

        expect(md.use).toHaveBeenCalledTimes(1);
        expect(md.use).toHaveBeenCalledWith(
            dlListMock,
            expect.objectContaining({ ddIndent: 1 })
        );
    });

    it("clamps ddIndent to max=12", async () => {
        getConfigurationMock.mockReturnValue({
            get: () => 999,
        });

        const { activate } = await load();

        const md = createMdStub();
        activate().extendMarkdownIt(md);

        expect(md.use).toHaveBeenCalledTimes(1);
        expect(md.use).toHaveBeenCalledWith(
            dlListMock,
            expect.objectContaining({ ddIndent: 12 })
        );
    });

    it("floors non-integer ddIndent values", async () => {
        getConfigurationMock.mockReturnValue({
            get: () => 2.9,
        });

        const { activate } = await load();

        const md = createMdStub();
        activate().extendMarkdownIt(md);

        expect(md.use).toHaveBeenCalledTimes(1);
        expect(md.use).toHaveBeenCalledWith(
            dlListMock,
            expect.objectContaining({ ddIndent: 2 })
        );
    });
});
