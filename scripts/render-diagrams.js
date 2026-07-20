#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const definitions = JSON.parse(fs.readFileSync(path.join(root, 'diagrams', 'manifest.json'), 'utf8'));

function escapeXml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function addAccessibleMetadata(outputPath, definition) {
  const titleId = `${definition.id}-title`;
  const descriptionId = `${definition.id}-description`;
  const sourceDigest = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(root, definition.source)))
    .digest('hex');
  let svg = fs.readFileSync(outputPath, 'utf8');
  svg = svg.replace(/<svg\b([^>]*)>/, (_match, attributes) => {
    const normalized = attributes
      .replace(/\srole="[^"]*"/g, '')
      .replace(/\saria-labelledby="[^"]*"/g, '')
      .replace(/\saria-describedby="[^"]*"/g, '')
      .replace(/\sdata-source-sha256="[^"]*"/g, '');
    return `<svg${normalized} role="img" aria-labelledby="${titleId}" aria-describedby="${descriptionId}" data-source-sha256="${sourceDigest}">`;
  });
  const metadata = `<title id="${titleId}">${escapeXml(definition.title)}</title>`
    + `<desc id="${descriptionId}">${escapeXml(definition.description)}</desc>`;
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1${metadata}`);
  fs.writeFileSync(outputPath, svg, 'utf8');
}

function mmdcPath() {
  const executable = process.platform === 'win32' ? 'mmdc.cmd' : 'mmdc';
  const candidate = path.join(root, 'node_modules', '.bin', executable);
  if (!fs.existsSync(candidate)) {
    throw new Error(`Mermaid CLI is not installed: ${path.relative(root, candidate)} (run npm ci)`);
  }
  return candidate;
}

function render(definition, outputPath) {
  const sourcePath = path.join(root, definition.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Diagram source is missing: ${definition.source}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const result = spawnSync(mmdcPath(), [
    '--input', sourcePath,
    '--output', outputPath,
    '--backgroundColor', 'white',
    '--quiet',
  ], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`Failed to render ${definition.source}${detail ? `:\n${detail}` : ''}`);
  }
  addAccessibleMetadata(outputPath, definition);
}

function renderCommittedAssets() {
  for (const definition of definitions) {
    render(definition, path.join(root, definition.output));
    console.log(`Rendered ${definition.source} -> ${definition.output}`);
  }
}

function checkCommittedAssets() {
  const scratchRoot = path.join(root, '.diagram-check', `${process.pid}-${Date.now()}`);
  const failures = [];
  try {
    for (const definition of definitions) {
      const committedPath = path.join(root, definition.output);
      if (!fs.existsSync(committedPath)) {
        failures.push(`${definition.output} is missing`);
        continue;
      }
      const scratchPath = path.join(scratchRoot, path.basename(definition.output));
      render(definition, scratchPath);
      const sourceDigest = crypto.createHash('sha256')
        .update(fs.readFileSync(path.join(root, definition.source)))
        .digest('hex');
      const committedSvg = fs.readFileSync(committedPath, 'utf8');
      const renderedSvg = fs.readFileSync(scratchPath, 'utf8');
      if (!committedSvg.includes(`data-source-sha256="${sourceDigest}"`)) {
        failures.push(`${definition.output} is stale; run npm run render:diagrams`);
      }
      if (!renderedSvg.includes(`data-source-sha256="${sourceDigest}"`)) {
        failures.push(`${definition.source} did not retain its source fingerprint during a clean render`);
      }
    }
  } finally {
    fs.rmSync(scratchRoot, { recursive: true, force: true });
  }
  if (failures.length > 0) {
    throw new Error(`Static diagram generation check failed:\n- ${failures.join('\n- ')}`);
  }
  console.log(`OK: ${definitions.length} committed SVG fingerprints match their sources and clean rendering succeeds`);
}

try {
  if (process.argv.includes('--check')) {
    checkCommittedAssets();
  } else {
    renderCommittedAssets();
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
