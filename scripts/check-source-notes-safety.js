#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const paths = {
  foundations: 'docs/foundations/index.md',
  foundationsMirror: 'src/foundations/index.md',
  glossary: 'docs/glossary/index.md',
  glossaryMirror: 'src/glossary/index.md',
  chapter5: 'docs/chapter-5/index.md',
  chapter5Mirror: 'src/chapter-5/index.md',
  chapter5Draft: 'negotiation-chapter-5.md',
  introductionDraft: 'negotiation-introduction.md',
  toolkit: 'docs/appendices/toolkit/index.md',
  toolkitMirror: 'src/appendices/toolkit.md',
  package: 'package.json',
  workflow: '.github/workflows/book-qa.yml',
};

const negotiationUrls = [
  'https://www.penguinrandomhouse.com/books/324551/getting-to-yes-by-roger-fisher-and-william-ury/',
  'https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/',
  'https://www.pon.harvard.edu/daily/business-negotiations/how-to-find-the-zopa-in-business-negotiations/',
  'https://doi.org/10.1126/science.185.4157.1124',
  'https://pubmed.ncbi.nlm.nih.gov/17835457/',
  'https://doi.org/10.2307/2666999',
];

const healthUrls = [
  'https://pubmed.ncbi.nlm.nih.gov/8677286/',
  'https://www.who.int/en/news-room/questions-and-answers/item/stress',
  'https://www.who.int/health-topics/self-care',
  'https://kokoro.mhlw.go.jp/soudan/',
  'https://www.mhlw.go.jp/mamorouyokokoro/',
];

const negotiationClaimSegments = [
  {
    label: 'BATNA claim',
    start: 'BATNA自体は、理想条件、最低受容ライン、最悪ケースのいずれでもない',
    end: '相手側の最低受容ラインは通常観測できない',
    urls: negotiationUrls.slice(0, 2),
  },
  {
    label: 'ZOPA claim',
    start: '相手側の最低受容ラインは通常観測できない',
    end: '不確実な数値を見積もる際',
    urls: [negotiationUrls[2]],
  },
  {
    label: 'anchoring claim',
    start: '不確実な数値を見積もる際',
    end: '譲歩は、その場の雰囲気で出すものではない',
    urls: negotiationUrls.slice(3, 5),
  },
  {
    label: 'psychological-safety claim',
    start: 'Edmondson（1999）はチームの心理的安全性を',
    end: '交渉の目的は、相手を操作することではなく',
    urls: [negotiationUrls[5]],
  },
];

const negotiationNoteLinks = [
  ['S-123-N01', negotiationUrls.slice(0, 2)],
  ['S-123-N02', [negotiationUrls[2]]],
  ['S-123-N03', negotiationUrls.slice(3, 5)],
  ['S-123-N04', [negotiationUrls[5]]],
];

const healthClaimSegments = [
  {
    label: 'urgent-support boundary',
    start: '本章の境界',
    end: 'エンジニア特有のバイアス',
    urls: [healthUrls[4]],
  },
  {
    label: 'slow-breathing claim',
    start: 'これは治療法や生理効果を保証するprotocolではなく',
    end: '技術的な提案が批判された時',
    urls: [healthUrls[0]],
  },
  {
    label: 'consultation and self-care boundary',
    start: 'WHOは、stress symptomが持続して',
    end: 'このchecklistは、交渉を続けるか',
    urls: healthUrls.slice(1, 4),
  },
];

const healthNoteLinks = [
  ['S-123-H01', [healthUrls[0]]],
  ['S-123-H02', [healthUrls[1]]],
  ['S-123-H03', [healthUrls[2]]],
  ['S-123-H04', healthUrls.slice(3, 5)],
];

