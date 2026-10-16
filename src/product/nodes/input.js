import { bind } from '../../engine/index.js';
import { applyNodeStyles, nodeBaseAttrs } from './base.js';

export const kind = 'input';

export function create(node) {
  const { input, get } = bind();
  input({
    ...nodeBaseAttrs(node),
    placeholder: node.props.placeholder || '',
    readOnly: true,
  });
  const [ref, root] = get();
  root._dref = ref;
  applyNodeStyles(root, node);
  return root;
}

export function update(el, node) {
  el.placeholder = node.props.placeholder || '';
  el.value = '';
}

export function inspectorFields(node) {
  return [
    {
      prop: 'placeholder',
      label: '占位符',
      control: 'text',
      value: node.props.placeholder || '',
    },
  ];
}
