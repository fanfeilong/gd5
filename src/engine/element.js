/**
 * 创建一个 HTML Element（引擎）
 * 1. 构造函数可方便的指定索引 ref，要创建的标签 tag，以及属性 attributes
 * 2. 提供 childList 方法用于组合子元素
 * 3. 提供 dom 方法用于返回实际的 HTML Element
 *
 * 属性约定（相对早期「className 必须唯一」的改进）：
 * - className：真实 CSS class，可多个，不再要求唯一
 * - id：DOM id，并写入 ref.id[id]
 * - key：逻辑索引，写入 ref.key[key]（列表项、重复 class 时用这个，而不是滥用 className）
 * - text：innerText
 * - dataset：Object.assign 到 element.dataset
 * - style：对象则 Object.assign 到 element.style，字符串则 style.cssText
 * - attrs：需要 setAttribute 的额外属性
 * - 其它字段：当作 DOM 属性赋值（type/value/draggable/…）
 */
export class Element {
  constructor(ref, tag, attributes = {}) {
    this.ref = ref;

    const e = document.createElement(tag);
    const {
      text,
      className,
      id,
      key,
      dataset,
      style,
      attrs,
      ...props
    } = attributes;

    if (className != null) {
      e.className = className;
      // 兼容旧用法：仍尝试按完整 className 字符串索引；冲突时不 alert，后写覆盖
      this.ref.class[className] = e;
    }

    if (id != null) {
      e.id = id;
      if (this.ref.id[id]) {
        console.warn(`[D] duplicated id: ${id}`);
      }
      this.ref.id[id] = e;
    }

    if (key != null) {
      if (!this.ref.key) this.ref.key = {};
      if (this.ref.key[key]) {
        console.warn(`[D] duplicated key: ${key}`);
      }
      this.ref.key[key] = e;
    }

    if (text != null) {
      e.innerText = text;
    }

    if (dataset && typeof dataset === 'object') {
      Object.assign(e.dataset, dataset);
    }

    if (style != null) {
      if (typeof style === 'string') {
        e.style.cssText = style;
      } else if (typeof style === 'object') {
        Object.assign(e.style, style);
      }
    }

    if (attrs && typeof attrs === 'object') {
      for (const name in attrs) {
        if (attrs[name] != null) e.setAttribute(name, attrs[name]);
      }
    }

    for (const name in props) {
      const value = props[name];
      if (value != null) {
        e[name] = value;
      }
    }

    this.e = e;
  }

  childList(list) {
    for (const e of list) {
      if (e != null) {
        this.e.appendChild(e.dom());
      }
    }
    return this;
  }

  dom() {
    return this.e;
  }
}

/**
 * 可组合的层次 HTML Element 创建方法，例如:
 *
 * ```
 * const d = new D();
 * d.div({ className: 'container', id: 'home' }).childList([
 *   d.div({ className: 'head', text: '标题' }),
 *   d.div({ className: 'body' }).childList([
 *     d.img({ id: 'logo' }),
 *     d.div({ id: 'desc', text: '描述' }),
 *   ]),
 * ]);
 * const [ref, root] = d.get();
 * // ref.id.home / ref.key.* / ref.class['container']
 * ```
 *
 * 列表项请用 key，不要靠 className 唯一性：
 * `d.button({ key: 'block-'+id, className: 'palette-item', dataset: { skillId: id } })`
 */
export class D {
  constructor() {
    this.ref = { class: {}, id: {}, key: {} };
    this.root = null;
  }

  div(options) {
    return this._create('div', options);
  }

  img(options) {
    return this._create('img', options);
  }

  b(options) {
    return this._create('b', options);
  }

  s(options) {
    return this._create('s', options);
  }

  strong(options) {
    return this._create('strong', options);
  }

  section(options) {
    return this._create('section', options);
  }

  li(options) {
    return this._create('li', options);
  }

  ul(options) {
    return this._create('ul', options);
  }

  button(options) {
    return this._create('button', options);
  }

  input(options) {
    return this._create('input', options);
  }

  iframe(options) {
    return this._create('iframe', options);
  }

  header(options) {
    return this._create('header', options);
  }

  aside(options) {
    return this._create('aside', options);
  }

  main(options) {
    return this._create('main', options);
  }

  h1(options) {
    return this._create('h1', options);
  }

  h2(options) {
    return this._create('h2', options);
  }

  p(options) {
    return this._create('p', options);
  }

  span(options) {
    return this._create('span', options);
  }

  label(options) {
    return this._create('label', options);
  }

  textarea(options) {
    return this._create('textarea', options);
  }

  /** 任意标签：d.el('nav', { className: 'x' }) */
  el(tag, options) {
    return this._create(tag, options);
  }

  _create(tag, options) {
    const e = new Element(this.ref, tag, options || {});
    if (this.root == null) this.root = e;
    return e;
  }

  get() {
    return [this.ref, this.root.dom()];
  }

  static clear(e) {
    if (e == null) return;
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
  }
}
