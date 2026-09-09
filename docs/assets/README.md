# Visual assets

[Course home](../../README.md) · [Matrix demo](../01_Matrix_Games_Demo.md) · [Trees and types](../02_Trees_and_Information_Demo.md)

The repository's graphics explain the games and provide direct classroom navigation.

| Asset | Meaning and editable source |
|---|---|
| [Game-theory hero](game-theory-hero.svg) | Three distinct models: a prisoner's dilemma payoff grid, the sequential entry game, and a private-cost information structure |
| [Software decision tree](software_choice.mmd) | Select a notebook by timing and information |
| [Entry tree](entry_game.mmd) | Thick blue branches select entry and accommodation in the baseline SPNE |
| [Bayesian information sets](bayesian_information_sets.mmd) | Dotted purple links join indistinguishable nodes; I1, I2 and I3 are separate information sets |
| [Semantic figure manifest](figure_manifest.json) | Model sources, graphic IDs, evidence scope, palette, layout bands and provenance |
| `teach-*.svg`, `colab-*.svg`, `download.svg` | Original navigation images; their actual destinations are the enclosing Markdown links |

The hero is an original vector illustration. Its text, payoff grid, tree branches and information-set links remain editable. It contains no embedded raster art, external fonts, JavaScript or third-party logos. The information-structure panel intentionally omits terminal actions; notebook 02 and the teaching page provide the full game and payoffs. Blue emphasis selects the displayed equilibrium; dotted purple links mean indistinguishability, never a move.

Rebuild the hero, buttons and manifest with the Python standard library:

```bash
python scripts/build_repo_visuals.py
```

Rebuild the two saved-output teaching pages, including their navigation, in the notebook environment:

```bash
python scripts/build_teaching_pages.py
```

The README's three fenced Mermaid diagrams match the `.mmd` sources here. Keep each source and its README block in sync. Mermaid uses plain labels, `classDef` styling and no initialization directives, HTML labels, click handlers or scripts. Notebook game diagrams remain embedded PNG attachments for portability in GitHub and Colab.

The layout adapts the centered actions and vector hero of [Oracle4SD](https://github.com/sunshineluyao/Oracle4SD), the tutorial entry points and repository map of [Web3AI4IO-SD-Template](https://github.com/sunshineluyao/Web3AI4IO-SD-Template), and the classroom/provenance organization of [the network-visualization template](https://github.com/sunshineluyao/network-vis-emerging-tech-template). All game artwork and button glyphs are newly drawn. Original teaching content follows [the repository's license policy](../../LICENSE_POLICY.md).

The other PNG files in this directory are generated from actual notebook attachments and saved outputs. Regenerating teaching pages preserves that relationship.
