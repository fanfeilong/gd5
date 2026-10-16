/**
 * 画布节点注册表：一种 kind 一个模块，Editor / Inspector 只组合，不写 kind 分支。
 */
import { applyNodeStyles } from './base.js';
import * as text from './text.js';
import * as button from './button.js';
import * as input from './input.js';
import * as image from './image.js';
import * as card from './card.js';
import * as navbar from './navbar.js';

const registry = {
  text,
  button,
  input,
  image,
  card,
  navbar,
};

function resolve(kind) {
  return registry[kind] || text;
}

export function createNodeElement(node) {
  return resolve(node.kind).create(node);
}

export function updateNodeContent(el, node) {
  resolve(node.kind).update(el, node);
}

export function syncNodeElement(el, node, selectedId) {
  applyNodeStyles(el, node);
  updateNodeContent(el, node);
  el.classList.toggle('is-selected', node.id === selectedId);
}

/** 几何 + 样式字段（所有 kind 共用）+ kind 专属 props */
export function inspectorModel(node) {
  const kindFields = resolve(node.kind).inspectorFields(node);
  return {
    hint: `${node.label || node.kind} · ${node.id}`,
    geometry: [
      { geo: 'x', label: 'X', value: node.x },
      { geo: 'y', label: 'Y', value: node.y },
      { geo: 'width', label: '宽', value: node.width },
      { geo: 'height', label: '高', value: node.height },
    ],
    props: kindFields,
    styles: [
      { style: 'background', label: '背景色', value: node.style.background || '' },
      { style: 'color', label: '文字色', value: node.style.color || '' },
      { style: 'fontSize', label: '字号', value: node.style.fontSize || '' },
      { style: 'borderRadius', label: '圆角', value: node.style.borderRadius || '' },
    ],
  };
}

export { applyNodeStyles, registry };
