"""Independent checks of the teaching models and interactive control wiring."""
import ast
import contextlib
import io
import json
from pathlib import Path
import unittest
import numpy as np
import pygambit as gb

ROOT = Path(__file__).resolve().parents[1]


def load_notebook(relative):
    """Load the actual notebook functions, without running presentation/example cells."""
    notebook = json.loads((ROOT / relative).read_text())
    for cell in notebook['cells']:
        if isinstance(cell['source'], list):
            cell['source'] = ''.join(cell['source'])
    namespace = {}
    for cell in notebook['cells']:
        if cell['cell_type'] != 'code':
            continue
        tags = cell['metadata'].get('tags', [])
        if 'imports' in tags:
            exec(cell['source'], namespace)
        if 'model' in tags or 'display-helper' in tags:
            tree = ast.parse(cell['source'])
            functions = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
            exec(compile(ast.Module(body=functions, type_ignores=[]), relative, 'exec'), namespace)
    return notebook, namespace


class MatrixTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.notebook, cls.ns = load_notebook('notebooks/quantecon_nashpy/01_QuantEcon_Nashpy_Interactive.ipynb')

    def test_prisoners_dilemma(self):
        table, pure, _ = self.ns['solve_matrix']([[3,0],[5,1]], [[3,5],[0,1]])
        self.assertEqual(pure, [(1,1)])
        self.assertEqual(set(table.Tool), {'Nashpy','QuantEcon'})
        self.assertTrue(np.allclose(table[['Row payoff','Column payoff']], 1))

    def test_matching_pennies(self):
        table, pure, _ = self.ns['solve_matrix']([[1,-1],[-1,1]], [[-1,1],[1,-1]])
        self.assertEqual(pure, [])
        self.assertEqual(len(table), 2)
        self.assertTrue(np.allclose(table[['P(row action 0)','P(column action 0)']], .5))
        self.assertTrue(np.allclose(table[['Row payoff','Column payoff']], 0))

    def test_asymmetric_axis_convention(self):
        # Row strictly prefers action 0; column strictly prefers action 1.
        # Transposing B incorrectly would change that prediction.
        table, pure, _ = self.ns['solve_matrix']([[4,3],[1,0]], [[0,5],[1,2]])
        self.assertEqual(pure, [(0,1)])
        self.assertEqual(len(table), 2)
        self.assertTrue(np.allclose(table['P(row action 0)'], 1))
        self.assertTrue(np.allclose(table['P(column action 0)'], 0))

    def test_tied_game_and_input_validation(self):
        _, pure, _ = self.ns['solve_matrix']([[0,0],[0,0]], [[0,0],[0,0]])
        self.assertEqual(len(pure),4)
        with self.assertRaises(ValueError):
            self.ns['solve_matrix']([[float('nan'),0],[0,0]], [[0,0],[0,0]])

    def test_matrix_widgets_pass_edited_payoffs(self):
        ns = self.ns
        with contextlib.redirect_stdout(io.StringIO()):
            for cell in self.notebook['cells']:
                if 'widgets' in cell['metadata'].get('tags', []):
                    exec(cell['source'],ns)
        ns['preset'].value = 'Matching pennies'
        self.assertEqual([box.value for box in ns['boxes_A']], [1,-1,-1,1])
        seen = []
        original = ns['explore_matrix']
        ns['explore_matrix'] = lambda A,B: seen.append((A.copy(), B.copy()))
        try:
            ns['boxes_A'][0].value = 9
            with contextlib.redirect_stdout(io.StringIO()):
                ns['solve_button'].click()
        finally:
            ns['explore_matrix'] = original
        self.assertEqual(len(seen),1)
        self.assertEqual(seen[0][0][0,0],9)
        self.assertTrue(np.array_equal(seen[0][1],[[-1,1],[1,-1]]))


class TreeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.notebook, cls.ns = load_notebook('notebooks/gambit_pygambit/02_Gambit_PyGambit_Interactive.ipynb')

    def test_entry_nash_and_spne(self):
        game = self.ns['make_entry']()
        plans = {(p['Entrant'],p['Incumbent after In']) for p in self.ns['entry_pure_nash'](game)}
        self.assertEqual(plans, {('Out','Fight'),('In','Accommodate')})
        self.assertEqual(self.ns['backward_induction'](), [{'Entrant':'In','Incumbent after In':'Accommodate'}])
        self.assertEqual(self.ns['backward_induction'](2,1,1), [{'Entrant':'Out','Incumbent after In':'Fight'}])

    def test_backward_induction_preserves_ties(self):
        self.assertEqual(len(self.ns['backward_induction'](1,1,1)),2)
        self.assertEqual(len(self.ns['backward_induction'](-1,1,0)),2)

    def test_bayesian_information_sets(self):
        game = self.ns['make_bayesian']()
        info = {i.label:i for i in game.infosets}
        self.assertEqual(len(list(info['Firm 1'].members)),2)
        self.assertEqual(len(list(info['Firm 2: low'].members)),2)
        self.assertEqual(len(list(info['Firm 2: high'].members)),2)
        # Firm 1 nodes have different Nature branches; each Firm 2 set spans both rival actions.
        self.assertEqual({n.prior_action.label for n in info['Firm 1'].members}, {'Low cost','High cost'})
        self.assertEqual({n.prior_action.label for n in info['Firm 2: low'].members},{'Enter','Out'})
        self.assertTrue(game.is_perfect_recall)

    def test_bayesian_baseline_and_prior_change(self):
        for prior, expected in [(.5,2),(.8,1.4)]:
            rows = self.ns['bayesian_pure_nash'](self.ns['make_bayesian'](prior))
            self.assertEqual(len(rows),1)
            row=rows[0]
            self.assertEqual((row['Firm 1'],row['Firm 2: low'],row['Firm 2: high']),('Enter','Enter','Out'))
            self.assertAlmostEqual(row['Firm 1 expected payoff'],expected)
            self.assertAlmostEqual(row['Firm 2 expected payoff'],prior)

    def test_bayesian_parameters_against_conditional_incentives(self):
        for prior in [.1,.5,.9]:
            for high_cost in [2,3,5]:
                for cost1 in [1,2,3]:
                    rows=self.ns['bayesian_pure_nash'](self.ns['make_bayesian'](prior,high_cost,cost1))
                    plans={(r['Firm 1'],r['Firm 2: low'],r['Firm 2: high']) for r in rows}
                    direct=set(self.ns['bayesian_deviation_check'](prior,high_cost,cost1))
                    self.assertEqual(plans,direct)

    def test_export_import_round_trip(self):
        for name in ['entry_baseline.efg','bayesian_baseline.efg']:
            game=gb.read_efg(ROOT/'examples'/name)
            self.assertEqual(len(gb.nash.enumpure_solve(game).equilibria),2 if name.startswith('entry') else 1)
        matrix=gb.read_nfg(ROOT/'examples/prisoners_dilemma.nfg')
        self.assertEqual(len(gb.nash.enumpure_solve(matrix).equilibria),1)

    def test_tree_widgets_pass_edited_parameters(self):
        ns=self.ns
        with contextlib.redirect_stdout(io.StringIO()):
            for cell in self.notebook['cells']:
                if 'widgets' in cell['metadata'].get('tags',[]):
                    exec(cell['source'],ns)
        seen=[]
        entry_original,bayes_original=ns['explore_entry'],ns['explore_bayesian']
        ns['explore_entry']=lambda *args: seen.append(('entry',args))
        ns['explore_bayesian']=lambda *args: seen.append(('bayes',args))
        try:
            ns['fight_slider'].value=2
            ns['prior_slider'].value=.8
            ns['high_cost_slider'].value=4
            with contextlib.redirect_stdout(io.StringIO()):
                ns['entry_button'].click();ns['bayes_button'].click()
        finally:
            ns['explore_entry'],ns['explore_bayesian']=entry_original,bayes_original
        self.assertEqual(seen,[('entry',(2,1,1)),('bayes',(.8,4,1))])


if __name__=='__main__':
    unittest.main()
