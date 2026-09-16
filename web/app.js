import {
  SCHOOL_CHOICE_SCENARIO,
  analyzePureNash,
  classifyGame,
  describeMatchingRound,
  findBlockingPairs,
  runBoston,
  runDeferredAcceptance,
  solveBayesianEntry,
  solveSequentialEntry,
  validateAbstract,
} from './logic.js';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

function strategiesFrom(selector) {
  return $(selector).value.split(',').map((value) => value.trim()).filter(Boolean);
}

function gameInput() {
  return {
    players: [
      { name: $('#p1-name').value, strategies: strategiesFrom('#p1-strategies') },
      { name: $('#p2-name').value, strategies: strategiesFrom('#p2-strategies') },
    ],
    sequential: $('#sequential').checked,
    observedMoves: $('#observed').checked,
    privateInformation: $('#private-info').checked,
  };
}

function renderDiagnosis() {
  const result = classifyGame(gameInput());
  if (!result.valid) {
    $('#diagnosis').innerHTML = `<div class="diagnosis-card error"><b>Structure gate not yet passed</b><ul>${result.problems.map((problem) => `<li>${escapeHtml(problem)}</li>`).join('')}</ul></div>`;
    return;
  }
  $('#diagnosis').innerHTML = `
    <div class="diagnosis-card">
      <b>${escapeHtml(result.lens)} lens</b>
      <p><strong>Start with:</strong> ${escapeHtml(result.concept)}.</p>
      <p><strong>Show:</strong> ${escapeHtml(result.representation)}.</p>
      <p><strong>Falsify:</strong> ${escapeHtml(result.check)}</p>
      <p><strong>Boundary:</strong> ${escapeHtml(result.caution)}</p>
    </div>`;
  activateSolutionLens(result.lens.toLowerCase(), false);
}

$('#game-form').addEventListener('submit', (event) => {
  event.preventDefault();
  renderDiagnosis();
});
['#sequential', '#observed', '#private-info'].forEach((selector) => {
  $(selector).addEventListener('change', () => {
    if (selector === '#sequential' && !$('#sequential').checked) $('#observed').checked = false;
    renderDiagnosis();
  });
});

function matrixFromInputs(owner) {
  const value = (cell) => Number($(`[data-matrix="${owner}"][data-cell="${cell}"]`).value);
  return [[value('00'), value('01')], [value('10'), value('11')]];
}

const solutionTabs = $$('.solution-tabs [role="tab"]');
let solutionTimers = [];

function clearSolutionTimers() {
  solutionTimers.forEach((timer) => window.clearTimeout(timer));
  solutionTimers = [];
}

function runSolutionSteps(steps) {
  clearSolutionTimers();
  const instant = reducedMotion || document.body.classList.contains('motion-paused');
  steps.forEach((step, index) => {
    if (instant || index === 0) step();
    else solutionTimers.push(window.setTimeout(step, index * 650));
  });
}

function activateSolutionLens(name, focusTab = true) {
  const activeTab = solutionTabs.find((button) => button.dataset.solution === name);
  if (!activeTab) return;
  solutionTabs.forEach((button) => {
    const selected = button === activeTab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $$('.solution-panel').forEach((panel) => {
    const selected = panel.id === `solution-${name}`;
    panel.hidden = !selected;
    panel.classList.toggle('panel-enter', selected);
  });
  clearSolutionTimers();
  if (focusTab) activeTab.focus();
}

solutionTabs.forEach((button, index) => {
  button.addEventListener('click', () => activateSolutionLens(button.dataset.solution, false));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const shift = event.key === 'ArrowRight' ? 1 : -1;
    const next = solutionTabs[(index + shift + solutionTabs.length) % solutionTabs.length];
    activateSolutionLens(next.dataset.solution);
  });
});

function resetNashTrace() {
  $$('[data-payoff-cell]').forEach((cell) => cell.classList.remove('row-best', 'column-best', 'equilibrium-cell'));
  $$('#nash-steps span').forEach((step) => step.classList.remove('active', 'complete'));
}

