"""Generate direct Colab links after the instructor creates the GitHub repository."""
import argparse
import re
from pathlib import Path
from urllib.parse import quote

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--repository", required=True, help="GitHub OWNER/REPOSITORY")
parser.add_argument("--branch", default="main")
args = parser.parse_args()
if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", args.repository):
    parser.error("Use OWNER/REPOSITORY, without a URL or spaces.")
root = Path(__file__).resolve().parents[1]
notebooks = sorted(root.glob("notebooks/*/*.ipynb"))
lines = ["Direct Colab links (check student access after uploading the repository):", ""]
for notebook in notebooks:
    relative = notebook.relative_to(root).as_posix()
    url = f"https://colab.research.google.com/github/{args.repository}/blob/{quote(args.branch, safe='')}/{quote(relative)}"
    lines.append(f"- [{notebook.stem}]({url})")
readme = root / "README.md"
text = readme.read_text()
start, end = "<!-- COLAB_LINKS_START -->", "<!-- COLAB_LINKS_END -->"
if text.count(start) != 1 or text.count(end) != 1:
    raise ValueError("README must contain one Colab link block.")
text = text.split(start)[0] + start + "\n" + "\n".join(lines) + "\n" + end + text.split(end)[1]
readme.write_text(text)
print("Updated README links. Upload the change, then verify access in a student account.")