function read(relPath, readFile = fs.readFileSync) {
  try {
    return readFile(path.join(root, relPath), 'utf8');
  } catch (error) {
    throw new Error(`failed to read required Source Notes input: ${relPath}: ${error.message}`, { cause: error });
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
    foundations: read(paths.foundations),
    foundationsMirror: read(paths.foundationsMirror),
    glossary: read(paths.glossary),
    glossaryMirror: read(paths.glossaryMirror),
    chapter5: read(paths.chapter5),
    chapter5Mirror: read(paths.chapter5Mirror),
    chapter5Draft: read(paths.chapter5Draft),
    introductionDraft: read(paths.introductionDraft),
    toolkit: read(paths.toolkit),
    toolkitMirror: read(paths.toolkitMirror),
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
      throw new Error(`failed to read built Source Notes page: ${target}: ${error.message}`, { cause: error });
    }
  };
  const foundationHtml = builtRead('foundations/index.html');
  const glossaryHtml = builtRead('glossary/index.html');
  const chapter5Html = builtRead('chapter-5/index.html');
  const toolkitHtml = builtRead('appendices/toolkit/index.html');
  return {
    mode: 'built',
    foundations: decodeHtml(foundationHtml),
    foundationsHtml: foundationHtml,
    glossary: decodeHtml(glossaryHtml),
    glossaryHtml,
    chapter5: decodeHtml(chapter5Html),
    chapter5Html,
    toolkit: decodeHtml(toolkitHtml),
    toolkitHtml,
  };
}

function sourceNoteSection(text, id) {
  const start = text.indexOf(id);
  if (start < 0) return '';
  const next = text.indexOf('S-123-', start + id.length);
  return text.slice(start, next < 0 ? text.length : next);
}

function validateNoteFields(text, ids, label, failures, mode) {
  const check = (condition, message) => { if (!condition) failures.push(message); };
  for (const id of ids) {
    check(count(text, id) === 1, `${label}: ${id} must appear exactly once`);
    const section = sourceNoteSection(text, id);
    for (const field of ['source', '対象版', '確認日', '支える主張', '適用限界', '本文対応']) {
      const marker = mode === 'built' ? `<strong>${field}</strong>` : `**${field}**`;
      check(section.includes(marker), `${label}: ${id} is missing ${field}`);
    }
  }
}

function validateSegmentLinks(text, segments, label, failures) {
  const check = (condition, message) => { if (!condition) failures.push(message); };
  for (const segment of segments) {
    const start = text.indexOf(segment.start);
    const end = text.indexOf(segment.end, start + segment.start.length);
    check(start >= 0 && end > start, `${label}: cannot locate ${segment.label} for claim-local source validation`);
    const section = start >= 0 && end > start ? text.slice(start, end) : '';
    for (const url of segment.urls) {
      check(section.includes(url), `${label}: ${segment.label} is missing claim-local source link ${url}`);
    }
  }
}

function validateNoteLinks(text, mappings, label, failures) {
  const check = (condition, message) => { if (!condition) failures.push(message); };
  for (const [id, urls] of mappings) {
    const section = sourceNoteSection(text, id);
    for (const url of urls) {
      check(section.includes(url), `${label}: ${id} must retain Source Notes link ${url}`);
    }
  }
}

