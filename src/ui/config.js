import { cx, el, omit } from './util.js';
import { THEME_ATTR, resolveThemeInput } from './theme.js';

/**
 * ConfigProvider — named theme and/or token overrides on a subtree.
 *
 *   ConfigProvider({ theme: 'blue' }, …children)
 *   ConfigProvider({ theme: { name: 'green' } }, …)
 *   ConfigProvider({ theme: { token: { primary: '#e86a17' } } }, …)
 */
export function ConfigProvider(props = {}, ...children) {
  const { theme, className, style } = props;
  const { name, token } = resolveThemeInput(theme);
  const cssVars = { ...(typeof style === 'object' ? style : {}) };

  if (token && typeof token === 'object') {
    for (const [k, v] of Object.entries(token)) {
      if (v == null) continue;
      const varName = k.startsWith('--') ? k : k.startsWith('gd-') ? `--${k}` : `--gd-${k}`;
      cssVars[varName] = v;
    }
  }

  const attrs = name ? { [THEME_ATTR]: name } : undefined;

  return el(
    'div',
    {
      ...omit(props, ['theme', 'className', 'style']),
      className: cx('gd-config-provider', className),
      style: cssVars,
      attrs,
    },
    ...children
  );
}
