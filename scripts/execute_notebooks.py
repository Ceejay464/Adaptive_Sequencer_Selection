"""Run each notebook in a fresh local Python process and save ordered static output.

Use execute_with_jupyter.py for a standard Jupyter-kernel run (also used in CI).
This fallback supports hosts that cannot open local Jupyter sockets. It records
real Python calculations, figures and tables in their display order. Widget
source remains in the notebook; unsupported widget payloads are not committed.
"""
from pathlib import Path
import argparse
import contextlib
import io
import json
import os
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def execute_one(path):
    import nbformat
    from IPython.core.interactiveshell import InteractiveShell
    from IPython.core.displaypub import DisplayPublisher
    import matplotlib
    matplotlib.use("module://matplotlib_inline.backend_inline")
    from matplotlib_inline.backend_inline import configure_inline_support, flush_figures
    shell = InteractiveShell.instance()
    configure_inline_support(shell, "module://matplotlib_inline.backend_inline")
    notebook = nbformat.read(path, as_version=4)
    started = time.monotonic()
    count = 0
    os.chdir(ROOT)

    for index, cell in enumerate(notebook.cells):
        if cell.cell_type != "code":
            continue
        count += 1
        outputs = []

        class OrderedStream(io.TextIOBase):
            def __init__(self, name):
                self.name = name
            def write(self, text):
                if text:
                    if outputs and outputs[-1].output_type == "stream" and outputs[-1].name == self.name:
                        outputs[-1].text += text
                    else:
                        outputs.append(nbformat.v4.new_output("stream", name=self.name, text=text))
                return len(text)
            def flush(self):
                pass

        class OrderedPublisher(DisplayPublisher):
            def publish(self, data, metadata=None, **kwargs):
                if "application/vnd.jupyter.widget-view+json" in data:
                    data = {"text/plain": "Interactive controls: run this cell in Colab. Saved demonstrations are shown above."}
                    metadata = {}
                outputs.append(nbformat.v4.new_output("display_data", data=data, metadata=metadata or {}))
            def clear_output(self, wait=False):
                # There is no live frontend region here. Preserve the recorded demonstration.
                pass

        old_publisher = shell.display_pub
        shell.display_pub = OrderedPublisher(shell=shell)
        try:
            with contextlib.redirect_stdout(OrderedStream("stdout")), contextlib.redirect_stderr(OrderedStream("stderr")):
                result = shell.run_cell(cell.source, store_history=False)
                flush_figures()
        finally:
            shell.display_pub = old_publisher
        if result.error_before_exec or result.error_in_exec:
            error = result.error_before_exec or result.error_in_exec
            raise RuntimeError(f"{path.name}, cell {index + 1}: {error}") from error
        cell.execution_count = count
        cell.outputs = outputs

    notebook.metadata.pop("widgets", None)
    nbformat.validate(notebook)
    nbformat.write(notebook, path)
    record = {"notebook": str(path.relative_to(ROOT)), "status": "passed", "code_cells": count,
              "execution_seconds": round(time.monotonic()-started, 2),
              "method": "all cells executed in a fresh local Python process; real outputs captured in display order",
              "remote_colab_tested": False, "browser_widget_render_tested": False}
    (ROOT / "outputs" / (path.stem + "_execution.json")).write_text(json.dumps(record, indent=2) + "\n")
    print(json.dumps(record))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--one", type=Path)
    args = parser.parse_args()
    if args.one:
        execute_one(args.one.resolve())
    else:
        for notebook in sorted(ROOT.glob("notebooks/*/*.ipynb"), key=lambda p: p.name):
            subprocess.run([sys.executable, str(Path(__file__).resolve()), "--one", str(notebook)], check=True)
