# Google Colab notebook

## Open in Colab

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/140wnvKP6uoW_TY1fXSKdyZol7e7CtHf-)

The button opens the shared project notebook at:

```text
https://colab.research.google.com/drive/140wnvKP6uoW_TY1fXSKdyZol7e7CtHf-
```

Access depends on the Google Drive sharing settings chosen by the notebook owner.

## What the notebook contains

The notebook is the reproducible research core of the project. It moves from analytical benchmarks to the five-agent learning experiment:

- formal model primitives for score, selection probability, reward share, and adaptive damping;
- a two-player normal-form reduction for transparent Nash checks;
- an extensive-form PyGambit object with simultaneous-action information sets;
- a two-period benchmark for continuation incentives;
- five independent tabular Q-learning sequencers;
- fixed/adaptive equivalence tests when the damping strength is zero;
- paired multi-seed comparisons of concentration, welfare, and win shares;
- terminal-state one-round regret as an equilibrium-proximity diagnostic;
- interactive controls for mechanism parameters.

## How to run it

1. Open the Colab link.
2. Choose **Runtime → Run all**.
3. Allow the first setup cell to install any missing packages.
4. Review the correctness checks before interpreting the experiment.
5. Use the interactive laboratory near the end to vary the seed and mechanism parameters.

The default workflow uses CPU computation and does not require an API key.

## Notebook files

- `notebooks/Adaptive_Sequencer_Selection.ipynb` is the clean source notebook for Colab.
- `notebooks/Adaptive_Sequencer_Selection.executed.ipynb` includes saved outputs for inspection.

## Interpretation limits

The Q-learning outcome is equilibrium-like behavior in a simulated non-stationary environment. It is not, by itself, a proof of Nash equilibrium or subgame-perfect equilibrium. The finite benchmarks and terminal-regret calculation answer narrower questions and should not be presented as proof for the complete repeated game.
