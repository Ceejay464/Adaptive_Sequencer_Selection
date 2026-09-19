# Hugging Face interactive demo

## Link

**[Launch Sequencer Selection Mechanism Design](https://huggingface.co/spaces/asdfxsasd/Sequencer_Selection_Mechanism_Design)**

## What the Space demonstrates

The Hugging Face Space is the lightweight, browser-facing version of the project. It is designed to communicate the mechanism-design question without requiring a local Python environment.

The demo contrasts two repeated-selection environments:

- a fixed mechanism that allows accumulated competitive advantage to carry forward; and
- an adaptive anti-concentration mechanism that weakens future advantage when an agent's cumulative reward share becomes too large.

## Suggested walkthrough

1. Start with the default fixed mechanism and observe whether one sequencer develops a persistent lead.
2. Switch to the adaptive mechanism while keeping the other settings comparable.
3. Compare reward-share concentration and the distribution of sequencing wins.
4. Check system welfare rather than evaluating decentralization alone.
5. Repeat the comparison because a single stochastic run can be misleading.

## How to interpret the output

The intended result is not perfect equality. The design objective is a lower probability of persistent dominance while retaining most of the fixed mechanism's welfare. A useful evaluation therefore reports concentration and welfare together.

The Space is an educational research prototype. Its output is synthetic and does not establish the behavior of deployed sequencers, blockchain operators, human decision makers, or real financial systems.

## Relationship to the notebook

The Space is intended for quick interaction. The [Colab notebook](COLAB.md) provides the fuller model specification, game-theoretic benchmarks, independent Q-learning implementation, paired-seed experiments, correctness checks, and limitations.

