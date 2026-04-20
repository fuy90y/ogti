import { questions } from './questions.js';
import { types } from './types.js';

const state = {
  answers: [],
  index: 0,
};

const screens = {
  landing: document.getElementById('screen-landing'),
  quiz: document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result'),
};

function show(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle('active', key === name);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function start() {
  state.answers = [];
  state.index = 0;
  renderQuestion();
  show('quiz');
}

function renderQuestion() {
  const q = questions[state.index];
  const total = questions.length;
  const i = state.index + 1;

  document.getElementById('progress-text').textContent = `Q${i} / ${total}`;
  document.getElementById('progress-bar').style.width = `${((i - 1) / total) * 100}%`;
  document.getElementById('question-prompt').textContent = q.prompt;

  const choicesEl = document.getElementById('choices');
  choicesEl.innerHTML = '';
  q.choices.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.type = 'button';
    btn.innerHTML = `<span class="choice-label">${idx === 0 ? 'A' : 'B'}</span><span class="choice-text">${c.text}</span>`;
    btn.addEventListener('click', () => answer(c.pole));
    choicesEl.appendChild(btn);
  });

  document.getElementById('btn-back').disabled = state.index === 0;
}

function answer(pole) {
  state.answers[state.index] = pole;
  if (state.index === questions.length - 1) {
    finish();
  } else {
    state.index++;
    renderQuestion();
  }
}

function back() {
  if (state.index === 0) return;
  state.index--;
  renderQuestion();
}

function computeResult() {
  const score = { A: 0, E: 0, U: 0, R: 0, P: 0, I: 0, T: 0, D: 0 };
  for (const p of state.answers) score[p]++;

  const diffs = {
    AE: score.A - score.E,
    UR: score.U - score.R,
    PI: score.P - score.I,
    TD: score.T - score.D,
  };

  const code =
    (diffs.AE >= 0 ? 'A' : 'E') +
    (diffs.UR >= 0 ? 'U' : 'R') +
    (diffs.PI >= 0 ? 'P' : 'I') +
    (diffs.TD >= 0 ? 'T' : 'D');

  const perAxis = 4; // 各軸の設問数
  const clarity = {
    AE: Math.abs(diffs.AE) / perAxis,
    UR: Math.abs(diffs.UR) / perAxis,
    PI: Math.abs(diffs.PI) / perAxis,
    TD: Math.abs(diffs.TD) / perAxis,
  };

  return { code, score, clarity };
}

function clarityLabel(v) {
  if (v >= 0.75) return 'はっきり';
  if (v >= 0.5) return 'やや';
  if (v >= 0.25) return '僅差で';
  return 'ほぼ互角、わずかに';
}

function renderResult() {
  const { code, score, clarity } = computeResult();
  const t = types[code];

  document.getElementById('result-code').textContent = code;
  document.getElementById('result-name').textContent = t.name;
  document.getElementById('result-tagline').textContent = t.tagline;
  document.getElementById('result-strength').textContent = t.strength;
  document.getElementById('result-weakness').textContent = t.weakness;
  document.getElementById('result-partner').textContent = t.partner;

  const axesEl = document.getElementById('result-axes');
  axesEl.innerHTML = '';
  const axisDefs = [
    { key: 'AE', left: { pole: 'A', label: 'Aggressive', ja: '挑戦' }, right: { pole: 'E', label: 'Elegant', ja: '洗練' } },
    { key: 'UR', left: { pole: 'U', label: 'Unique', ja: '独自' }, right: { pole: 'R', label: 'Relatable', ja: '共感' } },
    { key: 'PI', left: { pole: 'P', label: 'Playful', ja: '剽軽' }, right: { pole: 'I', label: 'Intelligent', ja: '知性' } },
    { key: 'TD', left: { pole: 'T', label: 'Theatrical', ja: '演技' }, right: { pole: 'D', label: 'Descriptive', ja: '解説' } },
  ];
  for (const a of axisDefs) {
    const leftScore = score[a.left.pole];
    const rightScore = score[a.right.pole];
    const chosen = code.includes(a.left.pole) ? a.left : a.right;
    const total = leftScore + rightScore;
    const leftPct = total === 0 ? 50 : (leftScore / total) * 100;

    const row = document.createElement('div');
    row.className = 'axis-row';
    row.innerHTML = `
      <div class="axis-labels">
        <span class="${code.includes(a.left.pole) ? 'picked' : ''}">${a.left.label} <small>${a.left.ja}</small></span>
        <span class="axis-clarity">${clarityLabel(clarity[a.key])} ${chosen.label}</span>
        <span class="${code.includes(a.right.pole) ? 'picked' : ''}">${a.right.label} <small>${a.right.ja}</small></span>
      </div>
      <div class="axis-bar">
        <div class="axis-fill" style="width:${leftPct}%"></div>
      </div>
    `;
    axesEl.appendChild(row);
  }
}

function finish() {
  renderResult();
  show('result');
}

function restart() {
  show('landing');
}

document.getElementById('btn-start').addEventListener('click', start);
document.getElementById('btn-back').addEventListener('click', back);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-share').addEventListener('click', async () => {
  const { code } = computeResult();
  const t = types[code];
  const text = `私のOGTIは【${code}】${t.name}\n${t.tagline}\n#OGTI診断`;
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('btn-share');
      const orig = btn.textContent;
      btn.textContent = 'コピーしました';
      setTimeout(() => (btn.textContent = orig), 1500);
    }
  } catch (e) {
    // share cancelled — ignore
  }
});
