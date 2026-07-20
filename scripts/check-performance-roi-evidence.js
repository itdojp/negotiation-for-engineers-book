#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const paths = {
  introduction: 'docs/introduction/index.md',
  introductionMirror: 'src/introduction/index.md',
  introductionDraft: 'negotiation-introduction.md',
  chapter1: 'docs/chapter-1/index.md',
  chapter1Mirror: 'src/chapter-1/index.md',
  chapter1Draft: 'negotiation-chapter-1.md',
  chapter4: 'docs/chapter-4/index.md',
  chapter4Mirror: 'src/chapter-4/index.md',
  chapter4Draft: 'negotiation-chapter-4.md',
  worksheet: 'docs/appendices/analysis/roi-calculation.md',
  package: 'package.json',
  workflow: '.github/workflows/book-qa.yml',
};

function read(relPath) {
  try {
    return fs.readFileSync(path.join(root, relPath), 'utf8');
  } catch (error) {
    throw new Error(`failed to read required performance/ROI evidence input: ${relPath}: ${error.message}`, { cause: error });
  }
}

function count(text, needle) {
  return needle ? text.split(needle).length - 1 : 0;
}

function decodeHtml(text) {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function loadSourceState() {
  return {
    mode: 'source',
    introduction: read(paths.introduction),
    introductionMirror: read(paths.introductionMirror),
    introductionDraft: read(paths.introductionDraft),
    chapter1: read(paths.chapter1),
    chapter1Mirror: read(paths.chapter1Mirror),
    chapter1Draft: read(paths.chapter1Draft),
    chapter4: read(paths.chapter4),
    chapter4Mirror: read(paths.chapter4Mirror),
    chapter4Draft: read(paths.chapter4Draft),
    worksheet: read(paths.worksheet),
    packageJson: JSON.parse(read(paths.package)),
    workflow: read(paths.workflow),
  };
}

function loadBuiltState(siteDir) {
  const absolute = path.resolve(root, siteDir);
  const builtRead = (relPath) => {
    const target = path.join(absolute, relPath);
    try {
      return fs.readFileSync(target, 'utf8');
    } catch (error) {
      throw new Error(`failed to read built performance/ROI evidence page: ${target}: ${error.message}`, { cause: error });
    }
  };
  return {
    mode: 'built',
    introduction: decodeHtml(builtRead('introduction/index.html')),
    chapter1: decodeHtml(builtRead('chapter-1/index.html')),
    chapter4: decodeHtml(builtRead('chapter-4/index.html')),
    worksheet: decodeHtml(builtRead('appendices/analysis/roi-calculation/index.html')),
    worksheetHtml: builtRead('appendices/analysis/roi-calculation/index.html'),
  };
}

function approx(actual, expected, tolerance = 1e-9) {
  return Math.abs(actual - expected) <= tolerance;
}

function validateCalculations() {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };

  const base = { traffic: 1_000_000, exposure: 0.8, conversion: 0.02, grossProfit: 3_000, months: 12, investment: 12_000_000 };
  const performanceScenarios = [
    { name: '悲観', uplift: 0, conversions: 0, benefit: 0, net: -12_000_000, roi: -1 },
    { name: '中位', uplift: 0.02, conversions: 320, benefit: 11_520_000, net: -480_000, roi: -0.04 },
    { name: '楽観', uplift: 0.05, conversions: 800, benefit: 28_800_000, net: 16_800_000, roi: 1.4 },
  ];
  for (const scenario of performanceScenarios) {
    const conversions = base.traffic * base.exposure * base.conversion * scenario.uplift;
    const benefit = conversions * base.grossProfit * base.months;
    const net = benefit - base.investment;
    check(approx(conversions, scenario.conversions), `Chapter 1 ${scenario.name} monthly conversions calculation drifted`);
    check(approx(benefit, scenario.benefit), `Chapter 1 ${scenario.name} benefit calculation drifted`);
    check(approx(net, scenario.net), `Chapter 1 ${scenario.name} net benefit calculation drifted`);
    check(approx(net / base.investment, scenario.roi), `Chapter 1 ${scenario.name} ROI calculation drifted`);
  }

  const pools = { productivity: 2.4, incident: 0.6, churn: 1.5, investment: 2.5, years: 3 };
  const debtScenarios = [
    { name: '悲観', rates: [0.2, 0.25, 0.1], annual: 0.78, benefit: 2.34, net: -0.16, roi: -0.064 },
    { name: '中位', rates: [0.4, 0.5, 0.25], annual: 1.635, benefit: 4.905, net: 2.405, roi: 0.962 },
    { name: '楽観', rates: [0.6, 0.75, 0.4], annual: 2.49, benefit: 7.47, net: 4.97, roi: 1.988 },
  ];
  for (const scenario of debtScenarios) {
    const annual = pools.productivity * scenario.rates[0] + pools.incident * scenario.rates[1] + pools.churn * scenario.rates[2];
    const benefit = annual * pools.years;
    const net = benefit - pools.investment;
    check(approx(annual, scenario.annual), `Chapter 4 ${scenario.name} annual benefit calculation drifted`);
    check(approx(benefit, scenario.benefit), `Chapter 4 ${scenario.name} three-year benefit calculation drifted`);
    check(approx(net, scenario.net), `Chapter 4 ${scenario.name} net benefit calculation drifted`);
    check(approx(net / pools.investment, scenario.roi), `Chapter 4 ${scenario.name} ROI calculation drifted`);
  }
  return failures;
}

