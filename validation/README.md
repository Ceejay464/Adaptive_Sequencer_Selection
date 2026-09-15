# Publishing checks

These tools check Mermaid syntax, typeset notebook/README formulas with KaTeX, reject Markdown-sensitive superscript syntax, and exercise the static tutorial in Chromium. Students do not need these development dependencies to use the built site or Python notebooks.

```bash
npm install --prefix validation --ignore-scripts
./validation/node_modules/.bin/playwright install chromium
node scripts/check_markdown.mjs
npm run build
node scripts/check_browser.mjs
```

The checks record parser/typesetter results in `outputs/markdown_render_checks.json` and responsive browser results in `outputs/browser_render_checks.json`. The browser run is local and does not claim a live GitHub README or Google Colab student-account session.
