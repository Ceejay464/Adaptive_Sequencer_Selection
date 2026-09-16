export const MIN_PLAYERS = 2;
export const MIN_STRATEGIES = 2;

function normalizedPlayers(players = []) {
  return players.map((player, index) => ({
    name: String(player?.name || `Player ${index + 1}`).trim(),
    strategies: Array.isArray(player?.strategies)
      ? player.strategies.map(String).map((value) => value.trim()).filter(Boolean)
      : [],
  }));
}

export function classifyGame({ players = [], sequential = false, observedMoves = false, privateInformation = false } = {}) {
  const cleanPlayers = normalizedPlayers(players);
  const problems = [];
  if (cleanPlayers.length < MIN_PLAYERS) problems.push('Name at least two players.');
  cleanPlayers.forEach((player) => {
    if (player.strategies.length < MIN_STRATEGIES) {
      problems.push(`${player.name || 'Each player'} needs at least two feasible strategies.`);
    }
  });
  if (sequential && !observedMoves && !privateInformation) {
    problems.push('Clarify what later movers observe; a drawn tree alone does not establish perfect information.');
  }
  if (problems.length) return { valid: false, problems };

  if (privateInformation) {
    return {
      valid: true,
      lens: 'Harsanyi',
      concept: sequential && observedMoves ? 'Bayesian game; then test a sequential refinement' : 'Bayesian Nash equilibrium',
      representation: 'Players, types, common prior, type-contingent strategies, payoffs, and information sets',
      check: 'State whose type is private, what each player knows, and test every type’s incentive constraints.',
      caution: sequential && observedMoves
        ? 'Private information is the first modeling fork. Dynamic Bayesian games may require perfect Bayesian or sequential equilibrium beyond this introductory triage.'
        : 'Harsanyi’s type-space transformation makes uncertainty explicit; it does not remove the need to justify the prior.',
    };
  }
  if (sequential && observedMoves) {
    return {
      valid: true,
      lens: 'Selten',
      concept: 'Subgame-perfect Nash equilibrium',
      representation: 'An extensive-form tree with decision nodes, observed histories, actions, and terminal payoffs',
      check: 'Solve every proper subgame and eliminate strategies supported by non-credible off-path threats.',
      caution: 'Selten refines Nash for dynamic games; first identify the Nash strategies, then test sequential credibility.',
    };
  }
  return {
    valid: true,
    lens: 'Nash',
    concept: 'Nash equilibrium',
    representation: 'A normal-form table listing players, strategy sets, and payoffs for every strategy profile',
    check: 'At the proposed profile, verify that no player can gain by changing strategy alone.',
    caution: 'Nash is the baseline for mutual best responses; timing, observation, or private information may require a refinement.',
  };
}

function validateMatrix(matrix, label) {
  if (!Array.isArray(matrix) || matrix.length !== 2 || matrix.some((row) => !Array.isArray(row) || row.length !== 2)) {
    throw new TypeError(`${label} must be a 2×2 array.`);
  }
  matrix.flat().forEach((value) => {
    if (!Number.isFinite(Number(value))) throw new TypeError(`${label} contains a non-numeric payoff.`);
  });
}

export function analyzePureNash(rowPayoffs, columnPayoffs) {
  validateMatrix(rowPayoffs, 'Row payoffs');
  validateMatrix(columnPayoffs, 'Column payoffs');
  const rowBestCells = [];
  const columnBestCells = [];
  for (let column = 0; column < 2; column += 1) {
    const best = Math.max(Number(rowPayoffs[0][column]), Number(rowPayoffs[1][column]));
    for (let row = 0; row < 2; row += 1) {
      if (Number(rowPayoffs[row][column]) === best) rowBestCells.push([row, column]);
    }
  }
  for (let row = 0; row < 2; row += 1) {
    const best = Math.max(Number(columnPayoffs[row][0]), Number(columnPayoffs[row][1]));
    for (let column = 0; column < 2; column += 1) {
      if (Number(columnPayoffs[row][column]) === best) columnBestCells.push([row, column]);
    }
  }
  const key = ([row, column]) => `${row}${column}`;
  const columnBestKeys = new Set(columnBestCells.map(key));
  return {
    rowBestCells,
    columnBestCells,
    equilibria: rowBestCells.filter((cell) => columnBestKeys.has(key(cell))),
  };
}

