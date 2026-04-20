import { questions } from './questions.js';
import { types } from './types.js';

const state = {
  answers: [], // { pole: 'A', strength: 1..3 } or undefined
  index: 0,
  shuffled: [], // ランダム化された設問 (セッション開始時に確定)
};

function shuffleQuestions(src) {
  const arr = src.map((q) => {
    const choices = Math.random() < 0.5 ? [q.choices[1], q.choices[0]] : [q.choices[0], q.choices[1]];
    return { ...q, choices };
  });
  // Fisher-Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const screens = {
  landing: document.getElementById('screen-landing'),
  quiz: document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result'),
};

const LIKERT_BUTTONS = [
  { value: -3, label: 'A強',  side: 'a' },
  { value: -2, label: 'A',    side: 'a' },
  { value: -1, label: 'ややA', side: 'a' },
  { value:  1, label: 'ややB', side: 'b' },
  { value:  2, label: 'B',    side: 'b' },
  { value:  3, label: 'B強',  side: 'b' },
];

function show(name) {
  for (const key of Object.keys(screens)) {
    screens[key].classList.toggle('active', key === name);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function start() {
  state.answers = [];
  state.index = 0;
  state.shuffled = shuffleQuestions(questions);
  renderQuestion();
  show('quiz');
}

function renderQuestion() {
  const q = state.shuffled[state.index];
  const total = state.shuffled.length;
  const i = state.index + 1;

  document.getElementById('progress-text').textContent = `Q${i} / ${total}`;
  document.getElementById('progress-bar').style.width = `${((i - 1) / total) * 100}%`;
  document.getElementById('question-prompt').textContent = q.prompt;

  const container = document.getElementById('choices');
  container.innerHTML = '';

  // Two-choice display (A on top/left, B on bottom/right)
  const pair = document.createElement('div');
  pair.className = 'choice-pair';
  q.choices.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = `choice-display choice-${idx === 0 ? 'a' : 'b'}`;
    const label = idx === 0 ? 'A' : 'B';
    card.innerHTML = `<span class="choice-label">${label}</span><span class="choice-text"></span>`;
    card.querySelector('.choice-text').textContent = c.text;
    pair.appendChild(card);
  });
  container.appendChild(pair);

  // Likert scale
  const likert = document.createElement('div');
  likert.className = 'likert';

  const caption = document.createElement('div');
  caption.className = 'likert-caption';
  caption.innerHTML = '<span>Aに寄せる</span><span>Bに寄せる</span>';
  likert.appendChild(caption);

  const btnRow = document.createElement('div');
  btnRow.className = 'likert-buttons';

  const prev = state.answers[state.index];
  const prevValue = prev
    ? (prev.pole === q.choices[0].pole ? -prev.strength : prev.strength)
    : null;

  for (const b of LIKERT_BUTTONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `likert-btn likert-${b.side}`;
    btn.dataset.value = b.value;
    btn.innerHTML = `<span class="likert-dot"></span><span class="likert-txt"></span>`;
    btn.querySelector('.likert-txt').textContent = b.label;
    if (prevValue === b.value) btn.classList.add('selected');
    btn.addEventListener('click', () => answer(b.value));
    btn.addEventListener('mouseenter', () => btn.classList.add('is-hover'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('is-hover'));
    btnRow.appendChild(btn);
  }
  likert.appendChild(btnRow);
  container.appendChild(likert);

  document.getElementById('btn-back').disabled = state.index === 0;
}

function answer(value) {
  const q = state.shuffled[state.index];
  const pole = value < 0 ? q.choices[0].pole : q.choices[1].pole;
  const strength = Math.abs(value);
  state.answers[state.index] = { pole, strength };

  if (state.index === state.shuffled.length - 1) {
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
  for (const a of state.answers) {
    if (a) score[a.pole] += a.strength;
  }

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

  // 5 questions × strength up to 3 = max diff 15 per axis
  const maxDiff = 15;
  const clarity = {
    AE: Math.min(1, Math.abs(diffs.AE) / maxDiff),
    UR: Math.min(1, Math.abs(diffs.UR) / maxDiff),
    PI: Math.min(1, Math.abs(diffs.PI) / maxDiff),
    TD: Math.min(1, Math.abs(diffs.TD) / maxDiff),
  };

  return { code, score, clarity };
}

function emphasizeInitial(word) {
  return `<span class="pole-name"><span class="init">${word[0]}</span>${word.slice(1)}</span>`;
}

function clarityLabel(v) {
  if (v >= 0.85) return '極めて強く';
  if (v >= 0.65) return '強く';
  if (v >= 0.45) return '明確に';
  if (v >= 0.25) return 'やや';
  if (v >= 0.08) return 'わずかに';
  return null; // ほぼ互角
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
    const winnerIsLeft = code.includes(a.left.pole);
    const winner = winnerIsLeft ? a.left : a.right;
    const c = clarity[a.key];
    const label = clarityLabel(c);
    const fillPct = c * 50; // 中央から片側最大50%分
    const captionText = label === null
      ? 'ほぼ互角'
      : (winnerIsLeft
          ? `← ${label} ${winner.label}寄り`
          : `${label} ${winner.label}寄り →`);

    const row = document.createElement('div');
    row.className = 'axis-row';
    row.dataset.winner = winner.pole;
    row.innerHTML = `
      <div class="axis-labels">
        <span class="axis-pole ${winnerIsLeft ? 'picked' : ''}">${emphasizeInitial(a.left.label)}<small>${a.left.ja}</small></span>
        <span class="axis-pole ${!winnerIsLeft ? 'picked' : ''}">${emphasizeInitial(a.right.label)}<small>${a.right.ja}</small></span>
      </div>
      <div class="axis-bar">
        <div class="axis-center"></div>
        <div class="axis-fill ${winnerIsLeft ? 'axis-fill-left' : 'axis-fill-right'}" style="width:${fillPct}%"></div>
      </div>
      <div class="axis-caption ${label === null ? 'neutral' : ''}">${captionText}</div>
    `;
    axesEl.appendChild(row);
  }
}

function launchConfetti() {
  const area = document.getElementById('confetti');
  if (!area) return;
  area.innerHTML = '';
  const colors = ['#ff2e6b', '#00eaff', '#ffe63a', '#ff66b3', '#ff1a6b', '#ffffff'];
  const count = 80;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = '-5%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (10 + Math.random() * 10) + 'px';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.animationDuration = (2.2 + Math.random() * 1.4) + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    area.appendChild(piece);
  }
  setTimeout(() => { area.innerHTML = ''; }, 4500);
}

function finish() {
  renderResult();
  show('result');
  launchConfetti();
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
