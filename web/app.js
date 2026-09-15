import {
  SCHOOL_CHOICE_SCENARIO,
  classifyGame,
  findBlockingPairs,
  findPureNash,
  runBoston,
  runDeferredAcceptance,
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

function updateNash() {
  try {
    const equilibria = findPureNash(matrixFromInputs('row'), matrixFromInputs('column'));
    const rowNames = ['Cooperate', 'Defect'];
    const columnNames = ['Cooperate', 'Defect'];
    $('#nash-result').textContent = equilibria.length
      ? `Pure Nash: ${equilibria.map(([row, column]) => `(${rowNames[row]}, ${columnNames[column]})`).join('; ')}`
      : 'No pure Nash equilibrium; inspect mixed strategies.';
  } catch (error) {
    $('#nash-result').textContent = error.message;
  }
}
$$('[data-matrix]').forEach((input) => input.addEventListener('input', updateNash));

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
let historyIndex = 0;

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
  return `<path class="match-line ${className}" d="M ${from.x} ${from.y} C ${midpoint} ${from.y}, ${midpoint} ${to.y}, ${to.x} ${to.y}"/>`;
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
  $('#round-counter').textContent = `ROUND ${step.round}`;
  $('#round-title').textContent = step.label;
  const applications = Object.entries(step.applications || {}).filter(([, students]) => students.length);
  $('#round-applications').innerHTML = applications.length
    ? `<div class="application-list">${applications.map(([school, students]) => `<div><b>${escapeHtml(school)}</b><br>${students.map(escapeHtml).join(', ')}</div>`).join('')}</div>`
    : '<p class="micro-note">No new applications in this state.</p>';
  const final = historyIndex === run.history.length - 1;
  $('#next-round').disabled = final;
  $('#next-round').textContent = final ? 'Final allocation' : 'Next round →';
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
$('#reset-match').addEventListener('click', () => { historyIndex = 0; renderHistoryStep(); });
$('#mechanism-select').addEventListener('change', (event) => {
  mechanism = event.target.value;
  historyIndex = 0;
  renderHistoryStep();
});
window.addEventListener('resize', () => renderHistoryStep());

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

renderDiagnosis();
updateNash();
checkAbstract();
renderPreferenceTable();
createMatchingNodes();
renderHistoryStep();
