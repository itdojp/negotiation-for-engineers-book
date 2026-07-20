#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const paths = {
  published: 'docs/chapter-1/index.md',
  sourceMirror: 'src/chapter-1/index.md',
  detailedDraft: 'negotiation-chapter-1.md',
  foundations: 'docs/foundations/index.md',
  foundationsSource: 'src/foundations/index.md',
  package: 'package.json',
  workflow: '.github/workflows/book-qa.yml',
};

function read(relPath, readFile = fs.readFileSync) {
  try {
    return readFile(path.join(root, relPath), 'utf8');
  } catch (error) {
    throw new Error(`failed to read required PoC disclosure input: ${relPath}: ${error.message}`, { cause: error });
  }
}

function count(text, needle) {
  if (!needle) return 0;
  return text.split(needle).length - 1;
}

function loadState() {
  return {
    published: read(paths.published),
    sourceMirror: read(paths.sourceMirror),
    detailedDraft: read(paths.detailedDraft),
    foundations: read(paths.foundations),
    foundationsSource: read(paths.foundationsSource),
    packageJson: JSON.parse(read(paths.package)),
    workflow: read(paths.workflow),
  };
}

function validate(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const requireExactlyOnce = (text, marker, label) => {
    const found = count(text, marker);
    check(found === 1, `${label} must appear exactly once (found ${found})`);
  };

  const publicContracts = [
    ['published Chapter 1', state.published],
    ['source mirror Chapter 1', state.sourceMirror],
  ];
  for (const [label, text] of publicContracts) {
    requireExactlyOnce(text, '#### PoC / デモの能力表示契約', `${label}: disclosure heading`);
    requireExactlyOnce(text, '| 現在実装 | ルールベースの初期版（PoC） |', `${label}: currently implemented row`);
    requireExactlyOnce(text, '| 将来構想 | 機械学習方式を比較検討する候補 |', `${label}: future concept row`);
    requireExactlyOnce(text, '| 未実装 | 個人最適化、online learning、自動更新 |', `${label}: not implemented row`);
    requireExactlyOnce(text, '**悪い例（不採用）**', `${label}: bad example label`);
    requireExactlyOnce(text, '**良い例（事実ベース）**', `${label}: good example label`);
    requireExactlyOnce(text, '**case acceptance criteria**', `${label}: case acceptance criteria`);
    check(text.includes('「将来構想」には前提条件、owner、評価方法、再判断時点があり、実装を約束していない。'),
      `${label} must bind future concepts to assumptions, ownership, evaluation, and a redecision point`);
    check(text.includes('「未実装」の能力を効果見積もり、比較優位、承認理由に含めていない。'),
      `${label} must exclude unimplemented capabilities from estimates and approval`);
    check(text.includes('現状と提案を同じtask、data、測定期間、指標で比較し、提示順と不確実性を記録する。'),
      `${label} must require comparable conditions and uncertainty records`);
    check(text.includes('実データを使う場合は、目的、masking、同意または権限、保持期間、access範囲を承認する。'),
      `${label} must require authorization and masking for real data`);
    check(text.includes('判断者が保留、却下、別案提示を選べる状態を維持する。'),
      `${label} must preserve the decision maker's autonomy`);
    check(text.includes('[交渉倫理gate](../foundations/#7-交渉倫理と相手の自律性)'),
      `${label} must link the foundations ethics gate`);
    check(text.includes('PoC/デモでは「現在実装」「将来構想」「未実装」を分け、実装境界と判断条件を隠さない。'),
      `${label} summary must retain the disclosure boundary`);
  }

  const detailedMarkers = [
    '**3. 比較条件と不確実性の明示**',
    '| 現在実装 | ルールベースの初期版（PoC） |',
    '| 将来構想 | 機械学習方式を比較検討する候補 |',
    '| 未実装 | 個人最適化、online learning、自動更新 |',
    '**悪い例（不採用）**',
    '**良い例（事実ベース）**',
    '**case acceptance criteria**',
    '判断者が保留、却下、別案提示を選べる状態を維持する。',
  ];
  for (const marker of detailedMarkers) {
    requireExactlyOnce(state.detailedDraft, marker, `detailed draft: ${marker}`);
  }
  check(state.detailedDraft.includes('同じtask、data、測定期間、指標を使う'),
    'detailed draft must require comparable conditions');
  check(state.detailedDraft.includes('提示順を記録する'),
    'detailed draft must disclose presentation order');
  check(state.detailedDraft.includes('測定誤差、不利な結果、未確認事項も示し'),
    'detailed draft must disclose uncertainty and unfavorable results');

  const forbidden = [
    ['mislabeling a rule-based UI as AI', /UI(?:表示)?では?「AI による推薦」と表示/],
    ['using cognitive bias as a persuasion tactic', /認知バイアスを活用した/],
    ['staging an experience to exploit bias', /認知バイアス[^\n]*「体験の演出」/],
    ['making an unimplemented system feel futuristic', /将来性を感じさせる/],
    ['fake-it framing', /フェイク・イット・ティル・ユー・メイク・イット/],
  ];
  for (const [description, pattern] of forbidden) {
    for (const [label, text] of [
      ['published Chapter 1', state.published],
      ['source mirror Chapter 1', state.sourceMirror],
      ['detailed draft', state.detailedDraft],
    ]) {
      check(!pattern.test(text), `${label} must not retain ${description}`);
    }
  }

  for (const [label, text] of [
    ['published foundations', state.foundations],
    ['source mirror foundations', state.foundationsSource],
  ]) {
    for (const marker of [
      '交渉の目的は、相手を操作することではなく',
      '**自律性**',
      '**透明性**',
      '**境界**',
      '**記録**',
    ]) {
      check(text.includes(marker), `${label} must retain ethics marker: ${marker}`);
    }
  }

  const scripts = state.packageJson.scripts || {};
  check(scripts['test:poc-disclosure'] === 'node scripts/check-poc-disclosure.js --self-test',
    'package must expose the PoC disclosure self-test');
  check(scripts['check:poc-disclosure'] === 'node scripts/check-poc-disclosure.js',
    'package must expose the PoC disclosure source check');
  check(typeof scripts.test === 'string' && scripts.test.includes('npm run test:poc-disclosure'),
    'npm test must run the PoC disclosure self-test');
  check(typeof scripts.test === 'string' && scripts.test.includes('npm run check:poc-disclosure'),
    'npm test must run the PoC disclosure source check');
  check(/- name: Local npm QA[\s\S]*?run:\s*npm test/.test(state.workflow),
    'Book QA must execute npm test');

  return failures;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runSelfTest() {
  const baseline = loadState();
  const baselineFailures = validate(baseline);
  if (baselineFailures.length > 0) {
    throw new Error(`self-test baseline is invalid:\n- ${baselineFailures.join('\n- ')}`);
  }

  const cases = [
    ['missing current implementation row', 'published', '| 現在実装 |', '| 現在の実装 |', 'currently implemented row'],
    ['missing future concept row', 'published', '| 将来構想 |', '| 将来案 |', 'future concept row'],
    ['missing not implemented row', 'published', '| 未実装 |', '| 未対応 |', 'not implemented row'],
    ['missing bad example label', 'published', '**悪い例（不採用）**', '**例**', 'bad example label'],
    ['missing good example label', 'published', '**良い例（事実ベース）**', '**改善例**', 'good example label'],
    ['missing foundations backlink', 'published', '[交渉倫理gate](../foundations/#7-交渉倫理と相手の自律性)', '交渉倫理gate', 'must link the foundations ethics gate'],
    ['missing summary boundary', 'published', 'PoC/デモでは「現在実装」「将来構想」「未実装」を分け、実装境界と判断条件を隠さない。', 'PoC/デモを活用する。', 'summary must retain'],
    ['missing real-data guardrail', 'published', '実データを使う場合は、目的、masking、同意または権限、保持期間、access範囲を承認する。', '実データを使える。', 'authorization and masking'],
    ['future concept acceptance weakened', 'published', '「将来構想」には前提条件、owner、評価方法、再判断時点があり、実装を約束していない。', '「将来構想」を説明する。', 'bind future concepts'],
    ['unimplemented capability exclusion weakened', 'published', '「未実装」の能力を効果見積もり、比較優位、承認理由に含めていない。', '「未実装」の能力も将来価値として説明する。', 'exclude unimplemented capabilities'],
    ['comparison acceptance weakened', 'published', '現状と提案を同じtask、data、測定期間、指標で比較し、提示順と不確実性を記録する。', '現状と提案を比較する。', 'comparable conditions'],
    ['misleading AI label restored', 'published', '// UI表示：「ルールベースの初期版（検証用）」', '// UIでは「AI による推薦」と表示', 'mislabeling a rule-based UI as AI'],
    ['cognitive-bias exploitation restored', 'detailedDraft', '**3. 比較条件と不確実性の明示**', '認知バイアスを活用した「体験の演出」', 'using cognitive bias as a persuasion tactic'],
    ['presentation order omitted', 'detailedDraft', '提示順を記録する', '順序は問わない', 'presentation order'],
    ['autonomy omitted', 'detailedDraft', '判断者が保留、却下、別案提示を選べる状態を維持する。', '判断者に承認を求める。', '判断者が保留'],
  ];

  for (const [name, key, before, after, expected] of cases) {
    const mutated = clone(baseline);
    if (!mutated[key].includes(before)) throw new Error(`self-test fixture not found for ${name}`);
    mutated[key] = mutated[key].replace(before, after);
    const failures = validate(mutated);
    if (!failures.some((failure) => failure.includes(expected))) {
      throw new Error(`self-test case did not fail as expected: ${name}\n${failures.join('\n')}`);
    }
  }

  const packageMutation = clone(baseline);
  delete packageMutation.packageJson.scripts['check:poc-disclosure'];
  if (!validate(packageMutation).some((failure) => failure.includes('source check'))) {
    throw new Error('self-test did not reject missing package source-check wiring');
  }

  const testMutation = clone(baseline);
  testMutation.packageJson.scripts.test = testMutation.packageJson.scripts.test.replace('npm run test:poc-disclosure && ', '');
  if (!validate(testMutation).some((failure) => failure.includes('self-test'))) {
    throw new Error('self-test did not reject missing npm test self-test wiring');
  }

  const workflowMutation = clone(baseline);
  workflowMutation.workflow = workflowMutation.workflow.replace('run: npm test', 'run: npm run lint');
  if (!validate(workflowMutation).some((failure) => failure.includes('Book QA'))) {
    throw new Error('self-test did not reject missing Book QA wiring');
  }

  const foundationsSourceMutation = clone(baseline);
  foundationsSourceMutation.foundationsSource = foundationsSourceMutation.foundationsSource.replace('**自律性**', '**判断**');
  if (!validate(foundationsSourceMutation).some((failure) => failure.includes('source mirror foundations'))) {
    throw new Error('self-test did not reject a drifted source-mirror ethics gate');
  }

  let readFailure;
  try {
    read('fixtures/missing.md', () => { throw new Error('ENOENT'); });
  } catch (error) {
    readFailure = error;
  }
  if (!readFailure?.message.includes('fixtures/missing.md')) {
    throw new Error('self-test did not preserve the required input path in a read failure');
  }

  console.log(`OK: PoC disclosure self-test (${cases.length + 5} negative cases)`);
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }
  const failures = validate(loadState());
  if (failures.length > 0) {
    console.error('PoC disclosure contract failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log('OK: PoC disclosure contract covers published, source-mirror, and detailed-draft Chapter 1 content');
}

main();
