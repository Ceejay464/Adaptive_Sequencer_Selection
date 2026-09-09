# Setup and classroom preflight

## Google Colab
Upload either notebook and use CPU. Run its first cell before class. The notebook installs its named package versions and reports them. PyGambit 16.7.0 may compile from source on Linux; the first build can take several minutes. Do not interpret a quiet compiler as a finished installation. Restart if Colab requests it after dependency changes.

After imports, run the baseline examples before editing controls. In notebook 01, the two libraries must agree on Defect/Defect and half/half matching pennies. In notebook 02, check the entry and private-cost baseline answers printed in the notebook. The Files sidebar contains exported games under `game_exports/`.

Widgets require an active Python kernel. If they do not appear, rerun the imports and widget cell, or call `explore_matrix(A, B)`, `explore_entry(...)` or `explore_bayesian(...)` directly. A saved notebook does not keep a remote Python session running.

## Local Python
Use Python 3.12 for the recorded environment. Install `requirements.txt` in a virtual environment, then `requirements-dev.txt` for notebook execution. Use that environment's Python as the notebook kernel. Requirements are exact versions for this release; later releases can update them after rechecking the examples.

PyGambit is installed as `pygambit` and imported as `pygambit`. Do not substitute the unrelated PyPI package named `gambit`.

On Linux, source builds need GNU C/C++ and archive tools. If a Python distribution points to a missing compiler, use the explicit environment shown below after confirming those tools are installed:

```bash
CC=gcc CXX=g++ AR=ar RANLIB=ranlib LDSHARED='g++ -shared' python -m pip install pygambit==16.7.0
```

The notebook setup performs this GNU-tool selection on Linux. It does not install operating-system packages. Use the official Gambit installation documentation for other platforms. The tested notebook examples require no proprietary solver.

## Desktop Gambit and GTE
Install the Gambit desktop application separately from the Python package. Before class, open `examples/entry_baseline.efg` and `examples/bayesian_baseline.efg`, inspect the information sets, and run Tools → Equilibrium. Use the installed application's documentation if its menu labels differ from version 16.7.0.

Preflight the GTE links in the README. The GTE repository documents a Flash interface, and live browser functionality was not verified here. If it does not render, teach the same representations using Gambit and the exported files.

## Publishing notebook links
The repository is `sunshineluyao/gt-tools-demos`. Its Colab links are already configured. If you move it, update the owner/repository with:

```bash
python scripts/configure_colab_links.py --repository sunshineluyao/gt-tools-demos --branch main
```

This updates the README links locally. Commit that update, then check each link in a student account. Private repository access depends on the student's GitHub/Colab authorization. Creating links does not create a repository, upload a notebook or invite students.


For presentation without a runtime, open [Matrix Games Demo](01_Matrix_Games_Demo.md) or [Trees and Information Demo](02_Trees_and_Information_Demo.md). Both pages are generated from the executed notebooks.