function updateNash() {
  try {
    const analysis = analyzePureNash(matrixFromInputs('row'), matrixFromInputs('column'));
    const rowNames = ['Cooperate', 'Defect'];
    const columnNames = ['Cooperate', 'Defect'];
    $('#nash-result').textContent = analysis.equilibria.length
      ? `Pure Nash: ${analysis.equilibria.map(([row, column]) => `(${rowNames[row]}, ${columnNames[column]})`).join('; ')}`
      : 'No pure Nash equilibrium; inspect mixed strategies.';
    $('#nash-result').classList.remove('result-updated');
    requestAnimationFrame(() => $('#nash-result').classList.add('result-updated'));
    return analysis;
  } catch (error) {
    $('#nash-result').textContent = error.message;
    return null;
  }
}

function traceNash() {
  resetNashTrace();
  const analysis = updateNash();
  if (!analysis) return;
  const selectCells = (cells, className) => cells.forEach(([row, column]) => {
    $(`[data-payoff-cell="${row}${column}"]`).classList.add(className);
  });
  const step = (name) => $(`[data-nash-step="${name}"]`);
  runSolutionSteps([
    () => { step('row').classList.add('active'); selectCells(analysis.rowBestCells, 'row-best'); },
    () => { step('row').classList.replace('active', 'complete'); step('column').classList.add('active'); selectCells(analysis.columnBestCells, 'column-best'); },
    () => { step('column').classList.replace('active', 'complete'); step('equilibrium').classList.add('active', 'complete'); selectCells(analysis.equilibria, 'equilibrium-cell'); },
  ]);
}

$('#trace-nash').addEventListener('click', traceNash);
$$('[data-matrix]').forEach((input) => input.addEventListener('input', () => {
  clearSolutionTimers();
  resetNashTrace();
  updateNash();
}));

const numberFrom = (selector) => Number($(selector).value);
const payoffText = ([first, second]) => `(${first}, ${second})`;

function sequentialInput() {
  const value = (name) => Number($(`[data-selten="${name}"]`).value);
  return {
    out: [value('out-entrant'), value('out-incumbent')],
    fight: [value('fight-entrant'), value('fight-incumbent')],
    accommodate: [value('accommodate-entrant'), value('accommodate-incumbent')],
  };
}

function resetSeltenVisual() {
  $$('.entry-tree .tree-edge, .entry-tree .tree-node, .entry-tree .terminal').forEach((element) => element.classList.remove('active', 'candidate', 'chosen', 'dimmed'));
}

function describeSequentialSolution(result) {
  return `SPNE: ${result.profiles.map((profile) => `Entrant ${profile.entrant}; Incumbent ${profile.incumbent} after entry → ${profile.outcome} ${payoffText(profile.payoffs)}`).join(' | ')}`;
}

function markSequentialSolution(result) {
  const entrantActions = new Set(result.profiles.map((profile) => profile.entrant));
  result.incumbentBestActions.forEach((action) => $(`[data-tree-edge="${action.toLowerCase()}"]`).classList.add('chosen'));
  if (entrantActions.has('Stay out')) {
    $('[data-tree-edge="out"]').classList.add('chosen');
    $('[data-terminal="out"]').classList.add('chosen');
  }
  if (entrantActions.has('Enter')) {
    $('[data-tree-edge="enter"]').classList.add('chosen');
    result.profiles.filter((profile) => profile.entrant === 'Enter').forEach((profile) => {
      $(`[data-terminal="${profile.outcome.toLowerCase()}"]`).classList.add('chosen');
    });
  }
}

function solveSelten(animate = true) {
  try {
    const result = solveSequentialEntry(sequentialInput());
    $('#selten-payoff-out').textContent = payoffText(result.terminals['Stay out']);
    $('#selten-payoff-fight').textContent = payoffText(result.terminals.Fight);
    $('#selten-payoff-accommodate').textContent = payoffText(result.terminals.Accommodate);
    resetSeltenVisual();
    if (!animate) {
      markSequentialSolution(result);
      $('#selten-result').textContent = describeSequentialSolution(result);
      return result;
    }
    runSolutionSteps([
      () => {
        $('[data-tree-node="incumbent"]').classList.add('active');
        result.incumbentBestActions.forEach((action) => $(`[data-tree-edge="${action.toLowerCase()}"]`).classList.add('candidate'));
        $('#selten-result').textContent = `Step 1: after entry, the incumbent compares ${result.terminals.Fight[1]} with ${result.terminals.Accommodate[1]}.`;
      },
      () => {
        $('[data-tree-node="entrant"]').classList.add('active');
        markSequentialSolution(result);
        $('#selten-result').textContent = 'Step 2: the entrant anticipates that credible continuation and compares it with staying out.';
      },
      () => { $('#selten-result').textContent = describeSequentialSolution(result); },
    ]);
    return result;
  } catch (error) {
    $('#selten-result').textContent = error.message;
    return null;
  }
}

