"""Write a deterministic SHA-256 manifest of release files."""
from hashlib import sha256
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'outputs' / 'file_manifest.json'
EXCLUDED_PARTS = {'.git', '.venv', 'dist', 'node_modules', '__pycache__', '.ipynb_checkpoints'}
EXCLUDED_FILES = {'outputs/three_lens_desktop.png', 'outputs/three_lens_mobile.png'}

manifest = {}
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or path == OUTPUT:
        continue
    relative = path.relative_to(ROOT)
    if EXCLUDED_PARTS.intersection(relative.parts) or relative.as_posix() in EXCLUDED_FILES:
        continue
    payload = path.read_bytes()
    manifest[relative.as_posix()] = {
        'bytes': len(payload),
        'sha256': sha256(payload).hexdigest(),
    }

OUTPUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
print(f'Wrote {len(manifest)} release-file hashes to {OUTPUT.relative_to(ROOT)}')
