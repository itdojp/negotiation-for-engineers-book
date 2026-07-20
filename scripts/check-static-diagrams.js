#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const manifestPath = 'diagrams/manifest.json';
const figureIndexes = ['docs/appendices/figures/index.md', 'src/appendices/figures.md'];
const cssPath = 'docs/assets/css/main.css';
const packagePath = 'package.json';
const workflowPath = '.github/workflows/book-qa.yml';
const expectedIds = [
  'negotiation-architecture',
  'growth-roadmap',
  'technical-evidence-framework',
  'data-driven-persuasion',
];

function read(relPath) {
  try {
    return fs.readFileSync(path.join(root, relPath), 'utf8');
  } catch (error) {
    throw new Error(`failed to read required static-diagram input: ${relPath}: ${error.message}`, { cause: error });
  }
}

function escapeXml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function count(text, marker) {
  return marker ? text.split(marker).length - 1 : 0;
}

function loadState() {
  const manifest = JSON.parse(read(manifestPath));
  const filePaths = new Set([cssPath, ...figureIndexes]);
  for (const definition of manifest) {
    filePaths.add(definition.source);
    filePaths.add(definition.output);
    filePaths.add(definition.location.published);
    filePaths.add(definition.location.mirror);
  }
  return {
    manifest,
    files: Object.fromEntries([...filePaths].map((relPath) => [relPath, read(relPath)])),
    packageJson: JSON.parse(read(packagePath)),
    workflow: read(workflowPath),
  };
}

