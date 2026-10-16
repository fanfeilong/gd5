import { uid } from './store.js';

export function nodeFromBlock(block, position = {}, propOverrides = {}, styleOverrides = {}) {
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

export function buildStarterDoc(blocksById) {
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
