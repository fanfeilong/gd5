import { bind } from '../../engine/index.js';
import { applyNodeStyles, nodeBaseAttrs } from './base.js';

export const kind = 'text';

export function create(node) {
  const { div, get } = bind();
  div({ ...nodeBaseAttrs(node), text: node.props.text || '' });
  const [ref, root] = get();
  root._dref = ref;
  applyNodeStyles(root, node);
  return root;
}

export function update(el, node) {
  el.textContent = node.props.text || '';
}

/** Inspector 可编辑字段声明（单一职责：本 kind 的 props） */
export function inspectorFields(node) {
  return [{ prop: 'text', label: '文本', control: 'text', value: node.props.text || '' }];
}
