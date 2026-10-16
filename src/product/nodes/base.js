/** 画布节点公共样式绑定 */
export function applyNodeStyles(el, node) {
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.style.width = `${node.width}px`;
  el.style.height = `${node.height}px`;
  Object.assign(el.style, node.style || {});
}

export function nodeBaseAttrs(node) {
  return {
    key: node.id,
    className: 'prototype-node',
    dataset: { id: node.id, kind: node.kind },
  };
}
