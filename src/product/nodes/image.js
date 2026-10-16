import { bind } from '../../engine/index.js';
import { applyNodeStyles, nodeBaseAttrs } from './base.js';

export const kind = 'image';

export function create(node) {
  const { div, get } = bind();
  div({ ...nodeBaseAttrs(node), text: node.props.alt || 'Image' });
  const [ref, root] = get();
  root._dref = ref;
  applyNodeStyles(root, node);
  return root;
}

export function update(el, node) {
  el.textContent = node.props.alt || 'Image';
}

export function inspectorFields(node) {
  return [{ prop: 'alt', label: '说明', control: 'text', value: node.props.alt || '' }];
}
