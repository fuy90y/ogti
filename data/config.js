// 4軸16タイプ診断フレームワーク — 設定
// 診断ごとの可変項目はすべてここに集約。大きいデータは別ファイル:
//   - questions.js  全設問
//   - types.js      16タイプの定義 (symbol / name / tagline / strength / weakness / partner)

export const config = {
  // ---- ブランド ----
  brand: {
    name: 'OGTI',                      // 大タイトル
    accent: '.',                       // タイトル末尾の装飾 (空文字OK)
    subtitle: 'OOGIRI TYPE INDICATOR', // サブタイトル
    fullName: '大喜利タイプ診断',      // フッター等で使う長い名前
    hashtag: '#OGTI診断',              // シェア用ハッシュタグ
  },

  // ---- ページメタ (title / description) ----
  meta: {
    title: 'OGTI — 大喜利タイプ診断',
    description: 'Oogiri Type Indicator — 4軸16タイプで、あなたの大喜利の流儀を診断します。',
  },

  // ---- ランディング画面のコピー ----
  landing: {
    // 2段落構成。HTMLタグ (strong等) 使用可
    lead: [
      'OGTI は、あなたの<strong>大喜利の流儀</strong>を4軸16タイプで診断します。',
      '全20問。お題と回答を読み、どちら寄りかを 6段階で選んでください。',
    ],
    axesHeading: '大喜利の流儀 4つの軸',
    startButton: '診断を始める',
  },

  // ---- ドラムロール (診断開始時の演出) ----
  drumroll: {
    line1: '続いてのお題は、',
    line2: 'こちら！',
  },

  // ---- 4軸の定義 ----
  // 順番は固定 (軸の組み合わせが タイプコード [左1][左2][左3][左4] を作る)。
  // pole は1文字、label は英字ポール名 (頭文字がタイプコードで使われる)、ja は日本語ポール名。
  // title は軸自体の名前 (ランディングの矢印バッジと結果画面の軸タイトルで使用)。
  axes: [
    {
      key: 'AE',
      title: { en: 'NERVE', ja: '度胸' },
      left:  { pole: 'A', label: 'Aggressive',  ja: '挑戦' },
      right: { pole: 'E', label: 'Elegant',     ja: '洗練' },
    },
    {
      key: 'UR',
      title: { en: 'LENS', ja: '視座' },
      left:  { pole: 'U', label: 'Unique',      ja: '独自' },
      right: { pole: 'R', label: 'Relatable',   ja: '共感' },
    },
    {
      key: 'PI',
      title: { en: 'PULSE', ja: '拍子' },
      left:  { pole: 'P', label: 'Playful',     ja: '剽軽' },
      right: { pole: 'I', label: 'Intelligent', ja: '知性' },
    },
    {
      key: 'TD',
      title: { en: 'VOICE', ja: '語り口' },
      left:  { pole: 'T', label: 'Theatrical',  ja: '演技' },
      right: { pole: 'D', label: 'Descriptive', ja: '解説' },
    },
  ],

  // ---- グループシステム (オプショナル) ----
  // enabled: false にすると結果画面からグループ名が消える。
  // primary はタイプコードの先頭2文字 (4通り)、sub は後半2文字 (4通り)。
  groups: {
    enabled: true,
    primary: {
      AU: { ja: '狂騒派', en: 'WILD'    },
      AR: { ja: '熱血派', en: 'FERVENT' },
      EU: { ja: '幽玄派', en: 'MYSTIC'  },
      ER: { ja: '正統派', en: 'CLASSIC' },
    },
    sub: {
      PT: { ja: '踊り手', en: 'DANCER'   },
      PD: { ja: '射撃手', en: 'SHOOTER'  },
      IT: { ja: '演者',   en: 'ACTOR'    },
      ID: { ja: '観察者', en: 'OBSERVER' },
    },
  },

  // ---- 結果画面のテキストセクション ----
  // key は types.js の各タイプオブジェクトのフィールド名と一致させる。
  // 配列の順番が表示順 = セクションの追加・削除・並び替えはここで完結。
  sections: [
    { key: 'strength', title: 'ハマったときの強み' },
    { key: 'weakness', title: '滑るときの癖' },
    { key: 'partner',  title: '相性の良い相方' },
  ],

  // ---- 利用規約ページ用の情報 ----
  ownership: {
    orgName:      'OGTI 運営 (個人)',                                     // 規約表示の運営者名
    contactLabel: 'GitHub リポジトリの Issues',                           // 連絡先リンクの表示テキスト
    contactUrl:   'https://github.com/carrot-launcher/ogti/issues',       // 連絡先リンクの href
    lastUpdated:  '2026-04-21',                                           // 規約の最終更新日
  },
};
