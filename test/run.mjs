/**
 * Zero-dependency Node test runner for ProtoLive core modules.
 * Run: node test/run.mjs
 */

import { createStore, DEFAULT_DOC } from '../src/js/store.js';
import { documentToHtml, escapeHtml, renderNodeHtml } from '../src/js/export.js';
import { FALLBACK_BLOCKS } from '../src/js/skills.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

section('store');
{
  const store = createStore();
  const block = FALLBACK_BLOCKS.find((b) => b.id === 'button');
  const id = store.addNode(block, { x: 10, y: 20 });
  assert(store.getState().doc.nodes.length === 1, 'addNode appends one node');
  assert(store.getSelected()?.id === id, 'addNode selects new node');

  store.updateNode(id, { x: 40, y: 50 });
  assert(store.getSelected().x === 40, 'updateNode changes geometry');

  store.undo();
  assert(store.getSelected().x === 10, 'undo restores previous geometry');
  store.redo();
  assert(store.getSelected().x === 40, 'redo reapplies geometry');

  store.beginGesture();
  store.updateNode(id, { x: 99 }, { recordHistory: false });
  store.updateNode(id, { x: 100 }, { recordHistory: false });
  store.undo();
  assert(store.getSelected().x === 40, 'gesture drag collapses to one history step');

  store.removeNode(id);
  assert(store.getState().doc.nodes.length === 0, 'removeNode clears node');
  assert(store.getSelected() === null, 'removeNode clears selection');
}

section('export');
{
  assert(escapeHtml('<a & "b">') === '&lt;a &amp; &quot;b&quot;&gt;', 'escapeHtml encodes entities');

  const node = {
    id: 'n1',
    kind: 'button',
    x: 10,
    y: 20,
    width: 100,
    height: 40,
    props: { text: 'Go' },
    style: { background: '#2bb0a6' },
  };
  const snippet = renderNodeHtml(node);
  assert(snippet.includes('Go') && snippet.includes('button'), 'renderNodeHtml emits button markup');

  const html = documentToHtml({
    meta: { ...DEFAULT_DOC.meta, name: 'Demo' },
    nodes: [node],
  });
  assert(html.includes('<!DOCTYPE html>'), 'documentToHtml is full HTML document');
  assert(html.includes('Demo'), 'documentToHtml includes title');
  assert(html.includes('width: 390px'), 'documentToHtml includes artboard size');
}

section('skills layout');
{
  const manifestPath = join(root, 'skills/blocks/manifest.json');
  assert(existsSync(manifestPath), 'skills/blocks/manifest.json exists');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert(Array.isArray(manifest.blocks) && manifest.blocks.length > 0, 'manifest lists blocks');
  for (const file of manifest.blocks) {
    const path = join(root, 'skills/blocks', file);
    assert(existsSync(path), `block file exists: ${file}`);
    const block = JSON.parse(readFileSync(path, 'utf8'));
    assert(block.id && block.kind && block.defaults, `${file} has id/kind/defaults`);
  }
  assert(FALLBACK_BLOCKS.length >= 6, 'fallback blocks cover core kinds');
}

section('project layout');
{
  for (const path of ['docs', 'src', 'skills', 'test', 'index.html', 'src/js/main.js', 'src/css/app.css']) {
    assert(existsSync(join(root, path)), `${path} exists`);
  }
  assert(!existsSync(join(root, 'index.py')), 'Flask entry index.py removed');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
