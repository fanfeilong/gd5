import { createStore, uid } from './store.js';
import { loadSkillBlocks } from './skills.js';
import { createPalette } from './palette.js';
import { createCanvasController } from './canvas.js';
import { createInspector } from './inspector.js';
import { createPreview } from './preview.js';
import { downloadHtml } from './export.js';

function nodeFromBlock(block, position = {}, propOverrides = {}, styleOverrides = {}) {
  return {
    id: uid('node'),
    kind: block.kind,
    label: block.label,
    x: position.x ?? 24,
    y: position.y ?? 24,
    width: position.width ?? block.defaults.width,
    height: position.height ?? block.defaults.height,
    props: { ...block.defaults.props, ...propOverrides },
    style: { ...block.defaults.style, ...styleOverrides },
  };
}

function buildStarterDoc(blocksById) {
  const nodes = [];
  if (blocksById.navbar) {
    nodes.push(nodeFromBlock(blocksById.navbar, { x: 0, y: 0, width: 390, height: 56 }));
  }
  if (blocksById.image) {
    nodes.push(nodeFromBlock(blocksById.image, { x: 35, y: 80 }));
  }
  if (blocksById.text) {
    nodes.push(
      nodeFromBlock(
        blocksById.text,
        { x: 35, y: 280, width: 320, height: 48 },
        { text: '用纯前端搭 live demo' },
        { fontSize: '24px', fontWeight: '700', color: '#1a2330' }
      )
    );
  }
  if (blocksById.card) {
    nodes.push(nodeFromBlock(blocksById.card, { x: 35, y: 350 }));
  }
  if (blocksById.button) {
    nodes.push(nodeFromBlock(blocksById.button, { x: 125, y: 520 }));
  }

  return {
    meta: {
      name: 'Untitled Prototype',
      width: 390,
      height: 844,
      background: '#f7f4ef',
    },
    nodes,
  };
}

async function boot() {
  const store = createStore();
  const blocks = await loadSkillBlocks();
  const blocksById = Object.fromEntries(blocks.map((b) => [b.id, b]));

  const palette = createPalette({
    listEl: document.getElementById('palette-list'),
    blocks,
    onAdd(skillId) {
      const block = palette.getBlock(skillId);
      if (!block) return;
      const { doc } = store.getState();
      const count = doc.nodes.filter((n) => n.kind === block.kind).length;
      store.addNode(block, {
        x: 24 + (count % 4) * 16,
        y: 72 + (count % 6) * 24,
      });
    },
  });

  const canvas = createCanvasController({
    canvasEl: document.getElementById('canvas'),
    artboardEl: document.getElementById('artboard'),
    store,
    onDropSkill(skillId, point) {
      const block = palette.getBlock(skillId);
      if (!block) return;
      store.addNode(block, {
        x: Math.max(0, Math.round(point.x - block.defaults.width / 2)),
        y: Math.max(0, Math.round(point.y - block.defaults.height / 2)),
      });
    },
  });

  const inspector = createInspector({
    bodyEl: document.getElementById('inspector-body'),
    store,
  });

  const preview = createPreview({
    modalEl: document.getElementById('preview-modal'),
    frameEl: document.getElementById('preview-frame'),
    closeBtn: document.getElementById('btn-close-preview'),
    store,
  });

  const widthInput = document.getElementById('board-width');
  const heightInput = document.getElementById('board-height');

  widthInput.addEventListener('change', () => {
    store.setMeta({ width: Number(widthInput.value) || 390 });
  });
  heightInput.addEventListener('change', () => {
    store.setMeta({ height: Number(heightInput.value) || 844 });
  });

  document.getElementById('btn-undo').addEventListener('click', () => store.undo());
  document.getElementById('btn-redo').addEventListener('click', () => store.redo());
  document.getElementById('btn-preview').addEventListener('click', () => preview.open());
  document.getElementById('btn-export').addEventListener('click', () => {
    const { doc } = store.getState();
    downloadHtml(doc, `${slugify(doc.meta.name)}.html`);
  });

  window.addEventListener('keydown', (event) => {
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      store.undo();
    }
    if (meta && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
      event.preventDefault();
      store.redo();
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const selected = store.getSelected();
      if (selected) {
        event.preventDefault();
        store.removeNode(selected.id);
      }
    }
  });

  store.replaceDoc(buildStarterDoc(blocksById), { recordHistory: false });
  store.clearHistory();

  store.subscribe(() => {
    const { doc } = store.getState();
    widthInput.value = doc.meta.width;
    heightInput.value = doc.meta.height;
    canvas.render();
    inspector.render();
  });

  canvas.render();
  inspector.render();
}

function slugify(name) {
  return String(name || 'prototype')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-_]/g, '') || 'prototype';
}

boot().catch((err) => {
  console.error('ProtoLive failed to start', err);
});
