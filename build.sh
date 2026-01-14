#!/usr/bin/env bash
set -euo pipefail

# repo root で実行する想定
command -v pnpm >/dev/null

echo "==> Install"
pnpm install

echo "==> Clean"
pnpm -r --if-present run clean

echo "==> Build all packages"
pnpm build

echo "==> Test all packages"
pnpm test

echo "==> Done"