function validateContent(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };

  const foundationTexts = state.mode === 'source'
    ? [
      ['published foundations', state.foundations],
      ['source-mirror foundations', state.foundationsMirror],
    ]
    : [['built foundations', state.foundations]];
  for (const [label, text] of foundationTexts) {
    for (const marker of [
      'BATNA自体は、理想条件、最低受容ライン、最悪ケースのいずれでもない',
      '交渉前のZOPAは確定値ではなく仮説',
      '原典は数値判断に関する記述的知見',
      '相手を操作してよいことを示していない',
      '心理的安全性は、常に快適であること',
      '一回の会議の反応だけから、個人の心理状態やチーム全体の心理的安全性を診断しない',
    ]) check(text.includes(marker), `${label} is missing definition boundary: ${marker}`);
    const noteContainer = state.mode === 'source' ? text : state.foundationsHtml;
    validateNoteFields(noteContainer, ['S-123-N01', 'S-123-N02', 'S-123-N03', 'S-123-N04'], label, failures, state.mode);
    validateSegmentLinks(noteContainer, negotiationClaimSegments, label, failures);
    validateNoteLinks(noteContainer, negotiationNoteLinks, label, failures);
  }

  const glossaryTexts = state.mode === 'source'
    ? [
      ['published glossary', state.glossary],
      ['source-mirror glossary', state.glossaryMirror],
    ]
    : [['built glossary', state.glossary]];
  for (const [label, text] of glossaryTexts) {
    for (const marker of [
      '最低受容ラインや最悪ケースとは区別する',
      '事前には仮説であり、条件設計で成立を保証できない',
      '相手を操作する手法としては扱わない',
      '快適さ、無条件の同意、低い品質基準とは異なる',
    ]) check(text.includes(marker), `${label} is missing a concise boundary: ${marker}`);
  }

  const chapterTexts = state.mode === 'source'
    ? [
      ['published Chapter 5', state.chapter5],
      ['source-mirror Chapter 5', state.chapter5Mirror],
      ['detailed Chapter 5 draft', state.chapter5Draft],
    ]
    : [['built Chapter 5', state.chapter5]];
  for (const [label, text] of chapterTexts) {
    for (const marker of [
      'self-helpは医療や専門家支援を置き換えない',
      '任意の短い呼吸pause',
      '息苦しさ、めまい、不快感があれば中止する',
      'exactな4-7-8手順、交渉成果、臨床的効果を示した研究ではない',
      'exactな4-7-8法、息止め、交渉成果',
      '継続的なコンディション管理と相談境界',
      '症状が続く、日常生活や就業へ支障がある',
      '自傷他害の差し迫った危険がある',
      'medical triageではない',
    ]) check(text.includes(marker), `${label} is missing health boundary: ${marker}`);
    check(count(text, '自傷他害の差し迫った危険がある') === 2,
      `${label}: urgent support gate must appear in the chapter boundary and the work-condition plan`);
    const noteContainer = state.mode === 'source' ? text : state.chapter5Html;
    validateNoteFields(noteContainer, ['S-123-H01', 'S-123-H02', 'S-123-H03', 'S-123-H04'], label, failures, state.mode);
    validateSegmentLinks(noteContainer, healthClaimSegments, label, failures);
    validateNoteLinks(noteContainer, healthNoteLinks, label, failures);
  }

  if (state.mode === 'source') {
    for (const marker of [
      '対人的なリスクを取っても安全だという、チーム成員に共有された信念',
      '快適さ、無条件の同意、対立の不在、低い品質基準を意味せず',
      'https://doi.org/10.2307/2666999',
      'docs/foundations/#source-notes-negotiation-foundations',
    ]) check(state.introductionDraft.includes(marker), `detailed introduction is missing psychological-safety traceability: ${marker}`);
  }

  const toolkitTexts = state.mode === 'source'
    ? [
      ['published toolkit', state.toolkit],
      ['source-mirror toolkit', state.toolkitMirror],
    ]
    : [['built toolkit', state.toolkit]];
  for (const [label, text] of toolkitTexts) {
    for (const marker of [
      '推薦図書は理解を広げる資料であり、本文主張の根拠一覧ではない',
      '交渉の基礎語彙のSource Notes',
      '第5章のSource Notes',
      'ROI計算付録のSource Notes',
    ]) check(text.includes(marker), `${label} is missing the claim-to-Source-Notes map: ${marker}`);
  }

  const forbidden = [
    "'technique': '4-7-8呼吸法'",
    "'effect': '副交感神経の活性化'",
    "'technique': 'Box Breathing'",
    'class LongTermMentalHealthStrategy',
    'class EmotionalStateDiagnostics',
    "'□ 十分な睡眠（7時間以上）を取った'",
    "'power_posing': '2分間のパワーポーズで自信向上'",
    "'technique': 'Gradual Exposure'",
    "'duration': '5分/日'",
    "'impact': 'clarity and calm'",
    "'effect': '敵対心の軟化'",
  ];
  const healthSources = state.mode === 'source'
    ? [state.chapter5, state.chapter5Mirror, state.chapter5Draft]
    : [state.chapter5];
  for (const phrase of forbidden) {
    check(!healthSources.some((text) => text.includes(phrase)), `obsolete health overclaim must not be present: ${phrase}`);
  }

  if (state.mode === 'built') {
    check(state.foundationsHtml.includes('id="source-notes-negotiation-foundations"'),
      'built foundations must preserve the negotiation Source Notes anchor');
    check(state.chapter5Html.includes('id="source-notes-emotional-safety"'),
      'built Chapter 5 must preserve the health Source Notes anchor');
    check(/href="[^"]*foundations\/#source-notes-negotiation-foundations"/.test(state.toolkitHtml),
      'built toolkit must link to the negotiation Source Notes anchor');
    check(/href="[^"]*chapter-5\/#source-notes-emotional-safety"/.test(state.toolkitHtml),
      'built toolkit must link to the health Source Notes anchor');
  }
  return failures;
}

