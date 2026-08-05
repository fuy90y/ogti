// 設問データ
//
// axis:         1〜4 (config.axes の index + 1)。どの軸の設問かを示す。
// prompt:       設問文
// choices:      左右2つの選択肢。
// choices[].pole: その選択肢が支持する極のキー (config.axes の left.pole / right.pole と一致)
// choices[].text: 選択肢の本文
//
// ⚠️ 各軸の設問数は **奇数** にすること。
//    奇数個 × 奇数(strength)の和 = 奇数 ≠ 0 のため、引き分けが数学的に発生しない。
//    軸ごとに 5問 / 7問 のように揃える必要はないが、それぞれ奇数であること。
//    偶数にすると起動時にコンソール警告が出る。

export const questions = [
  // --- 軸1: Aggressive(A) vs Elegant(E) ---
  {
    axis: 1,
    prompt: 'お題: 「紙飛行機に乗ってきた人」。近いのはどっち？',
    choices: [
      { pole: 'A', text: '中身がペラペラの男' },
      { pole: 'E', text: 'ペーパードライバーを自称する' },
    ],
  },
  {
    axis: 1,
    prompt: 'お題: 「キモバトル漫画で最も綺麗な超能力とは？」。書くならどっち？',
    choices: [
      { pole: 'A', text: '内股のほうが速い' },
      { pole: 'E', text: '日付変更線を直線にする' },
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
    prompt: 'あなたが大喜利を厳しく講評するとして、言うのは？',
    choices: [
      { pole: 'A', text: '「…これを書こうと思った瞬間を、まず恥じなさい」' },
      { pole: 'E', text: '「巧い。巧いが、昨日もどこかで聞いた気がしますね」' },
    ],
  },
{
    axis: 1,
    prompt: 'お題をもらったとき、最初にやることは？',
    choices: [
      { pole: 'A', text: 'とにかく何か出す' },
      { pole: 'E', text: '頭の中で整理する' },
    ],
  },
  {
     axis: 1,
    prompt: '滑ったとき、どう感じる？',
    choices: [
      { pole: 'A', text: '次で取り返せばいい' },
      { pole: 'E', text: 'なぜ滑ったか分析する' },
    ],
  },
  
  // --- 軸2: Unique(U) vs Relatable(R) ---
  {
    axis: 2,
    prompt: 'お題: 「サラリーマンの新しい朝の習慣」。書きたいのは？',
    choices: [
      { pole: 'R', text: '「リーマン？」と鏡に問う' },
      { pole: 'U', text: '朝𰻞(朝にビャンビャン麺を浴びるように吸い上げるさま)' },
    ],
  },
  {
    axis: 2,
    prompt: '客から欲しい反応は？',
    choices: [
      { pole: 'R', text: '「たしかに！」という共感の笑い' },
      { pole: 'U', text: '「なんやそれ！」という驚きの笑い' },
    ],
  },
  {
    axis: 2,
    prompt: 'お題: 「学校の七不思議」。書くならどっち？',
    choices: [
      { pole: 'R', text: '牛乳でお米を食えたこと' },
      { pole: 'U', text: '理系のハムスターが肉みたいに泳いでた' },
    ],
  },
  {
    axis: 2,
    prompt: '限られた人にしか通じないマニアックなネタを仕込むことについて',
    choices: [
      { pole: 'R', text: '避ける。全員に届くほうが強い' },
      { pole: 'U', text: '入れる。刺さる人に刺さればいい' },
    ],
  },
  {
    axis: 2,
    prompt: 'お題: 「辞書に新しく載りそうな見出し語」。書きたいのは？',
    choices: [
      { pole: 'R', text: '「冤会」誰も悪くないのに空気が悪い食事会' },
      { pole: 'U', text: '「※※CLUB」注意して浪漫飛行する' },
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
      { pole: 'P', text: 'ホリデー記念日' },
      { pole: 'I', text: 'みどりの日があおの日にもなる' },
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
      { pole: 'P', text: 'インパクトのある3～9文字' },
      { pole: 'I', text: '丁寧に構築された9～15文字' },
    ],
  },
  {
    axis: 3,
    prompt: 'お題: 「詩人とシジミの違いを教えてください」。書きたいのは？',
    choices: [
      { pole: 'P', text: '詩人を見た私→しみじみ…　シジミを見た俺→シジミ' },
      { pole: 'I', text: '砂を握るか砂を抜くか' },
    ],
  },

  // --- 軸4: Theatrical(T) vs Descriptive(D) ---
  {
    axis: 4,
    prompt: 'お題: 「こんなスーパーの店員は嫌だ」。近いのは？',
    choices: [
      { pole: 'T', text: '「次のboy？ほうら、こちらへ」' },
      { pole: 'D', text: '客の鼻歌に乗っかる' },
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
    prompt: 'ドラゴンに挑むおばさん',
    choices: [
      { pole: 'T', text: '今夜はワイルドな角煮が作れそうね' },
      { pole: 'D', text: '逆鱗を正しい向きに戻す' },
    ],
  },
  {
    axis: 4,
    prompt: '長文回答のとき、どうボケる？',
    choices: [
      { pole: 'T', text: '語り口で引き込む' },
      { pole: 'D', text: '情報量で押し切る' },
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
    prompt: 'お題: 「魔法の町で浮いてる人」。書くならどっち？',
    choices: [
      { pole: 'T', text: '「俺なら混ぜるけどな」' },
      { pole: 'D', text: '褒めるときに杖向ける' },
    ],
  },
];
