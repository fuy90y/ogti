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

const GROUP_NAMES = {
  AU: { ja: '狂騒派', en: 'WILD' },
  AR: { ja: '熱血派', en: 'FERVENT' },
  EU: { ja: '幽玄派', en: 'MYSTIC' },
  ER: { ja: '正統派', en: 'CLASSIC' },
};

const SUB_GROUP_NAMES = {
  PT: { ja: '踊り手', en: 'DANCER' },
  PD: { ja: '射撃手', en: 'SHOOTER' },
  IT: { ja: '演者',   en: 'ACTOR' },
  ID: { ja: '観察者', en: 'OBSERVER' },
};

function renderResult() {
  const { code, score, clarity } = computeResult();
  const t = types[code];
  const group = code.substring(0, 2);

  const card = document.getElementById('result-card');
  card.dataset.group = group;
  document.getElementById('type-watermark').textContent = t.symbol;
  document.getElementById('type-symbol').textContent = t.symbol;
  document.getElementById('result-code').textContent = code;
  document.getElementById('result-name').textContent = t.name;
  document.getElementById('result-tagline').textContent = t.tagline;
  const subGroup = code.substring(2, 4);
  const g = GROUP_NAMES[group];
  const sg = SUB_GROUP_NAMES[subGroup];
  document.getElementById('result-group').innerHTML = `
    <span class="group-line primary">
      <span class="group-deriv">${code[0]}<span class="op">×</span>${code[1]}</span>
      <span class="group-name">${g.ja} / ${g.en}</span>
    </span>
    <span class="group-line secondary">
      <span class="group-deriv">${code[2]}<span class="op">×</span>${code[3]}</span>
      <span class="group-name">${sg.ja} / ${sg.en}</span>
    </span>
  `;
  document.getElementById('result-strength').textContent = t.strength;
  document.getElementById('result-weakness').textContent = t.weakness;
  document.getElementById('result-partner').textContent = t.partner;

  const axesEl = document.getElementById('result-axes');
  axesEl.innerHTML = '';
  const axisDefs = [
    { key: 'AE', title: { en: 'NERVE', ja: '度胸' },   left: { pole: 'A', label: 'Aggressive', ja: '挑戦' }, right: { pole: 'E', label: 'Elegant', ja: '洗練' } },
    { key: 'UR', title: { en: 'LENS',  ja: '視座' },   left: { pole: 'U', label: 'Unique', ja: '独自' },    right: { pole: 'R', label: 'Relatable', ja: '共感' } },
    { key: 'PI', title: { en: 'PULSE', ja: '拍子' },   left: { pole: 'P', label: 'Playful', ja: '剽軽' },   right: { pole: 'I', label: 'Intelligent', ja: '知性' } },
    { key: 'TD', title: { en: 'VOICE', ja: '語り口' }, left: { pole: 'T', label: 'Theatrical', ja: '演技' },right: { pole: 'D', label: 'Descriptive', ja: '解説' } },
  ];
  for (const a of axisDefs) {
    const winnerIsLeft = code.includes(a.left.pole);
    const winner = winnerIsLeft ? a.left : a.right;
    const c = clarity[a.key];
    const fillPct = c * 50; // 中央から片側最大50%分

    const row = document.createElement('div');
    row.className = 'axis-row';
    row.dataset.winner = winner.pole;
    row.innerHTML = `
      <div class="axis-labels">
        <span class="axis-pole ${winnerIsLeft ? 'picked' : ''}">${emphasizeInitial(a.left.label)}<small>${a.left.ja}</small></span>
        <span class="axis-title"><strong>${a.title.en}</strong><span>${a.title.ja}</span></span>
        <span class="axis-pole ${!winnerIsLeft ? 'picked' : ''}">${emphasizeInitial(a.right.label)}<small>${a.right.ja}</small></span>
      </div>
      <div class="axis-bar">
        <div class="axis-center"></div>
        <div class="axis-fill ${winnerIsLeft ? 'axis-fill-left' : 'axis-fill-right'}" style="width:${fillPct}%"></div>
      </div>
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
// ========== Share image generation ==========

const GROUP_COLORS = {
  AU: { main: '#ff2e8c', deep: '#c01860' },
  AR: { main: '#ff7a1a', deep: '#c95200' },
  EU: { main: '#a44dff', deep: '#6a1fb8' },
  ER: { main: '#00c8ff', deep: '#008fb8' },
};

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawNeonText(ctx, text, x, y, color, offsetColor, offsetDist = 6) {
  ctx.save();
  // Offset depth (gold + ink)
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#05010f';
  ctx.fillText(text, x + offsetDist * 2, y + offsetDist * 2);
  ctx.fillStyle = offsetColor;
  ctx.fillText(text, x + offsetDist, y + offsetDist);
  // Glow passes
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.shadowBlur = 40; ctx.fillText(text, x, y);
  ctx.shadowBlur = 20; ctx.fillText(text, x, y);
  ctx.shadowBlur = 8;  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapJPText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  return lines.length;
}

async function generateShareCanvas() {
  const { code } = computeResult();
  const t = types[code];
  const group = code.substring(0, 2);
  const subGroup = code.substring(2, 4);
  const gc = GROUP_COLORS[group];

  const W = 1080, H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Ensure fonts are ready
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('240px "Rampart One"', code),
    document.fonts.load('720px "Rampart One"', t.symbol),
    document.fonts.load('bold 72px "Zen Maru Gothic"', t.name),
    document.fonts.load('28px "Zen Maru Gothic"', t.tagline),
    document.fonts.load('24px "RocknRoll One"', 'サンプル'),
  ]).catch(() => {});

  // ---- Background ----
  ctx.fillStyle = '#0a0618';
  ctx.fillRect(0, 0, W, H);

  const g1 = ctx.createRadialGradient(W * 0.18, H * 0.08, 0, W * 0.18, H * 0.08, W * 0.8);
  g1.addColorStop(0, 'rgba(255, 46, 107, 0.28)');
  g1.addColorStop(0.55, 'rgba(10, 6, 24, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(W * 0.85, H * 0.95, 0, W * 0.85, H * 0.95, W * 0.8);
  g2.addColorStop(0, 'rgba(0, 234, 255, 0.22)');
  g2.addColorStop(0.55, 'rgba(10, 6, 24, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Grid pattern
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 46, 107, 0.05)';
  for (let x = 0; x <= W; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0, 234, 255, 0.05)';
  for (let y = 0; y <= H; y += 54) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ---- Watermark symbol ----
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.font = '720px "Rampart One"';
  ctx.fillStyle = gc.main;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = gc.main;
  ctx.shadowBlur = 50;
  ctx.fillText(t.symbol, W / 2, H / 2 + 30);
  ctx.restore();

  // ---- Card border ----
  ctx.save();
  ctx.strokeStyle = gc.main;
  ctx.lineWidth = 6;
  ctx.shadowColor = gc.main;
  ctx.shadowBlur = 30;
  roundRectPath(ctx, 36, 36, W - 72, H - 72, 36);
  ctx.stroke();
  ctx.restore();

  // ---- Brand mark ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '64px "Rampart One"';
  drawNeonText(ctx, 'OGTI.', W / 2, 96, '#ff2e6b', '#ffe63a', 4);
  ctx.font = '15px "RocknRoll One"';
  ctx.fillStyle = '#00eaff';
  ctx.shadowColor = '#00eaff';
  ctx.shadowBlur = 10;
  ctx.fillText('OOGIRI TYPE INDICATOR', W / 2, 190);
  ctx.restore();

  // ---- Big code ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '240px "Rampart One"';
  drawNeonText(ctx, code, W / 2, 440, gc.main, '#ffe63a', 6);
  ctx.restore();

  // ---- Type name ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 72px "Zen Maru Gothic"';
  ctx.fillStyle = '#ffe63a';
  ctx.shadowColor = '#ffe63a';
  ctx.shadowBlur = 22;
  ctx.fillText(t.name, W / 2, 620);
  ctx.restore();

  // ---- Tagline (wrapped) ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '26px "Zen Maru Gothic"';
  ctx.fillStyle = '#b8a9e0';
  wrapJPText(ctx, t.tagline, W / 2, 720, W - 180, 44);
  ctx.restore();

  // ---- Group tags ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const g1n = GROUP_NAMES[group];
  const s1n = SUB_GROUP_NAMES[subGroup];

  ctx.font = '22px "RocknRoll One"';
  ctx.fillStyle = gc.main;
  ctx.shadowColor = gc.main;
  ctx.shadowBlur = 14;
  ctx.fillText(`${code[0]} × ${code[1]}  ${g1n.ja} / ${g1n.en}`, W / 2, 850);

  ctx.font = '20px "RocknRoll One"';
  ctx.fillStyle = 'rgba(250, 248, 255, 0.75)';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
  ctx.shadowBlur = 6;
  ctx.fillText(`${code[2]} × ${code[3]}  ${s1n.ja} / ${s1n.en}`, W / 2, 894);
  ctx.restore();

  // ---- Footer ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '18px "RocknRoll One"';
  ctx.fillStyle = 'rgba(147, 136, 184, 0.8)';
  ctx.fillText('#OGTI診断', W / 2, 990);
  ctx.restore();

  return canvas;
}

let shareBlob = null;

async function openShareModal() {
  const modal = document.getElementById('share-modal');
  const img = document.getElementById('share-image');
  const preview = document.querySelector('.share-preview');
  preview.classList.remove('ready');
  img.removeAttribute('src');
  modal.hidden = false;

  try {
    const canvas = await generateShareCanvas();
    img.src = canvas.toDataURL('image/png');
    preview.classList.add('ready');
    canvas.toBlob((blob) => { shareBlob = blob; }, 'image/png');
  } catch (e) {
    console.error('share image generation failed', e);
  }
}

function closeShareModal() {
  document.getElementById('share-modal').hidden = true;
}

function downloadShare() {
  if (!shareBlob) return;
  const { code } = computeResult();
  const url = URL.createObjectURL(shareBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OGTI_${code}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function systemShareImage() {
  if (!shareBlob) return;
  const { code } = computeResult();
  const t = types[code];
  const file = new File([shareBlob], `OGTI_${code}.png`, { type: 'image/png' });
  const data = {
    title: `OGTI 診断結果 — ${t.name}`,
    text: `私のOGTIは【${code}】${t.name}\n${t.tagline}\n#OGTI診断`,
    files: [file],
  };
  if (navigator.canShare && navigator.canShare(data)) {
    try { await navigator.share(data); } catch (e) { /* cancelled */ }
  } else {
    downloadShare();
  }
}

document.getElementById('btn-share').addEventListener('click', openShareModal);
document.getElementById('share-close').addEventListener('click', closeShareModal);
document.getElementById('share-backdrop').addEventListener('click', closeShareModal);
document.getElementById('share-download').addEventListener('click', downloadShare);
document.getElementById('share-native').addEventListener('click', systemShareImage);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('share-modal').hidden) closeShareModal();
});