function validateContent(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const requireOnce = (text, marker, label) => {
    const found = count(text, marker);
    check(found === 1, `${label} must appear exactly once (found ${found})`);
  };

  const introductions = state.mode === 'source'
    ? [
      ['published introduction', state.introduction],
      ['source introduction', state.introductionMirror],
      ['detailed introduction draft', state.introductionDraft],
    ]
    : [['built introduction', state.introduction]];
  for (const [label, text] of introductions) {
    requireOnce(text, '検証可能な仮説', `${label}: hypothesis boundary`);
    check(text.includes('悲観・中位・楽観の幅と検証計画'), `${label} must require a scenario range and validation plan`);
  }

  const chapter1s = state.mode === 'source'
    ? [
      ['published Chapter 1', state.chapter1],
      ['source Chapter 1', state.chapter1Mirror],
      ['detailed Chapter 1 draft', state.chapter1Draft],
    ]
    : [['built Chapter 1', state.chapter1]];
  for (const [label, text] of chapter1s) {
    const markers = [
      '相対2%向上は2.04%',
      '価格、campaign、在庫、流入元、UI変更、季節性',
      '単一点ではなくrange、guardrail、停止条件',
    ];
    if (state.mode === 'source') markers.push(
      '### 性能から粗利までの因果境界',
      '### 架空ケース：100ms改善を3 scenarioで評価する',
      '| 悲観 | 0% | 0件 | 0円 | -1,200万円 | -100% | 回収不能 |',
      '| 中位 | 2% | 320件 | 1,152万円 | -48万円 | -4% | 約12.5か月 |',
      '| 楽観 | 5% | 800件 | 2,880万円 | 1,680万円 | 140% | 約5.0か月 |',
      '`100ms = conversion 1%低下`という普遍的な因果係数を示していない',
    );
    else markers.push(
      '性能から粗利までの因果境界',
      '架空ケース：100ms改善を3 scenarioで評価する',
      '悲観 0% 0件 0円 -1,200万円 -100% 回収不能',
      '中位 2% 320件 1,152万円 -48万円 -4% 約12.5か月',
      '楽観 5% 800件 2,880万円 1,680万円 140% 約5.0か月',
      '100ms = conversion 1%低下 という普遍的な因果係数を示していない',
    );
    for (const marker of markers) check(text.includes(marker), `${label} is missing contract marker: ${marker}`);
  }

  const chapter4s = state.mode === 'source'
    ? [
      ['published Chapter 4', state.chapter4],
      ['source Chapter 4', state.chapter4Mirror],
      ['detailed Chapter 4 draft', state.chapter4Draft],
    ]
    : [['built Chapter 4', state.chapter4]];
  for (const [label, text] of chapter4s) {
    const markers = [
      'まず総投資額に含まれる計測・pilot枠を上限2,000万円として承認',
      '効果が悲観scenarioを下回る、または帰属を説明できない場合は拡大を停止',
    ];
    if (state.mode === 'source') markers.push(
      '## 架空ケース：技術的負債解消の投資提案',
      '**架空のモデルケース**',
      '| **合計** | 各項目が重複しないことを要確認 | 2.4 + 0.6 + 1.5 | **4.5億円** |',
      '| 悲観 | 2.34億円 | -0.16億円 | -6.4% | 約38.5か月 |',
      '| 中位 | 4.905億円 | 2.405億円 | 96.2% | 約18.3か月 |',
      '| 楽観 | 7.47億円 | 4.97億円 | 198.8% | 約12.0か月 |',
    );
    else markers.push(
      '架空ケース：技術的負債解消の投資提案',
      '架空のモデルケース',
      '合計 各項目が重複しないことを要確認 2.4 + 0.6 + 1.5 4.5億円',
      '悲観 2.34億円 -0.16億円 -6.4% 約38.5か月',
      '中位 4.905億円 2.405億円 96.2% 約18.3か月',
      '楽観 7.47億円 4.97億円 198.8% 約12.0か月',
    );
    for (const marker of markers) check(text.includes(marker), `${label} is missing contract marker: ${marker}`);
  }

  const worksheetMarkers = [
    '月間対象session',
    'baseline conversion',
    '1 conversion当たり粗利',
    '評価月数',
    '悲観・中位・楽観の全入力',
    '37ブランド、約3,000万session、4週間',
    '自然発生した速度変動をlogarithmic regressionで分析',
    '0.1秒は4つの速度指標の累積改善',
    '支持しない範囲',
    '第1章の3 scenarioと第4章の技術的負債ケースは、式と差し替え手順を説明するための架空値',
    'S-122-02の架空仮定',
  ];
  worksheetMarkers.push(...(state.mode === 'source'
    ? ['## 7. 性能改善を収益へ換算するworksheet', '## 8. Source Notes：性能・conversion・ROI']
    : ['7. 性能改善を収益へ換算するworksheet', '8. Source Notes：性能・conversion・ROI']));
  for (const marker of worksheetMarkers) check(state.worksheet.includes(marker), `ROI worksheet is missing contract marker: ${marker}`);

  const forbidden = [
    '100ms遅延 = 1%低下',
    'Googleの研究：100ms遅延で1%のコンバージョン率低下',
    'コンバージョン率が3%向上し、年間売上が1,000万円増加する',
    '3年間ROI: 548%',
    'ミリ秒の改善が売上に直結',
  ];
  const publicTexts = [state.introduction, state.chapter1, state.chapter4];
  if (state.mode === 'source') publicTexts.push(
    state.introductionMirror,
    state.introductionDraft,
    state.chapter1Mirror,
    state.chapter1Draft,
    state.chapter4Mirror,
    state.chapter4Draft,
  );
  for (const phrase of forbidden) {
    check(!publicTexts.some((text) => text.includes(phrase)), `obsolete universal/single-point claim must not be present: ${phrase}`);
  }

  if (state.mode === 'source') failures.push(...validateCalculations());
  if (state.mode === 'built') {
    check(state.worksheetHtml.includes('id="performance-roi-worksheet"'), 'built worksheet must preserve the performance-roi-worksheet anchor');
    check(state.worksheetHtml.includes('id="source-notes-performance-roi"'), 'built worksheet must preserve the Source Notes anchor');
    check(/href="[^"]*appendices\/analysis\/roi-calculation\/#performance-roi-worksheet"/.test(readBuiltChapterLinks()),
      'built chapters must link to the worksheet anchor');
  }
  return failures;
}

