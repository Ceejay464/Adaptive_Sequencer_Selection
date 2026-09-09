# Optional publishing checks

These tools check Mermaid syntax and typeset the notebook/README formulas with KaTeX. Students do not need Node to read or run the Python notebooks.

```bash
npm install --prefix validation --ignore-scripts
node scripts/check_markdown.mjs
```

The checker records parser/typesetter results in `outputs/markdown_render_checks.json`. It does not claim a live GitHub or Colab browser test.
