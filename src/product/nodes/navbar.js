import { bind } from '../../engine/index.js';
import { applyNodeStyles, nodeBaseAttrs } from './base.js';

export const kind = 'navbar';

export function create(node) {
  const { div, span, get } = bind();
  div(
    nodeBaseAttrs(node),
    span({ key: `${node.id}__title`, text: node.props.title || '' }),
    span({
      key: `${node.id}__action`,
      style: { opacity: '0.7' },
      text: node.props.action || '',
    })
  );
  const [ref, root] = get();
  root._dref = ref;
  applyNodeStyles(root, node);
  return root;
}

export function update(el, node) {
  const keys = el._dref?.key || {};
  if (keys[`${node.id}__title`]) keys[`${node.id}__title`].textContent = node.props.title || '';
  if (keys[`${node.id}__action`]) keys[`${node.id}__action`].textContent = node.props.action || '';
}

export function inspectorFields(node) {
  return [
    { prop: 'title', label: '标题', control: 'text', value: node.props.title || '' },
    { prop: 'action', label: '操作文案', control: 'text', value: node.props.action || '' },
  ];
}