function readBuiltChapterLinks() {
  return [
    fs.readFileSync(path.join(currentBuiltSite, 'chapter-1/index.html'), 'utf8'),
    fs.readFileSync(path.join(currentBuiltSite, 'chapter-4/index.html'), 'utf8'),
  ].join('\n');
}

function validateWiring(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const scripts = state.packageJson.scripts || {};
  check(scripts['test:performance-roi'] === 'node scripts/check-performance-roi-evidence.js --self-test',
    'package must expose performance/ROI self-test');
  check(scripts['check:performance-roi'] === 'node scripts/check-performance-roi-evidence.js',
    'package must expose performance/ROI source check');
  check(typeof scripts.test === 'string' && scripts.test.includes('npm run test:performance-roi'),
    'npm test must run performance/ROI self-test');
  check(typeof scripts.test === 'string' && scripts.test.includes('npm run check:performance-roi'),
    'npm test must run performance/ROI source check');
  check(typeof scripts.build === 'string' && scripts.build.includes('check-performance-roi-evidence.js --built-site _site'),
    'npm build must run the built-site performance/ROI check');
  check(/- name: Check built performance and ROI evidence[\s\S]*?run:\s*node scripts\/check-performance-roi-evidence\.js --built-site _site/.test(state.workflow),
    'Book QA must run the built-site performance/ROI check');
  return failures;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mutateOnce(text, before, after, name) {
  if (!text.includes(before)) throw new Error(`self-test fixture not found: ${name}`);
  return text.replace(before, after);
}

function runSelfTest() {
  const baseline = loadSourceState();
  const initial = [...validateContent(baseline), ...validateWiring(baseline)];
  if (initial.length) throw new Error(`self-test baseline is invalid:\n- ${initial.join('\n- ')}`);

  const cases = [
    ['missing hypothesis boundary', 'introduction', '検証可能な仮説', '事業予測', 'hypothesis boundary'],
    ['missing scenario requirement', 'introductionMirror', '悲観・中位・楽観の幅と検証計画', '単一点の予測', 'scenario range'],
    ['detailed introduction drift', 'introductionDraft', '検証可能な仮説', '確定した売上効果', 'detailed introduction draft'],
    ['relative uplift ambiguity restored', 'chapter1', '相対2%向上は2.04%', '2%向上は4%', '相対2%向上は2.04%'],
    ['confounders omitted', 'chapter1Mirror', '価格、campaign、在庫、流入元、UI変更、季節性', '外部要因', '価格、campaign'],
    ['middle scenario drift', 'chapter1', '| 中位 | 2% | 320件 | 1,152万円 | -48万円 | -4% | 約12.5か月 |', '| 中位 | 2% | 3,200件 | 1億円 | 8,000万円 | 800% | 1か月 |', '中位'],
    ['detailed Chapter 1 drift', 'chapter1Draft', '| 楽観 | 5% | 800件 | 2,880万円 | 1,680万円 | 140% | 約5.0か月 |', '| 楽観 | 5% | 8,000件 | 10億円 | 9億円 | 900% | 1か月 |', 'detailed Chapter 1 draft'],
    ['universal rule restored', 'chapter1Mirror', '100ms改善を3 scenario', '100ms遅延 = 1%低下', 'obsolete universal'],
    ['fictional label removed', 'chapter4', '**架空のモデルケース**', '**導入事例**', '架空のモデルケース'],
    ['loss pool double-count gate removed', 'chapter4Mirror', '各項目が重複しないことを要確認', '合算値', '重複しない'],
    ['pessimistic ROI drift', 'chapter4', '| 悲観 | 2.34億円 | -0.16億円 | -6.4% | 約38.5か月 |', '| 悲観 | 2.34億円 | 5億円 | 200% | 2か月 |', '悲観'],
    ['detailed Chapter 4 drift', 'chapter4Draft', '| 中位 | 4.905億円 | 2.405億円 | 96.2% | 約18.3か月 |', '| 中位 | 4.905億円 | 10億円 | 500% | 2か月 |', 'detailed Chapter 4 draft'],
    ['full approval gate restored', 'chapter4Mirror', 'まず総投資額に含まれる計測・pilot枠を上限2,000万円として承認', '総投資額2.5億円を承認', '上限2,000万円'],
    ['worksheet traffic missing', 'worksheet', '月間対象session', '月間利用者', '月間対象session'],
    ['worksheet gross profit missing', 'worksheet', '1 conversion当たり粗利', '1注文当たり売上', '1 conversion当たり粗利'],
    ['Source Notes scope missing', 'worksheet', '37ブランド、約3,000万session、4週間', '多数のsite', '37ブランド'],
    ['four-metric boundary missing', 'worksheet', '0.1秒は4つの速度指標の累積改善', '0.1秒の改善', '4つの速度指標'],
    ['fictional source mapping missing', 'worksheet', '第1章の3 scenarioと第4章の技術的負債ケースは、式と差し替え手順を説明するための架空値', '第1章と第4章は外部benchmarkに基づく実測値', '架空値'],
  ];
  for (const [name, key, before, after, expected] of cases) {
    const mutated = clone(baseline);
    mutated[key] = mutateOnce(mutated[key], before, after, name);
    const failures = validateContent(mutated);
    if (!failures.some((failure) => failure.includes(expected))) {
      throw new Error(`self-test case did not fail as expected: ${name}\n${failures.join('\n')}`);
    }
  }

  const wiringCases = [
    ['missing source script', (state) => { delete state.packageJson.scripts['check:performance-roi']; }, 'source check'],
    ['missing self-test wiring', (state) => { state.packageJson.scripts.test = state.packageJson.scripts.test.replace('npm run test:performance-roi && ', ''); }, 'self-test'],
    ['missing built build wiring', (state) => { state.packageJson.scripts.build = state.packageJson.scripts.build.replace(' && node scripts/check-performance-roi-evidence.js --built-site _site', ''); }, 'npm build'],
    ['missing workflow built check', (state) => { state.workflow = state.workflow.replace('node scripts/check-performance-roi-evidence.js --built-site _site', 'echo skipped'); }, 'Book QA'],
  ];
  for (const [name, mutate, expected] of wiringCases) {
    const mutated = clone(baseline); mutate(mutated);
    const failures = validateWiring(mutated);
    if (!failures.some((failure) => failure.includes(expected))) {
      throw new Error(`self-test wiring case did not fail as expected: ${name}\n${failures.join('\n')}`);
    }
  }
  console.log(`OK: performance/ROI evidence self-test (${cases.length + wiringCases.length} negative cases)`);
}

let currentBuiltSite = null;
function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }
  const builtIndex = process.argv.indexOf('--built-site');
  let failures;
  if (builtIndex >= 0) {
    const siteDir = process.argv[builtIndex + 1];
    if (!siteDir) throw new Error('--built-site requires a directory');
    currentBuiltSite = path.resolve(root, siteDir);
    failures = validateContent(loadBuiltState(siteDir));
  } else {
    const state = loadSourceState();
    failures = [...validateContent(state), ...validateWiring(state)];
  }
  if (failures.length) {
    console.error('Performance/ROI evidence contract failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`OK: performance/ROI evidence contract (${builtIndex >= 0 ? 'built site' : 'source and wiring'})`);
}

main();
