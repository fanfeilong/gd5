/**
 * 组件样式注入（引擎）
 *
 * 无 bundler：用 `new URL('./X.css', import.meta.url)` 旁挂 CSS，
 * mount 时按 key 注入一次，unmount 不移除（多实例共享）。
 */

/** @type {Map<string, Promise<void>>} */
const adopted = new Map();

/**
 * @param {string|URL} spec
 * @returns {string}
 */
function styleKey(spec) {
  if (spec instanceof URL) return spec.href;
  if (typeof spec === 'string') {
    if (isStylesheetRef(spec)) {
      try {
        return new URL(spec, globalThis.location?.href || 'http://local/').href;
      } catch {
        return spec;
      }
    }
    return `css:${fnv1a(spec)}`;
  }
  throw new Error('adoptStyles: unsupported spec');
}

/**
 * 路径 / URL 才当 stylesheet；含 `{` 的字符串当 CSS 文本。
 * @param {string} s
 */
function isStylesheetRef(s) {
  if (typeof s !== 'string') return false;
  if (s.includes('{')) return false;
  return (
    s.endsWith('.css') ||
    s.startsWith('./') ||
    s.startsWith('../') ||
    s.startsWith('/') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('blob:')
  );
}

/** @param {string} str */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * 注入一份样式（URL / 相对路径 / CSS 文本），相同 key 只注入一次。
 * @param {string|URL} spec
 * @param {string} [key]
 * @returns {Promise<void>}
 */
export function adoptStyles(spec, key) {
  const id = key || styleKey(spec);
  if (adopted.has(id)) return adopted.get(id);

  const done = inject(spec, id);
  adopted.set(id, done);
  return done;
}

/**
 * 读取 Component 子类的 `static styles`（单项或数组）并注入。
 * @param {typeof import('./component.js').Component} Ctor
 */
export async function adoptStylesFor(Ctor) {
  if (!Ctor || Ctor.styles == null) return;
  const list = Array.isArray(Ctor.styles) ? Ctor.styles : [Ctor.styles];
  await Promise.all(list.map((item) => adoptStyles(item)));
}

/** @returns {string[]} */
export function adoptedStyleKeys() {
  return [...adopted.keys()];
}

/** 测试用：清空登记（不移除已插入的 DOM） */
export function resetAdoptedStyles() {
  adopted.clear();
}

/**
 * @param {string|URL} spec
 * @param {string} id
 */
function inject(spec, id) {
  if (typeof document === 'undefined' || !document.head) {
    return Promise.resolve();
  }

  if (spec instanceof URL || (typeof spec === 'string' && isStylesheetRef(spec))) {
    const href = spec instanceof URL ? spec.href : spec;
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.componentStyle = id;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`adoptStyles: failed to load ${href}`));
      document.head.appendChild(link);
    });
  }

  if (typeof spec === 'string') {
    const style = document.createElement('style');
    style.dataset.componentStyle = id;
    style.textContent = spec;
    document.head.appendChild(style);
    return Promise.resolve();
  }

  return Promise.reject(new Error('adoptStyles: unsupported spec'));
}
