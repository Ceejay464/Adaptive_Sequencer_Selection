> **Presentation mode:** actual saved notebook outputs, with code omitted. Read straight through; no installation or runtime is needed.


# 01 · Nash equilibrium with QuantEcon and Nashpy
**COMSCI/ECON 206 · Computational Microeconomics · Autumn 2026**

**Instructor: Prof. Luyao Zhang**

One game, two software libraries, one independent incentive check.

**Question:** if each player knows the payoffs and chooses without observing the other's choice, which strategy pairs are stable against a unilateral deviation?

**To change the game:** upload this notebook to Google Colab, select a CPU runtime, then Run all. Run the installation cell before importing packages; restart the runtime if a package update asks you to. The first QuantEcon calculation can take longer while its routines compile. No API key, GPU or repository clone is needed.

A payoff matrix describes a **static complete-information** game. Mixed strategies are probability distributions over actions. Do not confuse complete information (known payoff structure) with perfect information (observed prior moves).


**Teach without running:** this file contains saved tables and worked parameter changes. Scroll through the Markdown and outputs. Open it in Colab and run the cells only when you want to use the interactive controls.

[Open in Colab](https://colab.research.google.com/github/sunshineluyao/gt-tools-demos/blob/main/notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb) · [Read-only teaching page](https://github.com/sunshineluyao/gt-tools-demos/blob/main/docs/01_Matrix_Games_Demo.md).

## Game card · normal form

The row player chooses a row; the column player chooses a column. Each cell shows **(row payoff, column payoff)**. Both choose without seeing the other's current choice.

| Row / Column | Cooperate | Defect |
|---|---:|---:|
| Cooperate | (3, 3) | (0, 5) |
| Defect | (5, 0) | (1, 1) |

The two payoff arrays are

$$
A=\begin{pmatrix}3&0\\5&1\end{pmatrix},\qquad
B=\begin{pmatrix}3&5\\0&1\end{pmatrix}.
$$

A mixed strategy is a probability vector. Write the row strategy as $x=(x_0,x_1)$ and the column strategy as $y=(y_0,y_1)$. Their expected payoffs are

$$
u_1(x,y)=x^{\mathsf T}Ay,\qquad u_2(x,y)=x^{\mathsf T}By.
$$

A Nash equilibrium is a pair $(x^*,y^*)$ at which neither player gains by deviating alone:

$$
(x^*)^{\mathsf T}Ay^*\geq x^{\mathsf T}Ay^*\quad\text{for every }x,
$$

$$
(x^*)^{\mathsf T}By^*\geq(x^*)^{\mathsf T}By\quad\text{for every }y.
$$

**Baseline result:** both defect; the strategy vectors are $(0,1)$ and $(0,1)$; payoffs are $(1,1)$. The solver outputs below verify this statement.

## 1. Represent the game before solving it
Use **A[i,j]** for the row player's payoff and **B[i,j]** for the column player's payoff. In both displayed matrices, i is the row action and j is the column action. A strategy vector is ordered `[probability of action 0, probability of action 1]`.

Read the short function below line by line. The two libraries have different internal axis conventions; the comments mark the required transpose.


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

A deviation gain near zero verifies the stated candidate, not its behavioral realism.

Support enumeration need not describe an entire continuum in a degenerate game.

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

A deviation gain near zero verifies the stated candidate, not its behavioral realism.

Support enumeration need not describe an entire continuum in a degenerate game.

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

A deviation gain near zero verifies the stated candidate, not its behavioral realism.

Support enumeration need not describe an entire continuum in a degenerate game.

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

A deviation gain near zero verifies the stated candidate, not its behavioral realism.

Support enumeration need not describe an entire continuum in a degenerate game.

## 4. Change the game
Select a preset, edit any of the eight payoffs, and click **Solve and check**. A changed best response can create, remove or multiply equilibria.

If controls do not render, you can always call `explore_matrix(edited_A, edited_B)` in an ordinary code cell. Saving a notebook preserves output; widgets require rerunning their cell after reopening.


The widgets are for a live Colab/Jupyter session. The saved experiment immediately above provides a complete demonstration when you are only viewing this notebook.

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
