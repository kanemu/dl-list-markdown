import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        // VS Code extension 側は ESM/CJS 混在でも動くが、
        // 今回は ESM の dynamic import + mock で安定させている
        include: ["src/**/*.test.ts"]
    }
});
