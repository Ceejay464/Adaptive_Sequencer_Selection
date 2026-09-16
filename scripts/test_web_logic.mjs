import assert from 'node:assert/strict';
import {
  SCHOOL_CHOICE_SCENARIO,
  analyzePureNash,
  classifyGame,
  describeMatchingRound,
  findBlockingPairs,
  findPureNash,
  runBoston,
  runDeferredAcceptance,
  solveBayesianEntry,
  solveSequentialEntry,
  validateAbstract,
} from '../web/logic.js';

const invalid = classifyGame({ players: [{ name: 'One', strategies: ['Act'] }] });
assert.equal(invalid.valid, false);
assert.equal(invalid.problems.length, 2);

const players = [
  { name: 'Entrant', strategies: ['In', 'Out'] },
  { name: 'Incumbent', strategies: ['Fight', 'Accommodate'] },
];
assert.equal(classifyGame({ players }).lens, 'Nash');
assert.equal(classifyGame({ players, sequential: true, observedMoves: true }).lens, 'Selten');
assert.equal(classifyGame({ players, privateInformation: true }).lens, 'Harsanyi');

assert.deepEqual(findPureNash([[3, 0], [5, 1]], [[3, 5], [0, 1]]), [[1, 1]]);
assert.deepEqual(findPureNash([[1, -1], [-1, 1]], [[-1, 1], [1, -1]]), []);
assert.deepEqual(analyzePureNash([[3, 0], [5, 1]], [[3, 5], [0, 1]]), {
  rowBestCells: [[1, 0], [1, 1]],
  columnBestCells: [[0, 1], [1, 1]],
  equilibria: [[1, 1]],
});

const sequential = solveSequentialEntry();
assert.deepEqual(sequential.incumbentBestActions, ['Accommodate']);
assert.deepEqual(sequential.profiles, [{ entrant: 'Enter', incumbent: 'Accommodate', outcome: 'Accommodate', payoffs: [2, 1] }]);
const deterred = solveSequentialEntry({ out: [1, 2], fight: [-1, 3], accommodate: [2, 1] });
assert.equal(deterred.profiles[0].entrant, 'Stay out');
assert.equal(deterred.profiles[0].incumbent, 'Fight');

const bayesian = solveBayesianEntry();
assert.deepEqual(bayesian.typeBestActions, { Tough: ['Fight'], Weak: ['Accommodate'] });
assert.ok(Math.abs(bayesian.expectedEntryRange[0] - 0.8) < 1e-9);
assert.equal(bayesian.entrantRecommendation, 'Enter');
assert.equal(solveBayesianEntry({ probabilityTough: 0.8 }).entrantRecommendation, 'Stay out');

assert.equal(validateAbstract('Institutions allocate scarce goods. However, existing work leaves the behavioral gap unresolved. We test a mechanism.').passes, true);
assert.equal(validateAbstract('Institutions allocate scarce goods. We build a mechanism.').passes, false);

const boston = runBoston(SCHOOL_CHOICE_SCENARIO);
const deferred = runDeferredAcceptance(SCHOOL_CHOICE_SCENARIO);
assert.equal(boston.byStudent.Bo, 'Cedar');
assert.equal(deferred.byStudent.Bo, 'Aurora');
assert.deepEqual(findBlockingPairs(SCHOOL_CHOICE_SCENARIO, boston), [['Bo', 'Aurora']]);
assert.deepEqual(findBlockingPairs(SCHOOL_CHOICE_SCENARIO, deferred), []);
const bostonRoundOne = describeMatchingRound(SCHOOL_CHOICE_SCENARIO, boston, 1, 'boston');
assert.deepEqual(bostonRoundOne.proposals, ['Chen → Aurora', 'Dara → Aurora', 'Amina → Beacon', 'Bo → Beacon']);
assert.match(bostonRoundOne.decisions.join(' '), /FINAL accept Amina/);
assert.match(bostonRoundOne.continuation, /Permanently assigned and out: Amina, Chen/);
const deferredRoundTwo = describeMatchingRound(SCHOOL_CHOICE_SCENARIO, deferred, 2, 'deferred');
assert.match(deferredRoundTwo.decisions.join(' '), /tentatively hold Bo; reject\/release Chen/);
assert.match(deferredRoundTwo.continuation, /Rejected or displaced and proposing next: Chen/);

console.log('Web logic checks passed: triage, Nash, Selten, Harsanyi, abstract gap, matching paths, round narration, and stability.');
