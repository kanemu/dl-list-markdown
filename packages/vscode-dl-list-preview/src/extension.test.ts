import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks (must be defined at top-level) ---
const getConfigurationMock = vi.fn();
const dlListMock = vi.fn();

// `import * as vscode from "vscode"` を確実に差し替える
vi.mock("vscode", () => {
    return {
        workspace: {
            getConfiguration: (...args: any[]) => getConfigurationMock(...args)
        }
    };
});

// `import dlList from "markdown-it-dl-list"` を差し替える
vi.mock("markdown-it-dl-list", () => {
    return { default: dlListMock };
});

describe("vscode-dl-list-preview extension", () => {
    beforeEach(() => {
        vi.resetModules(); // extension.ts を毎回 fresh import するため
        getConfigurationMock.mockReset();
        dlListMock.mockReset();

        // default config behavior: cfg.get(key, defaultValue) => defaultValue
        getConfigurationMock.mockReturnValue({
            get: (_key: string, defaultValue: any) => defaultValue
        });
    });

    async function load() {
        // mocks are already registered above (hoisted)
        return await import("./extension");
    }

    it("registers markdown-it-dl-list with default ddIndent (4)", async () => {
        const { activate } = await load();

        const api = activate();
        expect(api).toBeTruthy();
        expect(typeof api.extendMarkdownIt).toBe("function");

        const md = { use: vi.fn() };
        api.extendMarkdownIt(md);

        expect(getConfigurationMock).toHaveBeenCalledWith("dlListPreview");
        expect(md.use).toHaveBeenCalledTimes(1);
        expect(md.use).toHaveBeenCalledWith(dlListMock, { ddIndent: 4 });
    });

    it("clamps ddIndent to min=1", async () => {
        getConfigurationMock.mockReturnValue({
            get: () => 0
        });

        const { activate } = await load();

        const md = { use: vi.fn() };
        activate().extendMarkdownIt(md);

        expect(md.use).toHaveBeenCalledWith(dlListMock, { ddIndent: 1 });
    });

    it("clamps ddIndent to max=12", async () => {
        getConfigurationMock.mockReturnValue({
            get: () => 999
        });

        const { activate } = await load();

        const md = { use: vi.fn() };
        activate().extendMarkdownIt(md);

        expect(md.use).toHaveBeenCalledWith(dlListMock, { ddIndent: 12 });
    });

    it("floors non-integer ddIndent values", async () => {
        getConfigurationMock.mockReturnValue({
            get: () => 2.9
        });

        const { activate } = await load();

        const md = { use: vi.fn() };
        activate().extendMarkdownIt(md);

        expect(md.use).toHaveBeenCalledWith(dlListMock, { ddIndent: 2 });
    });

    it("returns the same md instance", async () => {
        const { activate } = await load();

        const md = { use: vi.fn() };
        const returned = activate().extendMarkdownIt(md);

        expect(returned).toBe(md);
    });
});
