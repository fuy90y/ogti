// OGTI 設問データ
// axis: 1=A/E, 2=U/R, 3=P/I, 4=T/D
// choices[].pole: 選んだときに加算される極 (A/E/U/R/P/I/T/D)

export const questions = [
  // --- 軸1: Aggressive(A) vs Elegant(E) ---
  {
    axis: 1,
    prompt: 'お題: 「こんな葬式は嫌だ」。近いのはどっち？',
    choices: [
      { pole: 'A', text: '故人が薄目を開けて「チッ、遅かったか」とつぶやく' },
      { pole: 'E', text: '焼香の灰が、なぜかキラキラ光っている' },
    ],
  },
  {
    axis: 1,
    prompt: 'お題: 「ダメな魔法使いが使える唯一の魔法」。書くならどっち？',
    choices: [
      { pole: 'A', text: '他人の冷蔵庫の牛乳を、ほんの少しだけ腐らせる' },
      { pole: 'E', text: 'ペットボトルのフタが、もう一段階だけ緩む' },
    ],
  },
  {
    axis: 1,
    prompt: '最高の大喜利とは？',
    choices: [
      { pole: 'A', text: '会場が一瞬ざわつく、攻めた一言' },
      { pole: 'E', text: '会場が上品に「うまい」と笑う、切れ味の一言' },
    ],
  },
  {
    axis: 1,
    prompt: '滑るなら、どっちのほうがマシ？',
    choices: [
      { pole: 'A', text: '踏み込みすぎて沈黙が走るほう' },
      { pole: 'E', text: '無難すぎて反応が薄いほう' },
    ],
  },
  {
    axis: 1,
    prompt: 'お題: 「厳しい審査員がする大喜利の講評」。書きたいのは？',
    choices: [
      { pole: 'A', text: '「…これを書こうと思った瞬間を、まず恥じなさい」' },
      { pole: 'E', text: '「巧い。巧いが、昨日もどこかで聞いた気がしますね」' },
    ],
  },

  // --- 軸2: Unique(U) vs Relatable(R) ---
  {
    axis: 2,
    prompt: 'お題: 「サラリーマンの新しい朝の習慣」。書きたいのは？',
    choices: [
      { pole: 'R', text: '歯を磨きながら、スマホで上司のつぶやきをチェック' },
      { pole: 'U', text: '体内にいる小さな哲学者に、本日の意義を問う' },
    ],
  },
  {
    axis: 2,
    prompt: '客から欲しい反応は？',
    choices: [
      { pole: 'R', text: '「たしかに！」という共感の笑い' },
      { pole: 'U', text: '「なんやそれ！」というざわめき' },
    ],
  },
  {
    axis: 2,
    prompt: 'お題: 「学校の七不思議」。書くならどっち？',
    choices: [
      { pole: 'R', text: '三番目のトイレのドアだけ、なぜか開かない' },
      { pole: 'U', text: '校長の影だけが、常に西の方角へ伸びている' },
    ],
  },
  {
    axis: 2,
    prompt: '自分にしか通じないマニアックなネタを仕込むことについて',
    choices: [
      { pole: 'R', text: '避ける。全員に届くほうが強い' },
      { pole: 'U', text: '入れる。刺さる人に刺さればいい' },
    ],
  },
  {
    axis: 2,
    prompt: 'お題: 「辞書に新しく載りそうな見出し語」。書きたいのは？',
    choices: [
      { pole: 'R', text: '月曜倦怠感 (つきようけんたいかん)' },
      { pole: 'U', text: '雨乞いの後悔 (あまごいのこうかい)' },
    ],
  },

  // --- 軸3: Playful(P) vs Intelligent(I) ---
  {
    axis: 3,
    prompt: 'ダジャレ・語呂・リズムで笑いを取ることについて',
    choices: [
      { pole: 'P', text: '強力な武器。笑いに貴賎なし' },
      { pole: 'I', text: '最終手段。できれば使いたくない' },
    ],
  },
  {
    axis: 3,
    prompt: 'お題: 「新しい国民の祝日」。書くならどっち？',
    choices: [
      { pole: 'P', text: 'ズボン前後逆の日' },
      { pole: 'I', text: '自分が他人だったら記念日' },
    ],
  },
  {
    axis: 3,
    prompt: '理想の笑いの速度は？',
    choices: [
      { pole: 'P', text: '一読してすぐ笑える、瞬発力のあるほう' },
      { pole: 'I', text: '一呼吸おいて「あっ」と気づく、構造の笑い' },
    ],
  },
  {
    axis: 3,
    prompt: '好きな回答の長さは？',
    choices: [
      { pole: 'P', text: '短くて勢いのある一言' },
      { pole: 'I', text: '丁寧に構築された一文' },
    ],
  },
  {
    axis: 3,
    prompt: 'お題: 「絶対に実用化されない、ひみつ道具」。書きたいのは？',
    choices: [
      { pole: 'P', text: 'だんだん薄くなる毛布' },
      { pole: 'I', text: 'やる気スイッチを押すとやる気がなくなる装置' },
    ],
  },

  // --- 軸4: Theatrical(T) vs Descriptive(D) ---
  {
    axis: 4,
    prompt: 'お題: 「こんな店員は嫌だ」。近いのは？',
    choices: [
      { pole: 'T', text: '(店員として)「あっ…あの…はい…あの…はい…」' },
      { pole: 'D', text: 'レジを打つたびに「行きます！」と叫ぶ店員' },
    ],
  },
  {
    axis: 4,
    prompt: '写真で一言のとき、書きたくなるのは？',
    choices: [
      { pole: 'T', text: '被写体になりきってのセリフ' },
      { pole: 'D', text: '状況を言い当てる描写ボケ' },
    ],
  },
  {
    axis: 4,
    prompt: '自分の回答に出やすい癖は？',
    choices: [
      { pole: 'T', text: '語尾・口調・セリフでなりきってしまう' },
      { pole: 'D', text: '外から状況を淡々と描写してしまう' },
    ],
  },
  {
    axis: 4,
    prompt: '好きな芸人のタイプは？',
    choices: [
      { pole: 'T', text: '舞台で動いて演じる身体派' },
      { pole: 'D', text: 'トークで聞かせる語り派' },
    ],
  },
  {
    axis: 4,
    prompt: 'お題: 「街で見かけた不思議な人」。書くならどっち？',
    choices: [
      { pole: 'T', text: '(その人として)「あ、この道、人類初でしたっけ？」' },
      { pole: 'D', text: '信号が青なのに、振り返って後方確認を3回する男' },
    ],
  },
];