function validateWiring(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const scripts = state.packageJson.scripts || {};
  check(scripts['test:source-notes'] === 'node scripts/check-source-notes-safety.js --self-test',
    'package must expose the Source Notes self-test');
  check(scripts['check:source-notes'] === 'node scripts/check-source-notes-safety.js',
    'package must expose the Source Notes source check');
  check(typeof scripts.test === 'string' && scripts.test.includes('npm run test:source-notes'),
    'npm test must run the Source Notes self-test');
  check(typeof scripts.test === 'string' && scripts.test.includes('npm run check:source-notes'),
    'npm test must run the Source Notes source check');
  check(typeof scripts.build === 'string' && scripts.build.includes('check-source-notes-safety.js --built-site _site'),
    'npm build must run the built-site Source Notes check');
  check(/- name: Check built Source Notes and health boundaries[\s\S]*?run:\s*node scripts\/check-source-notes-safety\.js --built-site _site/.test(state.workflow),
    'Book QA must run the built-site Source Notes check');
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
    ['BATNA boundary removed', 'foundations', 'BATNA自体は、理想条件、最低受容ライン、最悪ケースのいずれでもない', 'BATNAは最低受容ラインである', 'BATNA自体'],
    ['source mirror ZOPA drift', 'foundationsMirror', '交渉前のZOPAは確定値ではなく仮説', '交渉前にZOPAは確定する', 'ZOPA'],
    ['anchoring ethics removed', 'foundations', '相手を操作してよいことを示していない', '相手への操作に利用できる', '相手を操作してよいこと'],
    ['psychological safety scope removed', 'foundationsMirror', '心理的安全性は、常に快適であること', '心理的安全性とは全員が快適であることだけを指す', '心理的安全性'],
    ['negotiation source date removed', 'foundations', '**確認日**', '**参照**', '確認日'],
    ['negotiation target edition removed', 'foundationsMirror', '**対象版**', '**版情報**', '対象版'],
    ['claim-local BATNA link removed', 'foundations', '3rd ed.（Penguin Books, 2011）](https://www.penguinrandomhouse.com/books/324551/getting-to-yes-by-roger-fisher-and-william-ury/)', '3rd ed.（Penguin Books, 2011）](https://example.invalid/batna-claim)', 'claim-local source link'],
    ['BATNA Source Note link removed', 'foundationsMirror', 'ISBN 9780143118756](https://www.penguinrandomhouse.com/books/324551/getting-to-yes-by-roger-fisher-and-william-ury/)', 'ISBN 9780143118756](https://example.invalid/batna-note)', 'must retain Source Notes link'],
    ['glossary BATNA drift', 'glossary', '最低受容ラインや最悪ケースとは区別する', '最低受容ラインと同じ', '最低受容ラインや最悪ケース'],
    ['glossary mirror safety drift', 'glossaryMirror', '快適さ、無条件の同意、低い品質基準とは異なる', '全員が快適で同意する状態', '快適さ、無条件の同意'],
    ['health boundary removed', 'chapter5', 'self-helpは医療や専門家支援を置き換えない', 'self-helpで完結する', 'self-helpは医療'],
    ['mirror stop condition removed', 'chapter5Mirror', '息苦しさ、めまい、不快感があれば中止する', '必ず続ける', '息苦しさ'],
    ['detailed 4-7-8 restored', 'chapter5Draft', "'technique': '任意の短い呼吸pause'", "'technique': '4-7-8呼吸法'", 'obsolete health overclaim'],
    ['detailed fixed sleep restored', 'chapter5Draft', "'□ 通常時と比べて、会話を続けられる状態かを確認した'", "'□ 十分な睡眠（7時間以上）を取った'", 'obsolete health overclaim'],
    ['detailed exposure regimen restored', 'chapter5Draft', "'technique': 'Role rehearsal'", "'technique': 'Gradual Exposure'", 'obsolete health overclaim'],
    ['detailed fixed mindfulness duration restored', 'chapter5Draft', "'duration': '任意の短時間'", "'duration': '5分/日'", 'obsolete health overclaim'],
    ['consultation gate removed', 'chapter5', '症状が続く、日常生活や就業へ支障がある', '気分が変わる', '日常生活や就業'],
    ['urgent gate removed', 'chapter5Mirror', '自傷他害の差し迫った危険がある', '負荷がある', 'urgent support gate'],
    ['medical triage boundary removed', 'chapter5Draft', 'medical triageではない', 'medical triageである', 'medical triageではない'],
    ['health source limit removed', 'chapter5', 'exactな4-7-8法、息止め、交渉成果', '呼吸法の効果', 'exactな4-7-8法'],
    ['claim-local breathing link removed', 'chapter5Mirror', '[Sakakibara & Hayano, 1996](https://pubmed.ncbi.nlm.nih.gov/8677286/)', '[Sakakibara & Hayano, 1996](https://example.invalid/breathing-claim)', 'claim-local source link'],
    ['intro source removed', 'introductionDraft', 'https://doi.org/10.2307/2666999', 'https://example.invalid/', 'psychological-safety traceability'],
    ['toolkit claim map removed', 'toolkit', '推薦図書は理解を広げる資料であり、本文主張の根拠一覧ではない', '推薦図書が根拠一覧である', '根拠一覧ではない'],
    ['toolkit mirror health map removed', 'toolkitMirror', '第5章のSource Notes', '第5章', 'claim-to-Source-Notes map'],
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
    ['missing source script', (state) => { delete state.packageJson.scripts['check:source-notes']; }, 'source check'],
    ['missing self-test wiring', (state) => { state.packageJson.scripts.test = state.packageJson.scripts.test.replace('npm run test:source-notes && ', ''); }, 'self-test'],
    ['missing built build wiring', (state) => { state.packageJson.scripts.build = state.packageJson.scripts.build.replace(' && node scripts/check-source-notes-safety.js --built-site _site', ''); }, 'npm build'],
    ['missing workflow built check', (state) => { state.workflow = state.workflow.replace('node scripts/check-source-notes-safety.js --built-site _site', 'echo skipped'); }, 'Book QA'],
  ];
  for (const [name, mutate, expected] of wiringCases) {
    const mutated = clone(baseline);
    mutate(mutated);
    const failures = validateWiring(mutated);
    if (!failures.some((failure) => failure.includes(expected))) {
      throw new Error(`self-test wiring case did not fail as expected: ${name}\n${failures.join('\n')}`);
    }
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
  console.log(`OK: Source Notes and health-boundary self-test (${cases.length + wiringCases.length + 1} negative cases)`);
}

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
    failures = validateContent(loadBuiltState(siteDir));
  } else {
    const state = loadSourceState();
    failures = [...validateContent(state), ...validateWiring(state)];
  }
  if (failures.length) {
    console.error('Source Notes and health-boundary contract failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`OK: Source Notes and health-boundary contract (${builtIndex >= 0 ? 'built site' : 'source and wiring'})`);
}

main();