$('#solve-selten').addEventListener('click', () => solveSelten(true));
$$('[data-selten]').forEach((input) => input.addEventListener('input', () => {
  clearSolutionTimers();
  solveSelten(false);
}));

function bayesianInput() {
  return {
    probabilityTough: numberFrom('#harsanyi-prior') / 100,
    entrantOut: numberFrom('#bayes-out'),
    entrantIfFight: numberFrom('#bayes-entry-fight'),
    entrantIfAccommodate: numberFrom('#bayes-entry-accommodate'),
    toughFight: numberFrom('#bayes-tough-fight'),
    toughAccommodate: numberFrom('#bayes-tough-accommodate'),
    weakFight: numberFrom('#bayes-weak-fight'),
    weakAccommodate: numberFrom('#bayes-weak-accommodate'),
  };
}

function resetHarsanyiVisual() {
  $$('.type-tree .nature-node, .type-tree .type-card, .type-tree .type-edge, .type-tree .entrant-decision').forEach((element) => element.classList.remove('active', 'chosen'));
}

function expectedText([minimum, maximum]) {
  return Math.abs(maximum - minimum) < 1e-9 ? minimum.toFixed(2) : `[${minimum.toFixed(2)}, ${maximum.toFixed(2)}]`;
}

function describeBayesianSolution(result) {
  return `Type strategy: Tough → ${result.typeBestActions.Tough.join(' or ')}; Weak → ${result.typeBestActions.Weak.join(' or ')}. Expected entry payoff = ${expectedText(result.expectedEntryRange)} versus stay out = ${result.entrantOut.toFixed(2)}. Entrant: ${result.entrantRecommendation}.`;
}

function writeBayesianLabels(result) {
  $('#harsanyi-prior-output').textContent = result.probabilityTough.toFixed(2);
  $('#harsanyi-tough-prob').textContent = `p = ${result.probabilityTough.toFixed(2)}`;
  $('#harsanyi-weak-prob').textContent = `1 − p = ${result.probabilityWeak.toFixed(2)}`;
  $('#harsanyi-tough-action').textContent = `Action: ${result.typeBestActions.Tough.join(' or ')}`;
  $('#harsanyi-weak-action').textContent = `Action: ${result.typeBestActions.Weak.join(' or ')}`;
  $('#harsanyi-entrant-action').textContent = `Entrant: ${result.entrantRecommendation}`;
}

function markBayesianSolution(result) {
  writeBayesianLabels(result);
  $$('[data-type-edge], .type-card').forEach((element) => element.classList.add('chosen'));
  $('[data-type-node="entrant"]').classList.add('chosen');
}

function solveHarsanyi(animate = true) {
  try {
    const result = solveBayesianEntry(bayesianInput());
    resetHarsanyiVisual();
    $('#harsanyi-prior-output').textContent = result.probabilityTough.toFixed(2);
    $('#harsanyi-tough-prob').textContent = `p = ${result.probabilityTough.toFixed(2)}`;
    $('#harsanyi-weak-prob').textContent = `1 − p = ${result.probabilityWeak.toFixed(2)}`;
    if (!animate) {
      markBayesianSolution(result);
      $('#harsanyi-result').textContent = describeBayesianSolution(result);
      return result;
    }
    runSolutionSteps([
      () => { $('[data-type-node="nature"]').classList.add('active'); $('#harsanyi-result').textContent = 'Step 1: Nature draws the incumbent’s private type using the common prior.'; },
      () => { $$('[data-type-edge], .type-card').forEach((element) => element.classList.add('chosen')); writeBayesianLabels(result); $('#harsanyi-result').textContent = 'Step 2: specify a best action for every possible type—not only the realized type.'; },
      () => { $('[data-type-node="entrant"]').classList.add('chosen'); $('#harsanyi-result').textContent = describeBayesianSolution(result); },
    ]);
    return result;
  } catch (error) {
    $('#harsanyi-result').textContent = error.message;
    return null;
  }
}

