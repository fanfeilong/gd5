import { bind } from '../../engine/index.js';
import { applyNodeStyles, nodeBaseAttrs } from './base.js';

export const kind = 'button';

export function create(node) {
  const { button, get } = bind();
  button({ ...nodeBaseAttrs(node), type: 'button', text: node.props.text || '' });
  const [ref, root] = get();
  root._dref = ref;
  applyNodeStyles(root, node);
  return root;
}

export function update(el, node) {
  el.textContent = node.props.text || '';
}

export function inspectorFields(node) {
  return [{ prop: 'text', label: '文本', control: 'text', value: node.props.text || '' }];
}
