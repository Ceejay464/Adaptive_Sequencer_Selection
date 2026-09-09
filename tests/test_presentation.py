"""Check the saved artifacts required for teaching without a runtime."""
from pathlib import Path
import base64
import re
import unittest
import nbformat

ROOT=Path(__file__).resolve().parents[1]

class PresentationTests(unittest.TestCase):
    def test_every_code_cell_has_successful_saved_output_state(self):
        for p in ROOT.glob('notebooks/*/*.ipynb'):
            nb=nbformat.read(p,as_version=4)
            nbformat.validate(nb)
            for c in nb.cells:
                if c.cell_type=='code':
                    self.assertIsNotNone(c.execution_count)
                    self.assertFalse(any(o.output_type=='error' for o in c.outputs))
                    self.assertFalse(any('application/vnd.jupyter.widget-view+json' in o.get('data',{}) for o in c.outputs))

    def test_figures_are_embedded_and_type_information_is_present(self):
        p=next(ROOT.glob('notebooks/gambit_pygambit/*.ipynb'))
        nb=nbformat.read(p,as_version=4)
        attachments=[]
        for c in nb.cells:
            for name,data in c.get('attachments',{}).items():
                self.assertTrue(base64.b64decode(data['image/png']).startswith(b'\x89PNG'))
                attachments.append(name)
        self.assertEqual(set(attachments),{'entry_tree.png','bayesian_tree.png'})
        text='\n'.join(c.source for c in nb.cells if c.cell_type=='markdown')
        for marker in ['**I1, Firm 1:**','**I2, Firm 2 low:**','**I3, Firm 2 high:**']:
            self.assertIn(marker,text)
        self.assertGreaterEqual(sum('image/png' in o.get('data',{}) for c in nb.cells for o in c.get('outputs',[])),5)

    def test_teaching_pages_have_tables_figures_and_no_python_blocks(self):
        for name in ['01_Matrix_Games_Demo.md','02_Trees_and_Information_Demo.md']:
            text=(ROOT/'docs'/name).read_text()
            self.assertNotIn('```python',text)
            self.assertIn('$$',text)
            self.assertIn('|',text)
            for link in re.findall(r'!\[[^\]]*\]\((assets/[^)]+)\)',text):
                self.assertTrue((ROOT/'docs'/link).is_file())

    def test_mermaid_sources_encode_information_sets(self):
        source=(ROOT/'docs/assets/bayesian_information_sets.mmd').read_text()
        self.assertIn('L -.- H',source)
        self.assertIn('LE -.- LO',source)
        self.assertIn('HE -.- HO',source)
        readme=(ROOT/'README.md').read_text()
        self.assertIn(source.strip(),readme)
        self.assertEqual(readme.count('```mermaid'),3)

    def test_saved_changed_parameter_examples(self):
        notebooks=list(ROOT.glob('notebooks/*/*.ipynb'))
        cells=[c for p in notebooks for c in nbformat.read(p,as_version=4).cells]
        demos=[c for c in cells if 'saved-demo' in c.metadata.get('tags',[])]
        self.assertEqual(len(demos),3)
        self.assertTrue(all(c.outputs for c in demos))
        self.assertTrue(all(not any(o.output_type=='error' for o in c.outputs) for c in demos))

if __name__=='__main__':
    unittest.main()