function validate(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const ids = state.manifest.map((definition) => definition.id);
  check(state.manifest.length === 4, `manifest must define exactly 4 active diagrams (found ${state.manifest.length})`);
  check(new Set(ids).size === ids.length, 'manifest diagram IDs must be unique');
  check([...expectedIds].sort().join('\n') === [...ids].sort().join('\n'), 'manifest active diagram IDs must match the audited set');

  const publishedPages = new Set(state.manifest.map((definition) => definition.location.published));
  const mirrorPages = new Set(state.manifest.map((definition) => definition.location.mirror));
  for (const relPath of [...publishedPages, ...mirrorPages]) {
    const text = state.files[relPath] || '';
    check(!/```mermaid\b/.test(text), `${relPath} must not expose a raw Mermaid block`);
  }

  const sourcePaths = new Set();
  const outputPaths = new Set();
  for (const definition of state.manifest) {
    const label = definition.id || '<missing-id>';
    check(!sourcePaths.has(definition.source), `${label}: Mermaid source path must be unique`);
    check(!outputPaths.has(definition.output), `${label}: SVG output path must be unique`);
    sourcePaths.add(definition.source);
    outputPaths.add(definition.output);

    const source = state.files[definition.source] || '';
    check(/^(?:mindmap|flowchart\b|graph\b)/.test(source), `${label}: canonical Mermaid source must declare a supported diagram type`);
    check(!source.includes('```'), `${label}: canonical Mermaid source must not contain Markdown fences`);

    const svg = state.files[definition.output] || '';
    const sourceDigest = crypto.createHash('sha256').update(source).digest('hex');
    const titleId = `${definition.id}-title`;
    const descriptionId = `${definition.id}-description`;
    check(svg.startsWith('<svg '), `${label}: committed SVG must start with an svg root`);
    check(svg.includes(`role="img"`), `${label}: SVG must expose role=img`);
    check(svg.includes(`aria-labelledby="${titleId}"`), `${label}: SVG must reference its accessible title`);
    check(svg.includes(`aria-describedby="${descriptionId}"`), `${label}: SVG must reference its accessible description`);
    check(svg.includes(`data-source-sha256="${sourceDigest}"`), `${label}: SVG source fingerprint must match the canonical Mermaid source`);
    check(svg.includes(`<title id="${titleId}">${escapeXml(definition.title)}</title>`), `${label}: SVG title must match the manifest`);
    check(svg.includes(`<desc id="${descriptionId}">${escapeXml(definition.description)}</desc>`), `${label}: SVG description must match the manifest`);
    check(!/<script\b|<iframe\b|javascript:/i.test(svg), `${label}: SVG must not contain executable or embedded active content`);

    const assetName = path.basename(definition.output);
    const liquidAsset = `{{ '/assets/diagrams/${assetName}' | relative_url }}`;
    for (const relPath of [definition.location.published, definition.location.mirror]) {
      const text = state.files[relPath] || '';
      check(text.includes(`{#${definition.location.anchor}}`), `${label}: ${relPath} must retain the stable figure anchor`);
      check(count(text, liquidAsset) === 3, `${label}: ${relPath} must link the static SVG from image, enlargement link, and caption (found ${count(text, liquidAsset)})`);
      check(text.includes(`![${definition.location.alt}](${liquidAsset})`), `${label}: ${relPath} must retain the informative image alternative`);
      check(text.includes(`*${definition.location.caption}（[拡大表示](${liquidAsset})）*`), `${label}: ${relPath} must retain the figure caption and enlargement link`);
      check(text.includes(`**図の要約**: ${definition.location.summary}`), `${label}: ${relPath} must retain the text alternative`);
    }
  }

  for (const relPath of figureIndexes) {
    const text = state.files[relPath] || '';
    check(text.includes('静的SVG図'), `${relPath} must identify the figures as static SVGs`);
    check(text.includes('テキスト要約'), `${relPath} must explain the text-alternative route`);
    for (const definition of state.manifest) {
      check(text.includes(`#${definition.location.anchor}`), `${relPath} must link ${definition.id} by its stable anchor`);
    }
  }

  const css = state.files[cssPath] || '';
  check(css.includes('*:focus-visible'), 'global styling must retain a visible keyboard focus indicator for diagram links');
  for (const definition of state.manifest) {
    check((state.files[definition.output] || '').includes('background-color: white'), `${definition.id}: SVG must retain a readable light canvas in dark themes`);
  }

  const scripts = state.packageJson.scripts || {};
  check(state.packageJson.devDependencies?.['@mermaid-js/mermaid-cli'] === '11.16.0', 'Mermaid CLI must remain pinned to exact version 11.16.0');
  check(state.packageJson.devDependencies?.puppeteer === '24.43.1', 'the Node 20-compatible Puppeteer renderer must remain pinned to exact version 24.43.1');
  check(state.packageJson.allowScripts?.['puppeteer@24.43.1'] === true, 'the audited Puppeteer 24.43.1 install script must be explicitly approved');
  check(scripts['render:diagrams'] === 'node scripts/render-diagrams.js', 'package must expose the diagram renderer');
  check(scripts['check:diagrams'] === 'node scripts/render-diagrams.js --check', 'package must expose deterministic diagram verification');
  check(scripts['test:static-diagrams'] === 'node scripts/check-static-diagrams.js --self-test', 'package must expose static-diagram negative tests');
  check(scripts['check:static-diagrams'] === 'node scripts/check-static-diagrams.js', 'package must expose the static-diagram source check');
  check(typeof scripts.build === 'string' && scripts.build.startsWith('npm run render:diagrams && '), 'npm run build must pre-render static SVGs');
  for (const command of ['npm run test:static-diagrams', 'npm run check:static-diagrams', 'npm run check:diagrams']) {
    check(typeof scripts.test === 'string' && scripts.test.includes(command), `npm test must execute ${command}`);
  }
  check(/- name: Local npm QA[\s\S]*?run:\s*npm test/.test(state.workflow), 'Book QA must execute the static-diagram contract through npm test');
  check(/- name: Local npm QA[\s\S]*?run:\s*npm test[\s\S]*?- name: Pre-render static diagrams[\s\S]*?run:\s*npm run render:diagrams/.test(state.workflow), 'Book QA must pre-render static diagrams after source validation');
  return failures;
}

function loadBuiltState(siteDir) {
  const rel = (value) => path.relative(root, path.join(siteDir, value));
  const manifest = JSON.parse(read(manifestPath));
  const files = {
    introduction: read(rel('introduction/index.html')),
    chapter1: read(rel('chapter-1/index.html')),
    figureIndex: read(rel('appendices/figures/index.html')),
  };
  const assets = Object.fromEntries(manifest.map((definition) => [definition.id, read(rel(`assets/diagrams/${path.basename(definition.output)}`))]));
  return { manifest, files, assets };
}

function validateBuilt(state) {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  for (const [label, html] of Object.entries(state.files)) {
    check(!/language-mermaid|<pre[^>]*>\s*<code[^>]*mermaid/i.test(html), `built ${label} must not contain raw Mermaid code`);
  }
  for (const definition of state.manifest) {
    const html = definition.location.published.includes('/introduction/') ? state.files.introduction : state.files.chapter1;
    const assetUrl = `/assets/diagrams/${path.basename(definition.output)}`;
    check(count(html, assetUrl) === 3, `built ${definition.id} must expose image and enlargement URLs`);
    check(html.includes(`alt="${definition.location.alt}"`), `built ${definition.id} must retain the image alternative`);
    check(html.includes(definition.location.summary), `built ${definition.id} must retain the text alternative`);
    check(html.includes(`id="${definition.location.anchor}"`), `built ${definition.id} must retain its stable anchor`);
    const svg = state.assets[definition.id] || '';
    check(svg.includes(`<title id="${definition.id}-title">`), `built ${definition.id} SVG must retain title metadata`);
    check(svg.includes(`<desc id="${definition.id}-description">`), `built ${definition.id} SVG must retain description metadata`);
    check(state.files.figureIndex.includes(`#${definition.location.anchor}`), `built figure index must link ${definition.id}`);
  }
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
  const first = baseline.manifest[0];
  const cases = [
    ['raw Mermaid in published page', (s) => { s.files[first.location.published] += '\n```mermaid\ngraph LR\nA-->B\n```\n'; }, 'raw Mermaid'],
    ['raw Mermaid in source mirror', (s) => { s.files[first.location.mirror] += '\n```mermaid\ngraph LR\nA-->B\n```\n'; }, 'raw Mermaid'],
    ['missing image alternative', (s) => { s.files[first.location.published] = s.files[first.location.published].replace(`![${first.location.alt}]`, '![]'); }, 'image alternative'],
    ['missing text alternative', (s) => { s.files[first.location.published] = s.files[first.location.published].replace(first.location.summary, '図を参照する。'); }, 'text alternative'],
    ['missing SVG title', (s) => { s.files[first.output] = s.files[first.output].replace('<title ', '<metadata '); }, 'SVG title'],
    ['missing SVG description', (s) => { s.files[first.output] = s.files[first.output].replace('<desc ', '<metadata '); }, 'SVG description'],
    ['missing SVG role', (s) => { s.files[first.output] = s.files[first.output].replace('role="img"', ''); }, 'role=img'],
    ['active SVG content', (s) => { s.files[first.output] += '<script>alert(1)</script>'; }, 'active content'],
    ['missing Mermaid source', (s) => { s.files[first.source] = ''; }, 'canonical Mermaid source'],
    ['stale SVG source fingerprint', (s) => { s.files[first.source] += '\n'; }, 'source fingerprint'],
    ['stale figure-index wording', (s) => { s.files[figureIndexes[0]] = s.files[figureIndexes[0]].replaceAll('静的SVG図', 'Mermaid 図'); }, 'static SVGs'],
    ['missing focus style', (s) => { s.files[cssPath] = s.files[cssPath].replace('*:focus-visible', '*:hover'); }, 'keyboard focus'],
    ['unpinned Mermaid CLI', (s) => { s.packageJson.devDependencies['@mermaid-js/mermaid-cli'] = '^11.16.0'; }, 'exact version'],
    ['incompatible Puppeteer version', (s) => { s.packageJson.devDependencies.puppeteer = '25.3.0'; }, 'Node 20-compatible'],
    ['unapproved Puppeteer script', (s) => { delete s.packageJson.allowScripts['puppeteer@24.43.1']; }, 'explicitly approved'],
    ['missing build rendering', (s) => { s.packageJson.scripts.build = 'jekyll build --source docs --destination _site'; }, 'pre-render'],
    ['missing npm test wiring', (s) => { s.packageJson.scripts.test = s.packageJson.scripts.test.replace('npm run check:diagrams && ', ''); }, 'npm run check:diagrams'],
    ['missing Book QA wiring', (s) => { s.workflow = s.workflow.replace('run: npm test', 'run: npm run lint'); }, 'Book QA'],
    ['missing Book QA pre-render', (s) => { s.workflow = s.workflow.replace('run: npm run render:diagrams', 'run: npm run check:diagrams'); }, 'pre-render static diagrams'],
  ];
  for (const [name, mutate, expected] of cases) {
    const state = clone(baseline);
    mutate(state);
    const failures = validate(state);
    if (!failures.some((failure) => failure.includes(expected))) {
      throw new Error(`self-test case did not fail as expected: ${name}\n${failures.join('\n')}`);
    }
  }
  const shortManifest = clone(baseline);
  shortManifest.manifest.pop();
  if (!validate(shortManifest).some((failure) => failure.includes('exactly 4'))) {
    throw new Error('self-test did not reject an incomplete diagram manifest');
  }
  console.log(`OK: static-diagram self-test (${cases.length + 1} negative cases)`);
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }
  const failures = validate(loadState());
  const builtIndex = process.argv.indexOf('--built-site');
  if (builtIndex >= 0) {
    const siteArg = process.argv[builtIndex + 1];
    if (!siteArg) throw new Error('--built-site requires a directory');
    failures.push(...validateBuilt(loadBuiltState(path.resolve(root, siteArg))));
  }
  if (failures.length > 0) {
    console.error('Static diagram contract failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`OK: ${expectedIds.length} active diagrams are static, accessible, linked, and reproducible`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
