[Course home](../README.md) · [Classroom guide](Wednesday_UI_Demo.md) · [Next: trees and private information](02_Trees_and_Information_Demo.md)

[![Open notebook 01 in Colab](assets/colab-01.svg)](https://colab.research.google.com/github/sunshineluyao/gt-tools-demos/blob/main/notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb)

[View annotated source and saved outputs](../notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb)

> [!TIP]
> **Presentation mode:** actual saved notebook outputs, with code omitted. Read straight through; no installation or runtime is needed.


# 01 · Nash equilibrium with QuantEcon and Nashpy
**COMSCI/ECON 206 · Computational Microeconomics · Autumn 2026**

**Instructor: Prof. Luyao Zhang**

This notebook uses one small game to teach one habit: **predict → compute → verify → change one payoff → explain**.

| Start here | Student action | Evidence to keep |
|---|---|---|
| ① Represent | Read each cell as **(row payoff, column payoff)** | Two players, two distinct strategies each, and all eight payoffs |
| ② Predict | Mark best responses before running code | A proposed pure or mixed equilibrium |
| ③ Verify | Run two solvers plus an independent deviation check | Agreement, payoff, and maximum unilateral gain |
| ④ Experiment | Edit any payoff in the control panel | Before/after result and one changed inequality |
| ⑤ Explain | State what the computation does—and does not—show | A two-sentence interpretation and boundary |

**Run in Colab:** use a CPU runtime, run the setup cell, then **Runtime → Run all**. No API key, GPU, or repository clone is needed. The saved outputs remain readable on GitHub; rerun the control cell to edit the game.

A payoff matrix describes a **static, complete-information** game. Mixed strategies are probability distributions over actions. Complete information means the payoff structure is known; it does not mean that a player observes the other's current action.

[Open in Colab](https://colab.research.google.com/github/sunshineluyao/gt-tools-demos/blob/main/notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb) · [Read-only teaching page](https://github.com/sunshineluyao/gt-tools-demos/blob/main/docs/01_Matrix_Games_Demo.md)

## Game card · normal form

The row player chooses a row; the column player chooses a column. Each cell shows **(row payoff, column payoff)**. Both choose without seeing the other's current choice.

| Row / Column | Cooperate | Defect |
|---|---:|---:|
| Cooperate | (3, 3) | (0, 5) |
| Defect | (5, 0) | (1, 1) |

Using row-major array notation, the payoff arrays are `A = [[3, 0], [5, 1]]` and `B = [[3, 5], [0, 1]]`. This is also the exact Python input.

A mixed strategy is a probability vector. Write the row strategy as $x=(x_0,x_1)$ and the column strategy as $y=(y_0,y_1)$. Their expected payoffs are

$$
u_1(x,y)=x^{\mathsf T}Ay,\qquad u_2(x,y)=x^{\mathsf T}By.
$$

A Nash equilibrium is a pair $(x^{\star},y^{\star})$ at which neither player gains by deviating alone:

$$
(x^{\star})^{\mathsf T}Ay^{\star}\geq x^{\mathsf T}Ay^{\star}\quad\text{for every }x,
$$

$$
(x^{\star})^{\mathsf T}By^{\star}\geq(x^{\star})^{\mathsf T}By\quad\text{for every }y.
$$

**Baseline result:** both defect; the strategy vectors are $(0,1)$ and $(0,1)$; payoffs are $(1,1)$. The solver outputs below verify this statement.

## 1. Represent, solve, and independently check

Use `A[i,j]` for the row player's payoff and `B[i,j]` for the column player's payoff. A strategy vector is ordered `[probability of action 0, probability of action 1]`.

| Technical cue | Pseudocode | Mathematical check | Why it matters |
|---|---|---|---|
| 🧩 **Input** | `read A, B` | $A,B\in\mathbb{R}^{2\times2}$ | A complete payoff for every strategy profile |
| ⚙️ **Solve** | `candidates ← Nashpy(A,B) ∪ QuantEcon(A,Bᵀ)` | $x,y\geq0$ and $\mathbf{1}^{\mathsf T}x=\mathbf{1}^{\mathsf T}y=1$ | `B.T` aligns QuantEcon's own-action axis |
| ✓ **Verify** | `gain ← largest unilateral deviation gain` | $\max\{\max_i(Ay)_i-x^{\mathsf T}Ay,\max_j(x^{\mathsf T}B)_j-x^{\mathsf T}By\}\leq\varepsilon$ | A solver label is not accepted without an incentive check |
| → **Report** | `show probabilities, payoffs, gain` | $u_1=x^{\mathsf T}Ay,\ u_2=x^{\mathsf T}By$ | Makes the result interpretable and reproducible |
| ⚠️ **Bound** | `flag ties or degeneracy` | finite output $\nRightarrow$ complete equilibrium continuum | Prevents an overclaim from a classroom computation |

The short function below implements exactly this table. The transpose is the only library-specific convention students must remember.

## 2. Predict, then run: the prisoner's dilemma
Before running, compare 5 with 3, then 1 with 0. Which row action is a best response in both columns? Repeat for the column player.


|  | Column: Cooperate | Column: Defect |
| --- | --- | --- |
| Row: Cooperate | (3, 3) | (0, 5) |
| Row: Defect | (5, 0) | (1, 1) |

|  | Tool | P(row action 0) | P(column action 0) | Row payoff | Column payoff | Deviation gain |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Nashpy | 0.0 | 0.0 | 1.0 | 1.0 | 0.0 |
| 1 | QuantEcon | 0.0 | 0.0 | 1.0 | 1.0 | 0.0 |

Pure Nash outcomes (row, column): [(1, 1)]

A near-zero deviation gain verifies the candidate; it does not establish behavioral realism.

## 3. A mixed equilibrium: matching pennies
Write the indifference equation for each player. Then compare your answer with both libraries.


| Row / Column | Heads | Tails |
|---|---:|---:|
| Heads | (1, −1) | (−1, 1) |
| Tails | (−1, 1) | (1, −1) |

If the column player chooses Heads with probability $q$, the row player's payoffs from Heads and Tails are $2q-1$ and $1-2q$. Indifference gives

$$
2q-1=1-2q\quad\Longrightarrow\quad q=1/2.
$$

The other player's indifference condition gives the same probability. Both players use $(1/2,1/2)$ and earn expected payoff 0.


|  | Column: Heads | Column: Tails |
| --- | --- | --- |
| Row: Heads | (1, -1) | (-1, 1) |
| Row: Tails | (-1, 1) | (1, -1) |

|  | Tool | P(row action 0) | P(column action 0) | Row payoff | Column payoff | Deviation gain |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Nashpy | 0.5 | 0.5 | 0.0 | 0.0 | 0.0 |
| 1 | QuantEcon | 0.5 | 0.5 | 0.0 | 0.0 | 0.0 |

Pure Nash outcomes (row, column): []

A near-zero deviation gain verifies the candidate; it does not establish behavioral realism.

## Saved experiment · change one payoff

This comparison has already been run, so it is visible in the GitHub preview. Start with Coordination. Raising the row player's payoff at (action 1, action 0) from 0 to 3 makes action 1 strictly dominant for the row player. Predict which equilibria disappear, then read the saved tables.

Before: coordination game

|  | Column: Action 0 | Column: Action 1 |
| --- | --- | --- |
| Row: Action 0 | (2, 2) | (0, 0) |
| Row: Action 1 | (0, 0) | (1, 1) |

|  | Tool | P(row action 0) | P(column action 0) | Row payoff | Column payoff | Deviation gain |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Nashpy | 1.000000 | 1.000000 | 2.000000 | 2.000000 | 0.0 |
| 1 | Nashpy | 0.000000 | 0.000000 | 1.000000 | 1.000000 | 0.0 |
| 2 | Nashpy | 0.333333 | 0.333333 | 0.666667 | 0.666667 | 0.0 |
| 3 | QuantEcon | 1.000000 | 1.000000 | 2.000000 | 2.000000 | 0.0 |
| 4 | QuantEcon | 0.000000 | 0.000000 | 1.000000 | 1.000000 | 0.0 |
| 5 | QuantEcon | 0.333333 | 0.333333 | 0.666667 | 0.666667 | 0.0 |

Pure Nash outcomes (row, column): [(0, 0), (1, 1)]

A near-zero deviation gain verifies the candidate; it does not establish behavioral realism.

After: row payoff A[1,0] raised from 0 to 3

|  | Column: Action 0 | Column: Action 1 |
| --- | --- | --- |
| Row: Action 0 | (2, 2) | (0, 0) |
| Row: Action 1 | (3, 0) | (1, 1) |

|  | Tool | P(row action 0) | P(column action 0) | Row payoff | Column payoff | Deviation gain |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Nashpy | 0.0 | 0.0 | 1.0 | 1.0 | 0.0 |
| 1 | QuantEcon | 0.0 | 0.0 | 1.0 | 1.0 | 0.0 |

Pure Nash outcomes (row, column): [(1, 1)]

A near-zero deviation gain verifies the candidate; it does not establish behavioral realism.

## 4. Interactive payoff laboratory

1. Choose a preset and **predict** the equilibrium.
2. Edit any of the eight payoffs. Each box is labeled `A[i,j]` or `B[i,j]`.
3. Select **Solve and check**; compare the equilibrium, payoffs, and deviation gain with your prediction.
4. Change only one number again. Identify the best-response inequality that changed.

If controls do not render, rerun this cell or call `explore_matrix(edited_A, edited_B)` in a normal code cell. Widgets are live only in Colab/Jupyter; the saved experiment above remains visible in GitHub.

## 5. Explain what changed
1. Start from Coordination. How many pure outcomes and mixed candidates are returned?
2. Change just one payoff. Which deviation inequality changes sign?
3. Make two actions tied. Why does a finite list of candidates not necessarily describe every equilibrium?

**Three disciplinary lenses:** economics interprets incentives and welfare; computer science checks representation, algorithms and numerical error; behavioral science asks whether real participants would follow the equilibrium benchmark. Write your prediction before asking an AI assistant for an explanation.


## Read, cite, and extend

- Nash, J. F. (1950). *Equilibrium points in n-person games*. PNAS, 36(1), 48–49. https://doi.org/10.1073/pnas.36.1.48
- Knight, V., & Campbell, J. (2018). *Nashpy: A Python library for the computation of Nash equilibria*. JOSS, 3(30), 904. https://doi.org/10.21105/joss.00904
- Batista et al. (2024). *QuantEcon.py: A community based Python library for quantitative economics*. JOSS, 9(93), 5585. https://doi.org/10.21105/joss.05585
- Research use: Li et al. (2024), *A survey on algorithms for Nash equilibria in finite normal-form games*, Computer Science Review, 51, 100613. Section 4.3 explicitly uses Nashpy's Lemke–Howson implementation. https://doi.org/10.1016/j.cosrev.2023.100613
- API documentation: [Nashpy](https://nashpy.readthedocs.io/en/stable/) · [QuantEcon game theory](https://quanteconpy.readthedocs.io/en/latest/game_theory.html).

**Both libraries use the MIT license.** The repository README links their upstream license files. The matrices here are small classroom illustrations, not empirical measurements or reproductions of the papers' experiments.


---

[Course home](../README.md) · [Next: trees and private information](02_Trees_and_Information_Demo.md) · [Experiment in Colab](https://colab.research.google.com/github/sunshineluyao/gt-tools-demos/blob/main/notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb)
