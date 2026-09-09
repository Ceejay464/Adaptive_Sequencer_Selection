# Source and verification notes · 2026-09-09

The instructor's supplied *COMSCI_ECON206_Wednesday_Tools_and_Practice.pdf* and existing integrated Week 3 slide deck determined the baseline examples. The current instruction narrows the executable scope to two notebooks. Earlier signaling, advanced-equilibrium and PS1 demo notebooks are not included here.

The two supplied Colab Drive links could not be read during preparation. They are retained as legacy links rather than cited as code sources. The notebooks in this archive were written as new, self-contained, annotated teaching examples.

Current API signatures were inspected in installed QuantEcon 0.11.4, Nashpy 0.0.43 and PyGambit 16.7.0. The current PyGambit `add_outcome` API uses explicit `label=` and `payoffs=` arguments, and player lookups use labels. The examples do not assume obsolete integer player indexing. `enumpure_solve` enumerates pure Nash profiles; SPNE is checked separately.

Li et al. (2024), §4.3/4.3.1, explicitly uses Nashpy's Lemke–Howson implementation. Gemp et al. (ICLR 2024), Appendix C.1 (PDF p.45), compares seven Gambit methods. The full author/official PDFs were inspected to establish actual use. QuantEcon's JOSS article is categorized as a software paper, and its Markov-perfect-equilibrium lecture as a tutorial. Neither is mislabeled as an independent adoption study. GTE's software paper supplies worked demonstrations.

Gambit's current official citation names Rahul Savani and Theodore L. Turocy. The citation here records version 16.7.0 and the 2026 year of this teaching release. The PyPI metadata identifies the Gambit license as GPL-2.0-or-later. License texts for the ten tools in the README were downloaded from their upstream repositories; no software binaries or third-party article PDFs are bundled.

GTE's upstream README describes a Flash/ActionScript GUI. Live builder operation was not established. Desktop UI instructions follow official Gambit documentation; the desktop application was not launched here. A browser or student-account Colab session was not used to certify the notebook widgets. See the actual local execution and callback records in `outputs/`.
