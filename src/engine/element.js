/**
 * 创建一个 HTML Element（引擎）
 * 1. 构造函数可方便的指定索引 ref，要创建的标签 tag，以及属性 attributes
 * 2. 提供 childList 方法用于组合子元素
 * 3. 提供 dom 方法用于返回实际的 HTML Element
 */
export class Element {
  constructor(ref, tag, attributes) {
    this.ref = ref;

    const e = document.createElement(tag);
    for (const attributeName in attributes) {
      if (attributeName === 'text') {
        e.innerText = attributes.text;
      } else {
        const a = attributes[attributeName];
        if (a != null) {
          e[attributeName] = a;
        }
      }
    }
    this.e = e;

    if (attributes.className) {
      if (this.ref.class[attributes.className]) alert('invalid construct, duplicated className');
      this.ref.class[attributes.className] = e;
    }

    if (attributes.id) {
      if (this.ref.id[attributes.id]) alert('invalid construct, duplicated id');
      this.ref.id[attributes.id] = e;
    }
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
 * d.div({className:`container`,id:`home`}).childList([
 *   d.div({className:`head`, text:`标题`}),
 *   d.div({className:`body`}).childList([
 *     d.img({id:`logo`}),
 *     d.div({id:`desc`,  text:`描述`})
 *   ])
 * ]);
 *
 * const [ref, root] = d.get();
 * ```
 * 1. root 就是局部根 HTML Element
 * 2. 则可以通过 ref.class.container，ref.id.home 来索引对象
 * 3. 暂时要求 className 不能重复，可改进
 */
export class D {
  constructor() {
    // 假设一次构造过程中，className 和 id 都不重复
    this.ref = { class: {}, id: {} };
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
