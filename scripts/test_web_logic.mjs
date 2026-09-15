import assert from 'node:assert/strict';
import {
  SCHOOL_CHOICE_SCENARIO,
  classifyGame,
  findBlockingPairs,
  findPureNash,
  runBoston,
  runDeferredAcceptance,
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

assert.equal(validateAbstract('Institutions allocate scarce goods. However, existing work leaves the behavioral gap unresolved. We test a mechanism.').passes, true);
assert.equal(validateAbstract('Institutions allocate scarce goods. We build a mechanism.').passes, false);

const boston = runBoston(SCHOOL_CHOICE_SCENARIO);
const deferred = runDeferredAcceptance(SCHOOL_CHOICE_SCENARIO);
assert.equal(boston.byStudent.Bo, 'Cedar');
assert.equal(deferred.byStudent.Bo, 'Aurora');
assert.deepEqual(findBlockingPairs(SCHOOL_CHOICE_SCENARIO, boston), [['Bo', 'Aurora']]);
assert.deepEqual(findBlockingPairs(SCHOOL_CHOICE_SCENARIO, deferred), []);

console.log('Web logic checks passed: triage, Nash, abstract gap, Boston, deferred acceptance, and stability.');
