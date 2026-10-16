import { cx, el, omit } from './util.js';

/**
 * Tree / OutlineView — expandable indented rows.
 * @param {object} [props]
 * @param {Array<{key:string,title:string,children?:array}>} [props.treeData]
 * @param {Set|string[]} [props.expandedKeys]
 * @param {function} [props.onExpand]
 * @param {string} [props.selectedKey]
 * @param {function} [props.onSelect]
 */
export function Tree(props = {}) {
  const {
    treeData = [],
    expandedKeys,
    onExpand,
    selectedKey,
    onSelect,
    className,
  } = props;
  const expanded =
    expandedKeys instanceof Set
      ? expandedKeys
      : new Set(expandedKeys || []);

  const renderNode = (node, depth) => {
    const hasKids = Array.isArray(node.children) && node.children.length > 0;
    const open = expanded.has(node.key);
    return el(
      'div',
      { className: 'gd-tree__node', key: node.key },
      el(
        'div',
        {
          className: cx(
            'gd-tree__row',
            selectedKey === node.key && 'gd-tree__row--selected'
          ),
          style: { paddingLeft: `${depth * 16 + 8}px` },
        },
        hasKids
          ? el('button', {
              type: 'button',
              className: cx('gd-tree__twist', open && 'gd-tree__twist--open'),
              text: '▸',
              onClick: () => {
                const next = new Set(expanded);
                if (open) next.delete(node.key);
                else next.add(node.key);
                onExpand?.([...next]);
              },
            })
          : el('span', { className: 'gd-tree__twist gd-tree__twist--leaf' }),
        el('button', {
          type: 'button',
          className: 'gd-tree__label',
          text: node.title,
          onClick: () => onSelect?.(node.key, node),
        })
      ),
      hasKids && open
        ? el(
            'div',
            { className: 'gd-tree__children' },
            ...node.children.map((c) => renderNode(c, depth + 1))
          )
        : null
    );
  };

  return el(
    'div',
    {
      ...omit(props, [
        'treeData',
        'expandedKeys',
        'onExpand',
        'selectedKey',
        'onSelect',
        'className',
      ]),
      className: cx('gd-tree', className),
      role: 'tree',
    },
    ...treeData.map((n) => renderNode(n, 0))
  );
}

export const OutlineView = Tree;

/** DisclosureTriangle — standalone twisty control. */
export function DisclosureTriangle(props = {}) {
  const { open = false, onClick, className } = props;
  return el('button', {
    ...omit(props, ['open', 'className']),
    type: 'button',
    className: cx('gd-tree__twist', open && 'gd-tree__twist--open', className),
    text: '▸',
    onClick,
    attrs: { 'aria-expanded': open ? 'true' : 'false' },
  });
}
