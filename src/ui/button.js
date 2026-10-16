import { cx, el, omit } from './util.js';

/**
 * Button — antd-like primitive.
 *
 * @param {object} [props]
 * @param {'primary'|'default'|'ghost'|'danger'|'text'} [props.type]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {boolean} [props.block]
 * @param {boolean} [props.disabled]
 * @param {string} [props.text]
 * @param {string} [props.className]
 * @param {function} [props.onClick]
 * @param {...any} children
 */
export function Button(props = {}, ...children) {
  const {
    type = 'default',
    size = 'md',
    block = false,
    className,
    text,
    disabled,
  } = props;

  const kids = children.length ? children : [];

  return el(
    'button',
    {
      ...omit(props, ['type', 'size', 'block', 'className', 'text', 'htmlType']),
      type: props.htmlType || 'button',
      disabled: !!disabled,
      className: cx(
        'gd-btn',
        `gd-btn--${type}`,
        `gd-btn--${size}`,
        block && 'gd-btn--block',
        className
      ),
      ...(kids.length === 0 && text != null ? { text } : {}),
    },
    ...kids
  );
}
