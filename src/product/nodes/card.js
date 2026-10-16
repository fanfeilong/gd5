import { bind } from '../../engine/index.js';
import { applyNodeStyles, nodeBaseAttrs } from './base.js';

export const kind = 'card';

export function create(node) {
  const { div, strong, p, get } = bind();
  div(
    nodeBaseAttrs(node),
    strong({
      key: `${node.id}__title`,
      style: { display: 'block', marginBottom: '8px' },
      text: node.props.title || '',
    }),
    p({
      key: `${node.id}__body`,
      style: { margin: '0', opacity: '0.8' },
      text: node.props.body || '',
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
  if (keys[`${node.id}__body`]) keys[`${node.id}__body`].textContent = node.props.body || '';
}

export function inspectorFields(node) {
  return [
    { prop: 'title', label: '标题', control: 'text', value: node.props.title || '' },
    { prop: 'body', label: '正文', control: 'textarea', value: node.props.body || '' },
  ];
}
