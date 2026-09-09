# Wednesday · Tools and Practice
**COMSCI/ECON 206 · Week 3 · Instructor: Prof. Luyao Zhang**

[Course home](../README.md) · [Teach matrices](01_Matrix_Games_Demo.md) · [Teach trees and types](02_Trees_and_Information_Demo.md)

## Learning route and outcomes
By the end, students should select a representation, calculate a small equilibrium, change an assumption and explain the change. The sequence is **Nash → Selten → Harsanyi**: matrix incentives, credible continuation and private information.

Use exactly two notebooks. QuantEcon and Nashpy share notebook 01; Gambit/PyGambit and both tree models share notebook 02. The class has an editable GUI demonstration alongside the code. Advanced tool folders remain empty for later weeks.

## Suggested 75-minute practice block
Times are relative to the start of practice; the instructor can fit this block into Wednesday's agenda.

| Minutes | Activity | Student action and evidence |
|---|---|---|
| 0–5 | Choose a representation | Identify timing, known payoffs and hidden information |
| 5–20 | Notebook 01: QuantEcon + Nashpy | Predict Defect/Defect; verify matching pennies; change a payoff |
| 20–35 | Notebook 02: Selten entry game | Compare the two pure Nash profiles with the unique baseline SPNE |
| 35–50 | Notebook 02: Harsanyi private costs | Trace information sets; change a prior and a cost; check each type's incentives |
| 50–65 | Gambit desktop UI; GTE introduction | Open exported games, inspect profiles, edit and compare representations |
| 65–75 | Interdisciplinary explanation | Submit changed input, prior prediction, computed answer and interpretation |

Run installation cells before this block. PyGambit source compilation is not included in the 75-minute teaching estimate.

## Baseline answers for the instructor

| Example | Correct baseline answer | What must not be inferred |
|---|---|---|
| Prisoner's dilemma | Both defect; payoffs (1,1) | Equilibrium need not maximize joint payoff |
| Matching pennies | Each player uses (1/2,1/2); expected payoffs (0,0) | Absence of a pure equilibrium is not absence of equilibrium |
| Sequential entry | Pure Nash: (Out,Fight) and (In,Accommodate). Unique SPNE: (In,Accommodate) | A Nash computation alone does not establish credibility in every subgame |
| Private-cost entry | Firm 1 enters; Firm 2 low enters, high stays out. Expected payoffs (2,1/2) | The tree does not imply that a firm sees the other's choice |

Private-cost assumptions: each sole entrant earns revenue 4; if both enter each earns revenue 2. Firm 1's cost is 1. Firm 2's cost is 1 or 3 with probability 1/2 each. Out pays 0. All numerical examples are classroom illustrations.

## UI demonstration A · Gambit desktop

**Prepare:** install the desktop application from the official Gambit site. Have `prisoners_dilemma.nfg`, `entry_baseline.efg` and `bayesian_baseline.efg` ready from `examples/`. Notebook 02 regenerates the same files.

1. **Matrix:** open `prisoners_dilemma.nfg`. Point out player order, strategies and payoff pairs. Ask for the prediction before opening the equilibrium dialog.
2. **Tree:** open `entry_baseline.efg`. Ask students to identify the entrant's two choices and the incumbent's continuation. Read each terminal payoff pair in player order.
3. **Compute:** choose **Tools → Equilibrium**. Use the available pure-strategy enumeration method if shown; otherwise inspect the algorithm's stated scope and compare its returned profiles with the notebook's exhaustive pure list. Choose **View → Profiles** to inspect computed strategies.
4. **Interpret:** compare (Out,Fight) with (In,Accommodate). Ask: “If entry actually occurred, would fighting be optimal?” The notebook's backward-induction calculation answers the SPNE question separately.
5. **Edit:** change the incumbent's Fight payoff in the notebook from −1 to 2, click Rebuild and solve, and open `entry_current.efg`. The credible continuation is now Fight and the entrant chooses Out. The UI also supports editing terminal payoffs; use it to show the same change visually.
6. **Private information:** open `bayesian_baseline.efg`. Locate Nature's low/high branches. Show that Firm 1's two nodes share an information set; then show Firm 2's separate low/high information sets, each joining the two possible Firm 1 actions. **Format → Labels** controls tree labels.
7. **Compare:** set P(low cost) to 0.8 in the notebook, rebuild, and reopen `bayesian_current.efg`. At the default costs the same pure actions remain optimal, while Firm 1's expected payoff falls to 1.4. A changed belief need not change equilibrium actions.

A desktop GUI run was not performed in this environment. Menu references follow the official Gambit 16.7.0 documentation; the exported game files are checked independently in Python.

## UI demonstration B · Game Theory Explorer

GTE is a graphical, web-based tool for constructing and analyzing extensive-form trees and strategic-form matrices, with algorithms for Nash equilibria. It is **GPL-3.0** software.

- Landing page: http://www.gametheoryexplorer.org/
- Builder: http://gte.csc.liv.ac.uk/gte/builder/
- Required citation: Rahul Savani and Bernhard von Stengel (2015), *Game Theory Explorer – Software for the Applied Game Theorist*, Computational Management Science 12, 5–33. https://doi.org/10.1007/s10287-014-0206-x

**Before class:** check whether the supplied builder renders. Its source repository documents a legacy Flash GUI; this package does not install Flash and does not claim the current site works.

**If accessible:** demonstrate the same tiny entry game: two players, Out/In at the root, Fight/Accommodate after In, and payoffs (0,2), (−1,−1), (1,1). Compare the tree and strategic representations and discuss a computed Nash profile. Follow the controls in the live version rather than assuming menu labels from a screenshot.

**If unavailable:** show the notebook tree and continue in Gambit desktop. The learning goal is the representation and interpretation, and the ready-to-open files preserve that activity.

## Interdisciplinary exit ticket

Each student records one changed input, a prediction before running, the resulting output and a two-sentence explanation.

- Economist: which incentive or welfare comparison changed?
- Computer scientist: how does the representation or algorithm determine what was computed?
- Behavioral scientist: what observable choice might depart from the benchmark, and how would you investigate it?

## References

Nash (1950), https://doi.org/10.1073/pnas.36.1.48. Selten (1965), https://www.jstor.org/stable/40748884. Harsanyi (1967), https://doi.org/10.1287/mnsc.14.3.159. Software citations and actual research-use examples are in the repository README.

Official GUI sources: https://gambitproject.readthedocs.io/en/stable/gui.nash.html and https://gambitproject.readthedocs.io/en/stable/gui.efg.html. GTE source: https://github.com/gambitproject/gte.


For presentation without a runtime, open [Matrix Games Demo](01_Matrix_Games_Demo.md) or [Trees and Information Demo](02_Trees_and_Information_Demo.md). Both pages are generated from the executed notebooks.
