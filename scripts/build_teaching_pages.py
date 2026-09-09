"""Build code-free GitHub Markdown pages from the actual executed notebooks."""
from pathlib import Path
import base64
import re
import nbformat
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
TARGETS={
 '01_QuantEcon_Nashpy_Interactive.ipynb':'01_Matrix_Games_Demo.md',
 '02_Gambit_PyGambit_Interactive.ipynb':'02_Trees_and_Information_Demo.md',
}

def html_tables(html):
    """Convert the simple pandas tables into readable GitHub Markdown tables."""
    soup=BeautifulSoup(html,'html.parser')
    chunks=[]
    for table in soup.find_all('table'):
        rows=[]
        for tr in table.find_all('tr'):
            cells=[cell.get_text(' ',strip=True).replace('|','\\|') for cell in tr.find_all(['th','td'])]
            rows.append(cells)
        if rows:
            chunks.append('| '+' | '.join(rows[0])+' |\n| '+' | '.join(['---']*len(rows[0]))+' |\n'+'\n'.join('| '+' | '.join(row)+' |' for row in rows[1:]))
    return '\n\n'.join(chunks)

for path in sorted(ROOT.glob('notebooks/*/*.ipynb'),key=lambda p:p.name):
    nb=nbformat.read(path,as_version=4)
    if any(c.cell_type=='code' and not c.execution_count for c in nb.cells):
        raise ValueError('Execute every code cell before generating a teaching page.')
    chunks=['> **Presentation mode:** actual saved notebook outputs, with code omitted. Read straight through; no installation or runtime is needed.\n']
    asset_dir=ROOT/'docs/assets'
    for ci,cell in enumerate(nb.cells):
        if cell.cell_type=='markdown':
            text=cell.source
            for name,mimes in cell.get('attachments',{}).items():
                if 'image/png' in mimes:
                    (asset_dir/name).write_bytes(base64.b64decode(mimes['image/png']))
                    text=text.replace('attachment:'+name,'assets/'+name)
            chunks.append(text)
            continue
        tags=cell.metadata.get('tags',[])
        if 'setup' in tags or 'imports' in tags or 'widgets' in tags:
            continue
        for oi,output in enumerate(cell.get('outputs',[])):
            if output.output_type=='error':
                raise ValueError('A failed notebook cannot produce a teaching page.')
            if output.output_type=='stream':
                text=output.text.strip()
                if text:
                    # Solver commentary is plain prose, so it remains easy to read.
                    chunks.append(text.replace('\n','  \n'))
            data=output.get('data',{})
            if 'image/png' in data:
                name=f'{path.stem}_{ci:02d}_{oi:02d}.png'
                (asset_dir/name).write_bytes(base64.b64decode(data['image/png']))
                chunks.append(f'![Computed game tree from this executed example.](assets/{name})')
            elif 'text/html' in data:
                table=html_tables(data['text/html'])
                if table:chunks.append(table)
            elif 'text/markdown' in data:
                chunks.append(data['text/markdown'])
            elif 'text/plain' in data and not data['text/plain'].startswith('<'):
                chunks.append(data['text/plain'])
    # Notebook links remain canonical; local figure assets use relative paths.
    output=ROOT/'docs'/TARGETS[path.name]
    output.write_text('\n\n'.join(chunks)+'\n')
    print(output.relative_to(ROOT))