export function findPureNash(rowPayoffs, columnPayoffs) {
  return analyzePureNash(rowPayoffs, columnPayoffs).equilibria;
}

function payoffPair(value, label) {
  if (!Array.isArray(value) || value.length !== 2 || value.some((payoff) => !Number.isFinite(Number(payoff)))) {
    throw new TypeError(`${label} must contain two numeric payoffs.`);
  }
  return value.map(Number);
}

function maximizingLabels(entries) {
  const maximum = Math.max(...entries.map(([, payoff]) => Number(payoff)));
  return entries.filter(([, payoff]) => Number(payoff) === maximum).map(([label]) => label);
}

export function solveSequentialEntry({ out = [1, 2], fight = [-1, -1], accommodate = [2, 1] } = {}) {
  const terminals = {
    'Stay out': payoffPair(out, 'Stay-out outcome'),
    Fight: payoffPair(fight, 'Fight outcome'),
    Accommodate: payoffPair(accommodate, 'Accommodation outcome'),
  };
  const incumbentBestActions = maximizingLabels([
    ['Fight', terminals.Fight[1]],
    ['Accommodate', terminals.Accommodate[1]],
  ]);
  const profiles = incumbentBestActions.flatMap((incumbent) => {
    const continuation = terminals[incumbent];
    const entrantBestActions = maximizingLabels([
      ['Stay out', terminals['Stay out'][0]],
      ['Enter', continuation[0]],
    ]);
    return entrantBestActions.map((entrant) => ({
      entrant,
      incumbent,
      outcome: entrant === 'Stay out' ? 'Stay out' : incumbent,
      payoffs: entrant === 'Stay out' ? terminals['Stay out'] : continuation,
    }));
  });
  return { terminals, incumbentBestActions, profiles };
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be numeric.`);
  return number;
}

export function solveBayesianEntry({
  probabilityTough = 0.4,
  entrantOut = 0,
  entrantIfFight = -1,
  entrantIfAccommodate = 2,
  toughFight = 2,
  toughAccommodate = 0,
  weakFight = -2,
  weakAccommodate = 1,
} = {}) {
  const probability = finiteNumber(probabilityTough, 'Tough-type probability');
  if (probability < 0 || probability > 1) throw new RangeError('Tough-type probability must be between 0 and 1.');
  const outside = finiteNumber(entrantOut, 'Stay-out payoff');
  const entrantPayoffs = {
    Fight: finiteNumber(entrantIfFight, 'Entrant payoff after Fight'),
    Accommodate: finiteNumber(entrantIfAccommodate, 'Entrant payoff after Accommodate'),
  };
  const typeBestActions = {
    Tough: maximizingLabels([
      ['Fight', finiteNumber(toughFight, 'Tough payoff from Fight')],
      ['Accommodate', finiteNumber(toughAccommodate, 'Tough payoff from Accommodate')],
    ]),
    Weak: maximizingLabels([
      ['Fight', finiteNumber(weakFight, 'Weak payoff from Fight')],
      ['Accommodate', finiteNumber(weakAccommodate, 'Weak payoff from Accommodate')],
    ]),
  };
  const expectedEntryPayoffs = typeBestActions.Tough.flatMap((toughAction) =>
    typeBestActions.Weak.map((weakAction) => (
      probability * entrantPayoffs[toughAction]
      + (1 - probability) * entrantPayoffs[weakAction]
    )));
  const minimum = Math.min(...expectedEntryPayoffs);
  const maximum = Math.max(...expectedEntryPayoffs);
  let entrantRecommendation = 'Depends on how an indifferent type acts';
  if (minimum > outside) entrantRecommendation = 'Enter';
  else if (maximum < outside) entrantRecommendation = 'Stay out';
  else if (minimum === maximum && minimum === outside) entrantRecommendation = 'Either Enter or Stay out';
  return {
    probabilityTough: probability,
    probabilityWeak: 1 - probability,
    typeBestActions,
    expectedEntryRange: [minimum, maximum],
    entrantOut: outside,
    entrantRecommendation,
  };
}

function sentenceList(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) || [];
}

export function validateAbstract(text) {
  const sentences = sentenceList(text);
  const second = sentences[1] || '';
  const startsWithPivot = /^(However|Yet)\b/i.test(second);
  const namesGap = /\b(gap|unknown|unclear|unresolved|underexplored|limited|limitation|fails?|lack|little|remains?|challenge|cannot|has not|have not)\b/i.test(second);
  return {
    sentences,
    hasSecondSentence: sentences.length >= 2,
    startsWithPivot,
    namesGap,
    passes: sentences.length >= 2 && startsWithPivot && namesGap,
  };
}

function preferenceRank(order = [], option) {
  const rank = order.indexOf(option);
  return rank === -1 ? Number.POSITIVE_INFINITY : rank;
}

function priorityRank(priorities, school, student) {
  return preferenceRank(priorities[school] || [], student);
}

function copyAssignment(students, schools) {
  return {
    byStudent: Object.fromEntries(students.map((student) => [student, null])),
    bySchool: Object.fromEntries(schools.map((school) => [school, []])),
  };
}

function snapshot(round, label, assignment, applications = {}) {
  return {
    round,
    label,
    applications: Object.fromEntries(Object.entries(applications).map(([school, applicants]) => [school, [...applicants]])),
    byStudent: { ...assignment.byStudent },
    bySchool: Object.fromEntries(Object.entries(assignment.bySchool).map(([school, students]) => [school, [...students]])),
  };
}

export function runBoston({ students, schools, capacities, preferences, priorities }) {
  const assignment = copyAssignment(students, schools);
  const history = [snapshot(0, 'Start: all students are unmatched.', assignment)];
  const maxRounds = Math.max(0, ...students.map((student) => (preferences[student] || []).length));

  for (let round = 0; round < maxRounds; round += 1) {
    const applications = Object.fromEntries(schools.map((school) => [school, []]));
    students.filter((student) => !assignment.byStudent[student]).forEach((student) => {
      const school = (preferences[student] || [])[round];
      if (school && applications[school]) applications[school].push(student);
    });
    schools.forEach((school) => {
      const vacancies = Number(capacities[school]) - assignment.bySchool[school].length;
      const accepted = applications[school]
        .sort((a, b) => priorityRank(priorities, school, a) - priorityRank(priorities, school, b))
        .slice(0, Math.max(0, vacancies));
      accepted.forEach((student) => {
        assignment.byStudent[student] = school;
        assignment.bySchool[school].push(student);
      });
    });
    history.push(snapshot(round + 1, `Round ${round + 1}: acceptances are final.`, assignment, applications));
  }
  return { ...assignment, history };
}

export function runDeferredAcceptance({ students, schools, capacities, preferences, priorities }) {
  const assignment = copyAssignment(students, schools);
  const nextChoice = Object.fromEntries(students.map((student) => [student, 0]));
  const history = [snapshot(0, 'Start: schools hold no applications.', assignment)];
  let round = 0;
  while (students.some((student) => !assignment.byStudent[student] && nextChoice[student] < (preferences[student] || []).length)) {
    round += 1;
    const applications = Object.fromEntries(schools.map((school) => [school, []]));
    students.filter((student) => !assignment.byStudent[student]).forEach((student) => {
      const school = (preferences[student] || [])[nextChoice[student]];
      nextChoice[student] += 1;
      if (school && applications[school]) applications[school].push(student);
    });
    schools.forEach((school) => {
      const pool = [...assignment.bySchool[school], ...applications[school]];
      const held = pool
        .sort((a, b) => priorityRank(priorities, school, a) - priorityRank(priorities, school, b))
        .slice(0, Number(capacities[school]));
      pool.forEach((student) => { assignment.byStudent[student] = held.includes(student) ? school : null; });
      assignment.bySchool[school] = held;
    });
    history.push(snapshot(round, `Round ${round}: schools tentatively hold their highest-priority applicants.`, assignment, applications));
    if (round > students.length * schools.length) throw new Error('Deferred acceptance did not converge.');
  }
  history.push(snapshot(round + 1, 'No student can make another proposal; tentative holds become final.', assignment));
  return { ...assignment, history };
}

export function findBlockingPairs({ students, schools, capacities, preferences, priorities }, result) {
  const pairs = [];
  students.forEach((student) => {
    const current = result.byStudent[student];
    schools.forEach((school) => {
      if (school === current) return;
      const prefersSchool = current === null
        || preferenceRank(preferences[student], school) < preferenceRank(preferences[student], current);
      if (!prefersSchool) return;
      const assigned = result.bySchool[school] || [];
      const hasVacancy = assigned.length < Number(capacities[school]);
      const preferredToAssignee = assigned.some(
        (other) => priorityRank(priorities, school, student) < priorityRank(priorities, school, other),
      );
      if (hasVacancy || preferredToAssignee) pairs.push([student, school]);
    });
  });
  return pairs;
}

export function describeMatchingRound({ students, schools }, result, index, mechanism) {
  const step = result.history[index];
  if (!step) throw new RangeError('Matching round does not exist.');
  const status = Object.fromEntries(students.map((student) => [student, 'active']));
  if (index === 0) {
    return {
      proposals: ['No proposals yet.'],
      decisions: ['No school has made a decision.'],
      continuation: 'All students begin active.',
      status,
    };
  }

  const previous = result.history[index - 1];
  const applications = step.applications || {};
  const proposals = schools.flatMap((school) =>
    (applications[school] || []).map((student) => `${student} → ${school}`));
  const finalizing = mechanism === 'deferred' && index === result.history.length - 1 && !proposals.length;
  if (finalizing) {
    students.forEach((student) => { status[student] = 'final'; });
    return {
      proposals: ['No proposal remains.'],
      decisions: ['Every tentative hold becomes a final assignment.'],
      continuation: students.map((student) => `${student} → ${step.byStudent[student] || 'unmatched'}`).join('; '),
      status,
    };
  }

  const decisions = [];
  schools.forEach((school) => {
    const incoming = applications[school] || [];
    const pool = [...new Set([...(previous.bySchool[school] || []), ...incoming])];
    const selected = step.bySchool[school] || [];
    const accepted = mechanism === 'boston'
      ? selected.filter((student) => !(previous.bySchool[school] || []).includes(student))
      : selected;
    const rejected = pool.filter((student) => !selected.includes(student));
    if (incoming.length || (mechanism === 'deferred' && rejected.length)) {
      const action = mechanism === 'boston' ? 'FINAL accept' : 'tentatively hold';
      decisions.push(`${school}: ${action} ${accepted.join(', ') || 'no one'}; reject/release ${rejected.join(', ') || 'no one'}.`);
    }
    accepted.forEach((student) => { status[student] = mechanism === 'boston' ? 'final' : 'held'; });
    rejected.forEach((student) => { status[student] = 'rejected'; });
  });
  students.forEach((student) => {
    if (step.byStudent[student] && status[student] === 'active') status[student] = mechanism === 'boston' ? 'final' : 'held';
  });
  const assigned = students.filter((student) => step.byStudent[student]);
  const active = students.filter((student) => !step.byStudent[student]);
  const continuation = mechanism === 'boston'
    ? `Permanently assigned and out: ${assigned.join(', ') || 'none'}. Next round: ${active.join(', ') || 'none'}.`
    : `Held, not final: ${assigned.join(', ') || 'none'}. Rejected or displaced and proposing next: ${active.join(', ') || 'none'}.`;
  return { proposals: proposals.length ? proposals : ['No new proposal.'], decisions, continuation, status };
}

export const SCHOOL_CHOICE_SCENARIO = {
  students: ['Amina', 'Bo', 'Chen', 'Dara'],
  schools: ['Aurora', 'Beacon', 'Cedar'],
  capacities: { Aurora: 1, Beacon: 1, Cedar: 2 },
  preferences: {
    Amina: ['Beacon', 'Aurora', 'Cedar'],
    Bo: ['Beacon', 'Aurora', 'Cedar'],
    Chen: ['Aurora', 'Beacon', 'Cedar'],
    Dara: ['Aurora', 'Cedar', 'Beacon'],
  },
  priorities: {
    Aurora: ['Amina', 'Bo', 'Chen', 'Dara'],
    Beacon: ['Amina', 'Bo', 'Chen', 'Dara'],
    Cedar: ['Amina', 'Bo', 'Chen', 'Dara'],
  },
};