$('#solve-harsanyi').addEventListener('click', () => solveHarsanyi(true));
$('#sample-harsanyi').addEventListener('click', () => {
  const result = solveHarsanyi(false);
  if (!result) return;
  const type = Math.random() < result.probabilityTough ? 'Tough' : 'Weak';
  const token = $('#harsanyi-token');
  token.classList.remove('to-tough', 'to-weak');
  void token.getBoundingClientRect();
  token.classList.add(`to-${type.toLowerCase()}`);
  $('#harsanyi-sample').textContent = `Nature drew ${type}; this type chooses ${result.typeBestActions[type].join(' or ')}. The strategy still had to specify both types.`;
});
$('#harsanyi-prior').addEventListener('input', () => solveHarsanyi(false));
$$('.bayes-controls input').forEach((input) => input.addEventListener('input', () => solveHarsanyi(false)));

function checkAbstract() {
  const result = validateAbstract($('#abstract-input').value);
  const missing = [];
  if (!result.hasSecondSentence) missing.push('Add a complete second sentence.');
  if (result.hasSecondSentence && !result.startsWithPivot) missing.push('Begin sentence two with “However” or “Yet.”');
  if (result.hasSecondSentence && !result.namesGap) missing.push('Name what is unknown, limited, unresolved, or underexplored.');
  $('#abstract-result').innerHTML = result.passes
    ? `<div class="diagnosis-card"><b>Gap pivot detected</b><p>Your second sentence begins with a contrast and identifies a limitation. Now verify that the cited literature actually supports this gap.</p></div>`
    : `<div class="diagnosis-card error"><b>Revise sentence two</b><ul>${missing.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
}
$('#check-abstract').addEventListener('click', checkAbstract);

let generatedPrompt = '';
$('#make-prompt').addEventListener('click', () => {
  const claim = $('#claim-input').value.trim() || '[insert provisional contribution]';
  const dimensions = $$('#dimension-checks input:checked').map((input) => input.value);
  generatedPrompt = `ROLE: Act as a skeptical literature-search assistant, not a novelty certifier.

PROVISIONAL CLAIM
${claim}

SEARCH TASK
Identify 8–12 plausibly close peer-reviewed papers across economics, computer science, and behavioral science. Search independently along these claimed dimensions: ${dimensions.join(', ') || '[select dimensions]'}.

FOR EACH CANDIDATE, RETURN
1. Full title, authors, venue, year, and DOI or stable publisher URL.
2. Which dimensions overlap, using only: research question; economic model; computational method; behavioral evidence; application setting; validation and boundaries.
3. A short paraphrase of the evidence supporting each overlap and the exact section/page to inspect.
4. A reason the candidate may falsify or narrow the provisional claim.
5. “UNVERIFIED” beside any metadata or content you cannot confirm.

DO NOT
- State that the project is novel.
- Invent citations, quotations, results, or page numbers.
- Treat different terminology as proof of a different contribution.

FINAL OUTPUT
Rank the three closest candidates and propose the narrowest contribution that might remain. End with a checklist requiring a human to open every source, verify metadata and evidence, record counterexamples, and revise or withdraw the claim.`;
  $('.prompt-output pre').textContent = generatedPrompt;
  $('.prompt-output').hidden = false;
});
$('#copy-prompt').addEventListener('click', async (event) => {
  try {
    await navigator.clipboard.writeText(generatedPrompt);
    event.currentTarget.textContent = 'Copied';
  } catch {
    event.currentTarget.textContent = 'Select text to copy';
  }
});

const tabButtons = $$('.persona-tabs [role="tab"]');
function activatePersona(name) {
  tabButtons.forEach((button) => {
    const selected = button.dataset.persona === name;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $$('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
}
tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => activatePersona(button.dataset.persona));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const shift = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabButtons[(index + shift + tabButtons.length) % tabButtons.length];
    activatePersona(next.dataset.persona);
    next.focus();
  });
});

function renderPreferenceTable() {
  $('#student-preferences').innerHTML = SCHOOL_CHOICE_SCENARIO.students.map((student) => `
    <div class="preference-row"><b>${escapeHtml(student)}</b><span>${SCHOOL_CHOICE_SCENARIO.preferences[student].map((school, index) => `${index + 1}. ${escapeHtml(school)}`).join(' · ')}</span></div>`).join('');
}

function createMatchingNodes() {
  $('#student-nodes').innerHTML = SCHOOL_CHOICE_SCENARIO.students.map((student) => `<div class="match-node" data-student="${escapeHtml(student)}">${escapeHtml(student)}<small>student</small></div>`).join('');
  $('#school-nodes').innerHTML = SCHOOL_CHOICE_SCENARIO.schools.map((school) => `<div class="match-node school" data-school="${escapeHtml(school)}">${escapeHtml(school)}<small>capacity ${SCHOOL_CHOICE_SCENARIO.capacities[school]}</small></div>`).join('');
}

const runs = {
  boston: runBoston(SCHOOL_CHOICE_SCENARIO),
  deferred: runDeferredAcceptance(SCHOOL_CHOICE_SCENARIO),
};
let mechanism = 'boston';
let historyIndex = 1;
let playTimer = null;

function nodeCenter(node, canvas) {
  const rect = node.getBoundingClientRect();
  const origin = canvas.getBoundingClientRect();
  return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top + rect.height / 2 };
}

function linkPath(student, school, className) {
  const canvas = $('#matching-canvas');
  const from = nodeCenter($(`[data-student="${student}"]`), canvas);
  const to = nodeCenter($(`[data-school="${school}"]`), canvas);
  const midpoint = (from.x + to.x) / 2;
  return `<path pathLength="1" class="match-line ${className}" d="M ${from.x} ${from.y} C ${midpoint} ${from.y}, ${midpoint} ${to.y}, ${to.x} ${to.y}"/>`;
}

function drawMatchingLines(step) {
  const svg = $('#matching-lines');
  const canvas = $('#matching-canvas');
  const rect = canvas.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  const applicationLines = Object.entries(step.applications || {}).flatMap(([school, students]) => students.map((student) => linkPath(student, school, 'application')));
  const assignmentLines = Object.entries(step.byStudent).filter(([, school]) => school).map(([student, school]) => linkPath(student, school, 'assignment'));
  svg.innerHTML = [...applicationLines, ...assignmentLines].join('');
}

function renderHistoryStep() {
  const run = runs[mechanism];
  const step = run.history[historyIndex];
  const story = describeMatchingRound(SCHOOL_CHOICE_SCENARIO, run, historyIndex, mechanism);
  $('#round-counter').textContent = `ROUND ${step.round}`;
  $('#round-title').textContent = step.label;
  $('#round-applications').innerHTML = `
    <div class="round-flow">
      <section><span>1 · PROPOSE →</span><p>${story.proposals.map(escapeHtml).join('<br>')}</p></section>
      <section><span>2 · SCHOOL DECIDES →</span><p>${story.decisions.map(escapeHtml).join('<br>')}</p></section>
      <section><span>3 · CONTINUE ↺</span><p>${escapeHtml(story.continuation)}</p></section>
    </div>`;
  SCHOOL_CHOICE_SCENARIO.students.forEach((student) => {
    const node = $(`[data-student="${student}"]`);
    node.dataset.status = story.status[student];
    node.classList.remove('status-updated');
    requestAnimationFrame(() => node.classList.add('status-updated'));
    $('small', node).textContent = story.status[student];
  });
  const final = historyIndex === run.history.length - 1;
  $('#next-round').disabled = final;
  $('#next-round').textContent = final ? 'Final allocation' : 'Next round →';
  if (final) stopPlayback();
  if (final) {
    const blocks = findBlockingPairs(SCHOOL_CHOICE_SCENARIO, run);
    $('#stability-result').innerHTML = blocks.length
      ? `<div class="stability unstable"><strong>Not stable in this example.</strong><br>Blocking pair: ${blocks.map(([student, school]) => `${escapeHtml(student)} + ${escapeHtml(school)}`).join(', ')}.</div>`
      : '<div class="stability"><strong>Stable in this example.</strong><br>No blocking pair was found.</div>';
  } else {
    $('#stability-result').innerHTML = '<p class="micro-note">Advance to the final state to run the blocking-pair check.</p>';
  }
  requestAnimationFrame(() => drawMatchingLines(step));
}

$('#next-round').addEventListener('click', () => {
  historyIndex = Math.min(historyIndex + 1, runs[mechanism].history.length - 1);
  renderHistoryStep();
});
$('#reset-match').addEventListener('click', () => { stopPlayback(); historyIndex = 0; renderHistoryStep(); });
$('#mechanism-select').addEventListener('change', (event) => {
  stopPlayback();
  mechanism = event.target.value;
  historyIndex = 1;
  renderHistoryStep();
});
window.addEventListener('resize', () => renderHistoryStep());

function stopPlayback() {
  window.clearInterval(playTimer);
  playTimer = null;
  $('#play-rounds').textContent = '▶ Play rounds';
  $('#play-rounds').setAttribute('aria-pressed', 'false');
}

$('#play-rounds').addEventListener('click', () => {
  if (playTimer) return stopPlayback();
  if (historyIndex === runs[mechanism].history.length - 1) historyIndex = 0;
  $('#play-rounds').textContent = '❚❚ Pause';
  $('#play-rounds').setAttribute('aria-pressed', 'true');
  renderHistoryStep();
  playTimer = window.setInterval(() => {
    historyIndex += 1;
    renderHistoryStep();
  }, 2200);
});

function allocationText(run) {
  return SCHOOL_CHOICE_SCENARIO.students.map((student) => `${student} → ${run.byStudent[student] || 'unmatched'}`).join('<br>');
}

$('#run-comparison').addEventListener('click', () => {
  const strategicScenario = structuredClone(SCHOOL_CHOICE_SCENARIO);
  strategicScenario.preferences.Bo = ['Aurora', 'Beacon', 'Cedar'];
  const strategicBoston = runBoston(strategicScenario);
  const bostonBlocks = findBlockingPairs(SCHOOL_CHOICE_SCENARIO, runs.boston);
  $('#comparison-content').innerHTML = `
    <table class="comparison-table">
      <thead><tr><th>Check</th><th>Boston</th><th>Student-proposing DA</th></tr></thead>
      <tbody>
        <tr><th>Final allocation</th><td>${allocationText(runs.boston)}</td><td>${allocationText(runs.deferred)}</td></tr>
        <tr><th>Acceptance status</th><td>Final each round</td><td>Tentative until proposals end</td></tr>
        <tr><th>Blocking-pair test</th><td>${bostonBlocks.length ? 'Fails: Bo + Aurora' : 'Passes in this example'}</td><td>Passes in this example</td></tr>
        <tr><th>Reporting stress test</th><td>With true preferences Beacon ≻ Aurora ≻ Cedar, Bo receives Cedar. Reporting Aurora first gives Bo Aurora, which Bo truly prefers to Cedar.</td><td>Truthful reporting is a dominant strategy for students in the standard student-proposing DA model.</td></tr>
      </tbody>
    </table>
    <p class="comparison-note"><strong>Computation is a counterexample generator, not a general proof.</strong> One manipulation disproves strategy-proofness for Boston. One stable run does not prove DA’s general stability or strategy-proofness; connect the simulation to the formal results and their assumptions.</p>
    <p class="micro-note">Strategic-report check: ${allocationText(strategicBoston)}</p>`;
  $('#comparison-dialog').showModal();
});
$('.dialog-close').addEventListener('click', () => $('#comparison-dialog').close());
$('#comparison-dialog').addEventListener('click', (event) => {
  if (event.target === $('#comparison-dialog')) $('#comparison-dialog').close();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionButton = $('#motion-toggle');
motionButton.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(paused));
  if (paused) {
    stopPlayback();
    clearSolutionTimers();
  }
});

const revealTargets = $$('.chapter-heading, .panel, .lineage, .handoff');
revealTargets.forEach((target) => target.dataset.reveal = '');
if (!reducedMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('reveal-enabled');
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add('revealed'));
}

updateNash();
solveSelten(false);
solveHarsanyi(false);
renderDiagnosis();
checkAbstract();
renderPreferenceTable();
createMatchingNodes();
renderHistoryStep();
