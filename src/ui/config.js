import { cx, el, omit } from './util.js';

/**
 * ConfigProvider — apply theme token overrides on a subtree (antd ConfigProvider lite).
 * Pass `theme.token` map of CSS variable names without `--` prefix, or full `--gd-*` keys.
 *
 *   ConfigProvider({ theme: { token: { primary: '#e86a17', bg: '#f7f4f0' } } }, children…)
 *
 * Maps short keys: primary → --gd-primary, bg → --gd-bg, etc.
 */
export function ConfigProvider(props = {}, ...children) {
  const { theme, className, style } = props;
  const token = theme?.token || theme || {};
  const cssVars = { ...(typeof style === 'object' ? style : {}) };

  for (const [k, v] of Object.entries(token)) {
    if (v == null) continue;
    const varName = k.startsWith('--') ? k : k.startsWith('gd-') ? `--${k}` : `--gd-${k}`;
    cssVars[varName] = v;
  }

  return el(
    'div',
    {
      ...omit(props, ['theme', 'className', 'style']),
      className: cx('gd-config-provider', className),
      style: cssVars,
    },
    ...children
  );
}
