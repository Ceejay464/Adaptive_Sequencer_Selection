"""Execute both notebooks with standard Jupyter kernels into an output directory."""
from pathlib import Path
import argparse
import json
import time
import nbformat
from nbclient import NotebookClient

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--kernel', default='python3')
parser.add_argument('--output-dir', type=Path, default=root/'outputs'/'jupyter_run')
args = parser.parse_args()
args.output_dir.mkdir(parents=True, exist_ok=True)
results = []
for path in sorted(root.glob('notebooks/*/*.ipynb'), key=lambda p: p.name):
    notebook = nbformat.read(path, as_version=4)
    started = time.monotonic()
    # One new kernel per notebook; failures stop the run immediately.
    NotebookClient(notebook, timeout=900, kernel_name=args.kernel,
                   resources={'metadata': {'path': str(root)}}).execute()
    nbformat.validate(notebook)
    nbformat.write(notebook, args.output_dir/path.name)
    results.append({'notebook': path.name, 'status': 'passed',
                    'code_cells': sum(c.cell_type=='code' for c in notebook.cells),
                    'seconds': round(time.monotonic()-started,2)})
    print(results[-1], flush=True)
(args.output_dir/'execution.json').write_text(json.dumps(results,indent=2)+'\n')
