import { config } from './data/config.js';
import { questions } from './data/questions.js';
import { types } from './data/types.js';

const sections = config.sections;

const state = {
  answers: [], // { pole: 'A', strength: 0.9..2.9 } or undefined
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

// 値はすべて奇数 (3/5/7)。奇数個 (5問) の奇数の和は必ず奇数になるため、
// 軸ごとの差分が 0 になることは数学的に排除される (タイブレーク不要)。
const LIKERT_BUTTONS = [
  { value: -7, label: 'A強',  side: 'a' },
  { value: -5, label: 'A',    side: 'a' },
  { value: -3, label: 'ややA', side: 'a' },
  { value:  3, label: 'ややB', side: 'b' },
  { value:  5, label: 'B',    side: 'b' },
  { value:  7, label: 'B強',  side: 'b' },
];

// ---- Theme / Palette ----
// 実際の色・フォントの値は styles.css の :root[data-theme|palette="..."] にある。
// ここでは CSS 変数を読むヘルパーと、グループ色の position → CSS 変数のマッピングだけ持つ。
function cssVar(name, fallback = '') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// グループ色: タイプコード先頭2文字 (第1軸×第2軸) を CSS 変数 --group-N-* に解決する。
// 順序は styles.css のコメント参照 (left-left / left-right / right-left / right-right)。
function getGroupColors() {
  const L0 = config.axes[0].left.pole,  R0 = config.axes[0].right.pole;
  const L1 = config.axes[1].left.pole,  R1 = config.axes[1].right.pole;
  return {
    [L0 + L1]: { main: cssVar('--group-1-main'), deep: cssVar('--group-1-deep') },
    [L0 + R1]: { main: cssVar('--group-2-main'), deep: cssVar('--group-2-deep') },
    [R0 + L1]: { main: cssVar('--group-3-main'), deep: cssVar('--group-3-deep') },
    [R0 + R1]: { main: cssVar('--group-4-main'), deep: cssVar('--group-4-deep') },
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ========== Hydration (config → HTML) ==========
// ページ読み込み時に config.js の値で landing / terms を動的に書き換える。
// index.html の OGTI 固有文字列は "デフォルト表示" であり、JSが上書きする。

function hydrateLanding() {
  // このページが landing (index.html) かチェック
  if (!document.getElementById('screen-landing')) return;

  document.title = config.meta.title;
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', config.meta.description);

  const brandTitle = document.querySelector('.brand-title');
  if (brandTitle) {
    brandTitle.textContent = config.brand.name;
    if (config.brand.accent) {
      const accent = document.createElement('span');
      accent.className = 'accent';
      accent.textContent = config.brand.accent;
      brandTitle.appendChild(accent);
    }
  }
  const brandSub = document.querySelector('.brand-sub');
  if (brandSub) brandSub.textContent = config.brand.subtitle;

  // Lead paragraphs
  const lead = document.querySelector('.lead');
  if (lead) {
    lead.querySelectorAll(':scope > p').forEach((p) => p.remove());
    const anchor = lead.querySelector('.axes-heading') || lead.querySelector('.axes-intro');
    config.landing.lead.forEach((html) => {
      const p = document.createElement('p');
      p.innerHTML = html;
      if (anchor) lead.insertBefore(p, anchor);
      else lead.appendChild(p);
    });
  }

  const axesHeading = document.querySelector('.axes-heading span');
  if (axesHeading) axesHeading.textContent = config.landing.axesHeading;

  const btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.textContent = config.landing.startButton;

  // Drumroll
  const line1 = document.querySelector('.start-line-1');
  const line2 = document.querySelector('.start-line-2');
  if (line1) line1.textContent = config.drumroll.line1;
  if (line2) line2.textContent = config.drumroll.line2;

  // 軸紹介リスト
  const ul = document.querySelector('.axes-intro');
  if (ul) {
    ul.innerHTML = '';
    for (const axis of config.axes) {
      const li = document.createElement('li');
      li.appendChild(buildPoleChip(axis.left, 'left'));
      li.appendChild(buildArrowBadge(axis.title));
      li.appendChild(buildPoleChip(axis.right, 'right'));
      ul.appendChild(li);
    }
  }

  // フッターブランド表記
  const footBrand = document.querySelector('.site-foot-brand');
  if (footBrand) footBrand.textContent = `${config.brand.name} — ${config.brand.fullName}`;
}

function buildPoleChip(pole, side) {
  const span = document.createElement('span');
  span.setAttribute('data-side', side);
  span.innerHTML =
    `<span class="pole-name">` +
      `<span class="init">${escapeHtml(pole.label.charAt(0))}</span>` +
      `${escapeHtml(pole.label.slice(1))}` +
    `</span>` +
    `<small>${escapeHtml(pole.ja)}</small>`;
  return span;
}

function buildArrowBadge(title) {
  const span = document.createElement('span');
  span.className = 'vs';
  const strong = document.createElement('strong');
  strong.textContent = title.en;
  const small = document.createElement('small');
  small.textContent = title.ja;
  span.append(strong, small);
  return span;
}

// テーマ/配色を <html> の data 属性に反映 (ページ種別を問わず先に適用)
// styles.css に定義されているパレット一覧。config.palette が 'random' の場合や
// 配列で渡された場合の候補となる。新パレット追加時はここにも追記すること。
const KNOWN_PALETTES = [
  'red-blue', 'lime-magenta', 'matrix',
  'sunset', 'ice', 'blood-moon', 'vaporwave',
  'hacker', 'miami', 'aurora', 'arcade',
  'lava', 'deep-sea', 'halloween',
];

function resolvePalette(spec) {
  if (Array.isArray(spec))  return spec[Math.floor(Math.random() * spec.length)];
  if (spec === 'random')    return KNOWN_PALETTES[Math.floor(Math.random() * KNOWN_PALETTES.length)];
  return spec;
}

function applyThemeAndPalette() {
  const root = document.documentElement;
  if (config.theme) root.dataset.theme = config.theme;
  const palette = resolvePalette(config.palette);
  if (palette) root.dataset.palette = palette;
}
applyThemeAndPalette();

hydrateLanding();

// ---- URL ?type= によるタイプ直指定 ----
// ?type=AUPT のように正しいタイプコードが指定されたとき、クイズをスキップしてその結果画面に直行する。
// 他人とリンク共有する用途や、特定のタイプをプレビューしたいときに使える。
const TEST_TYPE = (() => {
  const q = new URL(location.href).searchParams.get('type');
  return q && types[q] ? q : null;
})();

// ?type=AUPT 指定時はクイズをスキップして結果画面へ直行
if (TEST_TYPE) {
  requestAnimationFrame(() => {
    renderResult();
    renderTypeIndex();
    show('result');
  });
}

// ========== Core flow ==========

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

  const caption = document.createElement('div');
  caption.className = 'likert-caption';
  caption.innerHTML = '<span>Aに寄せる</span><span>Bに寄せる</span>';
  likert.appendChild(caption);

  container.appendChild(likert);

  document.getElementById('btn-back').disabled = state.index === 0;
}

function answer(value) {
  if (state.pending) return;
  state.pending = true;

  const q = state.shuffled[state.index];
  const pole = value < 0 ? q.choices[0].pole : q.choices[1].pole;
  const strength = Math.abs(value);
  state.answers[state.index] = { pole, strength };

  // 選択ボタンを視覚的にハイライト
  const buttons = document.querySelectorAll('.likert-btn');
  buttons.forEach((b) => b.classList.remove('selected'));
  buttons.forEach((b) => {
    if (Number(b.dataset.value) === value) b.classList.add('selected');
  });

  // 選択が見える時間を取ってから遷移
  setTimeout(() => {
    state.pending = false;
    if (state.index === state.shuffled.length - 1) {
      finish();
    } else {
      state.index++;
      renderQuestion();
    }
  }, 280);
}

function back() {
  if (state.index === 0) return;
  state.index--;
  renderQuestion();
}

// 軸ごとの設問数を集計 (questions.js の q.axis は 1-indexed で config.axes のインデックスに対応)
const QUESTION_COUNT_BY_AXIS_KEY = (() => {
  const counts = {};
  for (const axis of config.axes) counts[axis.key] = 0;
  for (const q of questions) {
    const axis = config.axes[q.axis - 1];
    if (axis) counts[axis.key]++;
  }
  // 偶数問題数の軸があるとタイが発生しうるので警告 (奇数個の奇数の和 = 奇数、という証明に依存)
  for (const [key, count] of Object.entries(counts)) {
    if (count > 0 && count % 2 === 0) {
      console.warn(`[診断] 軸 ${key} の設問数が偶数 (${count}) です。引き分け (スコア差 0) が発生する可能性があります。奇数にすることを推奨します。`);
    }
  }
  return counts;
})();

// LIKERT_BUTTONS の絶対値最大 = 1問あたりの最大 strength
const MAX_STRENGTH = Math.max(...LIKERT_BUTTONS.map((b) => Math.abs(b.value)));

function computeResult() {
  // TEST_TYPE 指定時 かつ クイズ未回答のときのみ URL 指定タイプで代替する。
  // ランディングからクイズを始めれば state.answers が埋まり、通常の集計に切り替わる。
  if (TEST_TYPE && state.answers.length === 0) {
    const clarity = Object.fromEntries(config.axes.map((a) => [a.key, 1]));
    return { code: TEST_TYPE, score: {}, clarity };
  }

  const score = {};
  for (const axis of config.axes) {
    score[axis.left.pole] = 0;
    score[axis.right.pole] = 0;
  }
  for (const a of state.answers) {
    if (a && score.hasOwnProperty(a.pole)) score[a.pole] += a.strength;
  }

  let code = '';
  const clarity = {};
  for (const axis of config.axes) {
    const diff = score[axis.left.pole] - score[axis.right.pole];
    code += diff >= 0 ? axis.left.pole : axis.right.pole;
    // 軸ごとの最大差 = 軸の問題数 × 最大 strength (questions.js の中身に自動追従)
    const maxDiff = QUESTION_COUNT_BY_AXIS_KEY[axis.key] * MAX_STRENGTH;
    clarity[axis.key] = maxDiff > 0 ? Math.min(1, Math.abs(diff) / maxDiff) : 0;
  }
  return { code, score, clarity };
}

function emphasizeInitial(word) {
  return `<span class="pole-name"><span class="init">${word[0]}</span>${word.slice(1)}</span>`;
}

// 現在表示しているタイプコード。null なら本人の結果を表示中。
let displayedCode = null;

// タイプコード → グループindex(1..4)。第1軸×第2軸 の left/right 組合せで決まる。
function groupIndexOf(code) {
  const isLeft0 = code[0] === config.axes[0].left.pole;
  const isLeft1 = code[1] === config.axes[1].left.pole;
  if ( isLeft0 &&  isLeft1) return 1;
  if ( isLeft0 && !isLeft1) return 2;
  if (!isLeft0 &&  isLeft1) return 3;
  return 4;
}

function renderResult(overrideCode = null) {
  const computed = computeResult();
  const code = overrideCode || computed.code;
  // overrideCode 指定時は「このタイプの理想像」として軸を全て満タン表示
  const clarity = overrideCode
    ? Object.fromEntries(config.axes.map((a) => [a.key, 1]))
    : computed.clarity;
  const t = types[code];
  const group = code.substring(0, 2);

  const isBrowsing = overrideCode && overrideCode !== computed.code;
  displayedCode = overrideCode;
  const notice = document.getElementById('browse-notice');
  const btnShare = document.getElementById('btn-share');
  if (notice)   notice.hidden   = !isBrowsing;
  // 「もう一度診断する」は常時見せる。シェアだけは他人のページで押せても意味が曖昧なので隠す。
  // ただし ?type= 指定中 (テスト/プレビュー目的) は grid で他タイプに移動しても常時表示する。
  if (btnShare) btnShare.hidden =  isBrowsing && !TEST_TYPE;

  const card = document.getElementById('result-card');
  // グループ色をインラインで注入。
  // ポール文字に依存せず、palette の --group-N-* を position-based で解決する。
  const gc = getGroupColors()[group];
  if (gc) {
    card.style.setProperty('--group-color', gc.main);
    card.style.setProperty('--group-color-deep', gc.deep);
  }
  document.getElementById('type-watermark').textContent = t.symbol;
  document.getElementById('type-symbol').textContent = t.symbol;
  renderSigilSVG(document.getElementById('type-sigil'), code, clarity, gc);
  document.getElementById('result-code').textContent = code;
  document.getElementById('result-name').textContent = t.name;
  document.getElementById('result-tagline').textContent = t.tagline;

  // グループ表示 (config.groups.enabled で可変)
  const groupEl = document.getElementById('result-group');
  if (config.groups.enabled) {
    const subGroup = code.substring(2, 4);
    const g = config.groups.primary[group];
    const sg = config.groups.sub[subGroup];
    groupEl.hidden = false;
    groupEl.innerHTML = `
      <span class="group-line primary">
        <span class="group-deriv">${code[0]}<span class="op">×</span>${code[1]}</span>
        <span class="group-name">${escapeHtml(g.ja)} / ${escapeHtml(g.en)}</span>
      </span>
      <span class="group-line secondary">
        <span class="group-deriv">${code[2]}<span class="op">×</span>${code[3]}</span>
        <span class="group-name">${escapeHtml(sg.ja)} / ${escapeHtml(sg.en)}</span>
      </span>
    `;
  } else {
    groupEl.hidden = true;
    groupEl.innerHTML = '';
  }

  // テキストセクション
  const sectionsEl = document.getElementById('result-sections');
  sectionsEl.innerHTML = '';
  for (const s of sections) {
    const body = t[s.key];
    if (!body) continue;
    const el = document.createElement('div');
    el.className = 'result-section';
    const h3 = document.createElement('h3');
    h3.textContent = s.title;
    el.appendChild(h3);
    for (const para of String(body).split(/\n{2,}/)) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      const p = document.createElement('p');
      p.innerHTML = trimmed.replace(/\n/g, '<br>');
      el.appendChild(p);
    }
    sectionsEl.appendChild(el);
  }

  // 軸ごとの傾向
  const axesEl = document.getElementById('result-axes');
  axesEl.innerHTML = '';
  for (const a of config.axes) {
    const winnerIsLeft = code.includes(a.left.pole);
    const winner = winnerIsLeft ? a.left : a.right;
    const c = clarity[a.key];
    const fillPct = c * 50; // 中央から片側最大50%分

    const row = document.createElement('div');
    row.className = 'axis-row';
    row.dataset.winnerSide = winnerIsLeft ? 'left' : 'right';
    row.innerHTML = `
      <div class="axis-labels">
        <span class="axis-pole ${winnerIsLeft ? 'picked' : ''}">${emphasizeInitial(a.left.label)}<small>${escapeHtml(a.left.ja)}</small></span>
        <span class="axis-title"><strong>${escapeHtml(a.title.en)}</strong><span>${escapeHtml(a.title.ja)}</span></span>
        <span class="axis-pole ${!winnerIsLeft ? 'picked' : ''}">${emphasizeInitial(a.right.label)}<small>${escapeHtml(a.right.ja)}</small></span>
      </div>
      <div class="axis-bar">
        <div class="axis-center"></div>
        <div class="axis-fill ${winnerIsLeft ? 'axis-fill-left' : 'axis-fill-right'}" style="width:${fillPct}%"></div>
      </div>
    `;
    axesEl.appendChild(row);
  }

  // 現在表示中のカードを type-index 上でハイライト更新
  const indexEl = document.getElementById('type-index');
  if (indexEl) {
    indexEl.querySelectorAll('.type-card').forEach((card) => {
      card.classList.toggle('is-active', card.dataset.code === code);
    });
  }
}

// 結果画面下部の「他のタイプを見る」グリッド。16タイプのカードを出す。
function renderTypeIndex() {
  const indexEl = document.getElementById('type-index');
  if (!indexEl) return;
  const mineCode = computeResult().code;
  indexEl.innerHTML = '';
  for (const code of Object.keys(types)) {
    const t = types[code];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'type-card';
    card.dataset.code = code;
    card.dataset.group = String(groupIndexOf(code));
    if (code === mineCode) card.classList.add('is-mine');
    card.innerHTML = `
      <span class="type-card-symbol">${escapeHtml(t.symbol)}</span>
      <span class="type-card-code">${escapeHtml(code)}</span>
      <span class="type-card-name">${escapeHtml(t.name)}</span>
    `;
    card.addEventListener('click', () => {
      renderResult(code === mineCode ? null : code);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    indexEl.appendChild(card);
  }
}

function launchConfetti() {
  const area = document.getElementById('confetti');
  if (!area) return;
  area.innerHTML = '';
  const colors = [
    cssVar('--accent',     '#ff2e6b'),
    cssVar('--pole-right', '#00eaff'),
    cssVar('--gold',       '#ffe63a'),
    cssVar('--pop',        '#ff66b3'),
    cssVar('--pole-left',  '#ff1a6b'),
    cssVar('--text',       '#faf8ff'),
  ];
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

async function finish() {
  // スゥ…とフェードアウト → 暗転 → 結果画面を一瞬で表示 (ネオンフリッカーが「点灯」を担う)
  const app = document.querySelector('.app');
  app.style.transitionDuration = '750ms';
  app.classList.add('is-transitioning');
  await new Promise((r) => setTimeout(r, 750));   // slow smooth fade out
  await new Promise((r) => setTimeout(r, 400));   // 完全に暗転した静止時間
  renderResult();
  renderTypeIndex();
  show('result');
  // 描画完了を待って、appを瞬時に可視化 (画面の neonFlicker が点灯演出を担当)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  app.style.transitionDuration = '0ms';
  app.classList.remove('is-transitioning');
  // 次の transition はデフォルト値に戻す
  setTimeout(() => { app.style.transitionDuration = ''; }, 50);
}

function restart() {
  applyThemeAndPalette();
  show('landing');
}

function startWithDrama() {
  const overlay = document.getElementById('start-overlay');
  overlay.classList.remove('active');
  void overlay.offsetWidth;
  overlay.classList.add('active');
  setTimeout(() => { start(); }, 1600);
  setTimeout(() => { overlay.classList.remove('active'); }, 1850);
}

// ========== Share image ==========

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---- Sigil (本人固有の4軸を1つの形に) ----
// 各軸に N/E/S/W の基準方向を割り当て、勝った極に応じて±22.5°だけシフトする。
// これで4頂点は常に4象限に散らばるため、閉多角形は必ず原点を内包する。
// 4軸×2極で 16通りの頂点配置 → 16タイプ固有のシルエット。
// 頂点までの距離は clarity (確信度) で決まる。
const SIGIL_AXIS_BASE = [90, 0, 270, 180];  // axis 0..3 の基準方向 (度)
const SIGIL_AXIS_SHIFT = 22.5;              // 極でこの分だけ CCW/CW にずらす
function computeSigilVertices(code, clarity, maxR) {
  const raw = config.axes.map((axis, i) => {
    // べき乗 0.35 で小さい clarity を視覚的に底上げ (弱い軸ほど中心寄り、の相対情報は保存)
    const c = Math.pow(Math.max(0, clarity[axis.key] ?? 0), 0.35);
    const isLeft = code[i] === axis.left.pole;
    // 左極は CCW (+)、右極は CW (-) にシフト
    const angleDeg = SIGIL_AXIS_BASE[i] + (isLeft ? SIGIL_AXIS_SHIFT : -SIGIL_AXIS_SHIFT);
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x:  Math.cos(rad) * c * maxR,
      y: -Math.sin(rad) * c * maxR,  // 画面座標は y 下向き
      angle: ((angleDeg % 360) + 360) % 360,
    };
  });
  // 角度順に並べ替えてきれいな閉多角形にする
  raw.sort((a, b) => a.angle - b.angle);
  return raw;
}

// 結果画面向け SVG 版 sigil (カード背景に透かして単色で描く)
function renderSigilSVG(container, code, clarity, gc) {
  if (!container) return;
  const maxR = 100;
  const padding = 8;
  const vb = maxR + padding;
  const vs = computeSigilVertices(code, clarity, maxR);
  const points = vs.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
  const main = gc?.main || 'var(--accent)';
  container.innerHTML = `<svg viewBox="-${vb} -${vb} ${vb * 2} ${vb * 2}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="${points}" fill="${main}" />
  </svg>`;
}

function drawSigil(ctx, cx, cy, code, clarity, opts = {}) {
  const {
    maxR = 300,
    color = '#ffffff',
    fillAlpha = 0.35,
    glowBlur = 40,
  } = opts;
  const vs = computeSigilVertices(code, clarity, maxR);

  ctx.save();
  ctx.translate(cx, cy);

  // 単色塗りつぶしの多角形 (発光あり)
  ctx.beginPath();
  vs.forEach((v, i) => {
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  });
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, fillAlpha);
  ctx.shadowColor = color;
  ctx.shadowBlur = glowBlur;
  ctx.fill();

  ctx.restore();
}

function drawNeonText(ctx, text, x, y, color, offsetColor, offsetDist = 6) {
  ctx.save();
  // Offset depth (gold + ink)
  ctx.shadowBlur = 0;
  ctx.fillStyle = cssVar('--ink', '#05010f');
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

// 上揃え版 (topY から下に伸びる)。行数を返す。
function wrapJPTextTop(ctx, text, x, topY, maxWidth, lineHeight) {
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
  lines.forEach((l, i) => ctx.fillText(l, x, topY + i * lineHeight));
  return lines.length;
}

async function generateShareCanvas(format = 'square') {
  const { code, clarity } = computeResult();
  const t = types[code];
  const group = code.substring(0, 2);
  const subGroup = code.substring(2, 4);
  const gc = getGroupColors()[group];

  // Canvas 描画で使う色は CSS 変数 (palette) から読む
  const P = {
    bg:        cssVar('--bg',         '#0a0618'),
    accent:    cssVar('--accent',     '#ff2e6b'),
    gold:      cssVar('--gold',       '#ffe63a'),
    poleLeft:  cssVar('--pole-left',  '#ff1a6b'),
    poleRight: cssVar('--pole-right', '#00eaff'),
    text:      cssVar('--text',       '#faf8ff'),
    muted:     cssVar('--muted',      '#9388b8'),
  };

  const isPortrait = format === 'portrait';
  const W = 1080;
  const H = isPortrait ? 1920 : 1080;

  // カード (結果情報が入る領域)
  // 縦長では上端寄せで高さ控えめ → 下の share sections に余白を譲る
  const cardX = isPortrait ? 40 : 36;
  const cardY = isPortrait ? 40 : 36;
  const cardW = W - cardX * 2;
  const cardH = isPortrait ? 518 : H - cardY * 2;
  const cardCx = W / 2;
  const cardCy = cardY + cardH / 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // iOS Safari 対策: Canvas 描画で使う全サイズを事前ロード
  // document.fonts.load() は指定サイズ/ファミリ組合せをブラウザに明示して読ませる
  await document.fonts.ready;
  const fontSpecs = [
    '64px "Rampart One"',
    '240px "Rampart One"',
    '720px "Rampart One"',
    '92px "Rampart One"',
    '15px "RocknRoll One"',
    '18px "RocknRoll One"',
    '20px "RocknRoll One"',
    '22px "RocknRoll One"',
    'bold 72px "Zen Maru Gothic"',
    '26px "Zen Maru Gothic"',
  ];
  await Promise.all(
    fontSpecs.map((spec) => document.fonts.load(spec, 'あA漢').catch(() => {}))
  );
  // iOS の描画キャッシュが落ち着くのを待つ (double rAF)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // ---- Background ----
  ctx.fillStyle = P.bg;
  ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(W * 0.18, H * 0.08, 0, W * 0.18, H * 0.08, W * 0.8);
  g1.addColorStop(0, hexToRgba(P.accent, 0.28));
  g1.addColorStop(0.55, hexToRgba(P.bg, 0));
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W * 0.85, H * 0.95, 0, W * 0.85, H * 0.95, W * 0.8);
  g2.addColorStop(0, hexToRgba(P.poleRight, 0.22));
  g2.addColorStop(0.55, hexToRgba(P.bg, 0));
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // ---- Grid pattern ----
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexToRgba(P.accent, 0.05);
  for (let x = 0; x <= W; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba(P.poleRight, 0.05);
  for (let y = 0; y <= H; y += 54) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ---- Sigil watermark (本人固有の4軸シンボル) ----
  // カード枠の下、テキストの背後に単色で描く。本人固有の指紋として機能する。
  // clarity が1未満でも見栄えするよう、カード内ギリギリまでmaxRを取る
  drawSigil(ctx, cardCx, cardCy, code, clarity, {
    maxR:      Math.min(cardW, cardH) * 0.47,
    color:     gc.main,
    fillAlpha: 0.32,
    glowBlur:  isPortrait ? 40 : 56,
  });

  // ---- Card border ----
  ctx.save();
  ctx.strokeStyle = gc.main;
  ctx.lineWidth = 6;
  ctx.shadowColor = gc.main;
  ctx.shadowBlur = 30;
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.stroke();
  ctx.restore();

  // ---- Type stamp (カード右上) ----
  ctx.save();
  const stampR = 84;
  const stampCx = cardX + cardW - 124;
  const stampCy = cardY + (isPortrait ? 110 : 132);
  // Filled tinted circle
  ctx.fillStyle = hexToRgba(gc.main, 0.12);
  ctx.beginPath();
  ctx.arc(stampCx, stampCy, stampR, 0, Math.PI * 2);
  ctx.fill();
  // Double ring (outer + inner) with glow
  ctx.shadowColor = gc.main;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = gc.main;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(stampCx, stampCy, stampR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(stampCx, stampCy, stampR - 10, 0, Math.PI * 2);
  ctx.stroke();
  // Rotated kanji inside
  ctx.translate(stampCx, stampCy);
  ctx.rotate((-14 * Math.PI) / 180);
  ctx.font = '92px "Rampart One"';
  ctx.fillStyle = gc.main;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = gc.main;
  ctx.shadowBlur = 16;
  ctx.fillText(t.symbol, 0, 4);
  ctx.restore();

  // ---- Brand mark (縦長ではカード内の上部に配置) ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '64px "Rampart One"';
  const brandDisplay = config.brand.name + (config.brand.accent || '');
  drawNeonText(ctx, brandDisplay, W / 2, isPortrait ? cardY + 40 : 116, P.accent, P.gold, 4);
  ctx.font = '15px "RocknRoll One"';
  ctx.fillStyle = P.poleRight;
  ctx.shadowColor = P.poleRight;
  ctx.shadowBlur = 10;
  ctx.fillText(config.brand.subtitle, W / 2, isPortrait ? cardY + 134 : 210);
  ctx.restore();

  // ---- Big code ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${isPortrait ? 200 : 240}px "Rampart One"`;
  drawNeonText(ctx, code, W / 2, isPortrait ? cardY + 270 : 420, gc.main, P.gold, 6);
  ctx.restore();

  // ---- Type name ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${isPortrait ? 60 : 72}px "Zen Maru Gothic"`;
  ctx.fillStyle = P.gold;
  ctx.shadowColor = P.gold;
  ctx.shadowBlur = 22;
  ctx.fillText(t.name, W / 2, isPortrait ? cardY + 435 : 650);
  ctx.restore();

  // ---- Tagline (wrapped) — 正方形のみ ----
  if (!isPortrait) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '26px "Zen Maru Gothic"';
    ctx.fillStyle = P.muted;
    wrapJPText(ctx, t.tagline, W / 2, 750, W - 180, 44);
    ctx.restore();
  }

  // ---- Group tags — 正方形のみ ----
  if (!isPortrait && config.groups.enabled) {
    const g1n = config.groups.primary[group];
    const s1n = config.groups.sub[subGroup];
    if (g1n) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '22px "RocknRoll One"';
      ctx.fillStyle = gc.main;
      ctx.shadowColor = gc.main;
      ctx.shadowBlur = 14;
      ctx.fillText(`${code[0]} × ${code[1]}  ${g1n.ja} / ${g1n.en}`, W / 2, 880);
      ctx.restore();
    }
    if (s1n) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '20px "RocknRoll One"';
      ctx.fillStyle = hexToRgba(P.text, 0.75);
      ctx.shadowColor = hexToRgba(P.text, 0.3);
      ctx.shadowBlur = 6;
      ctx.fillText(`${code[2]} × ${code[3]}  ${s1n.ja} / ${s1n.en}`, W / 2, 924);
      ctx.restore();
    }
  }

  // ---- Portrait-only: シェア用セクション (カード下部) ----
  if (isPortrait) {
    let y = cardY + cardH + 70;
    const shareSecs = config.shareSections || [];
    for (const s of shareSecs) {
      const body = t[s.key];
      if (!body) continue;
      // 見出し
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '30px "RocknRoll One"';
      ctx.fillStyle = P.gold;
      ctx.shadowColor = P.gold;
      ctx.shadowBlur = 14;
      ctx.fillText(s.title, W / 2, y);
      ctx.restore();
      y += 62;
      // 本文
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '32px "Zen Maru Gothic"';
      ctx.fillStyle = P.text;
      ctx.shadowColor = hexToRgba(P.text, 0.25);
      ctx.shadowBlur = 6;
      const plain = String(body).replace(/<[^>]+>/g, '').replace(/\n+/g, ' ').trim();
      const lineCount = wrapJPTextTop(ctx, plain, W / 2, y, W - 140, 52);
      ctx.restore();
      y += lineCount * 52 + 50;
    }
  }

  // ---- Footer (hashtag) ----
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '18px "RocknRoll One"';
  ctx.fillStyle = hexToRgba(P.muted, 0.8);
  ctx.fillText(config.brand.hashtag, W / 2, isPortrait ? 1870 : 990);
  ctx.restore();

  return canvas;
}

let shareBlob = null;
let currentShareFormat = 'square';

async function regenerateSharePreview() {
  const img = document.getElementById('share-image');
  const preview = document.querySelector('.share-preview');
  preview.classList.remove('ready');
  img.removeAttribute('src');
  try {
    const canvas = await generateShareCanvas(currentShareFormat);
    img.src = canvas.toDataURL('image/png');
    preview.classList.add('ready');
    canvas.toBlob((blob) => { shareBlob = blob; }, 'image/png');
  } catch (e) {
    console.error('share image generation failed', e);
  }
}

async function openShareModal() {
  document.getElementById('share-modal').hidden = false;
  await regenerateSharePreview();
}

function closeShareModal() {
  document.getElementById('share-modal').hidden = true;
}

async function downloadShare() {
  if (!shareBlob) return;
  const { code } = computeResult();
  const suffix = currentShareFormat === 'portrait' ? '_9x16' : '_1x1';
  const filename = `${config.brand.name}_${code}${suffix}.png`;
  const btn = document.getElementById('share-download');

  // iOS のみ: ネイティブ共有シート (Photos に保存 等を選択可) を優先。
  // それ以外は素直に <a download> にフォールバック。
  // 注: iPadOS 13+ は userAgent が Mac を名乗るので maxTouchPoints も見る。
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const file = new File([shareBlob], filename, { type: 'image/png' });
  if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${config.brand.name} — ${code}`,
      });
      return;  // ユーザーが共有シートで何か選んだ (または保存した)
    } catch (err) {
      // キャンセルは何もしない
      if (err && err.name === 'AbortError') return;
      // それ以外はフォールバックへ
    }
  }

  // フォールバック: 従来の <a download> クリック (PC/非対応ブラウザ)
  const url = URL.createObjectURL(shareBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // 視覚フィードバック (黙って保存される環境向け)
  if (btn && !btn.dataset.feedback) {
    btn.dataset.feedback = '1';
    const orig = btn.textContent;
    btn.textContent = '✓ 保存しました';
    btn.classList.add('btn-feedback');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('btn-feedback');
      delete btn.dataset.feedback;
    }, 1800);
  }
}

// ========== Boot ==========

document.getElementById('btn-start').addEventListener('click', startWithDrama);
document.getElementById('btn-back').addEventListener('click', back);
document.getElementById('btn-restart').addEventListener('click', restart);
document.getElementById('btn-back-to-mine').addEventListener('click', () => {
  renderResult();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById('btn-share').addEventListener('click', openShareModal);
document.getElementById('share-close').addEventListener('click', closeShareModal);
document.getElementById('share-backdrop').addEventListener('click', closeShareModal);
document.getElementById('share-download').addEventListener('click', downloadShare);

// シェア画像フォーマット切替タブ
document.querySelectorAll('.share-format-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const format = btn.dataset.format;
    if (format === currentShareFormat) return;
    currentShareFormat = format;
    document.querySelectorAll('.share-format-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.format === format);
    });
    regenerateSharePreview();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('share-modal').hidden) closeShareModal();
});
