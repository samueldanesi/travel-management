#!/usr/bin/env bash
# Compila il progetto e pubblica dist/ sul ramo gh-pages (GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=$(git remote get-url origin)
TMP=$(mktemp -d)
npm run build
cp -R dist/. "$TMP"/
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f "$REMOTE" gh-pages
rm -rf "$TMP"
