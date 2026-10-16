/**
 * ProtoLive tests — engine + product helpers
 * Run: node test/run.mjs
 */

import {
  Log,
  LogEnv,
  Component,
  ComponentRender,
  D,
  Element,
  bind,
  adoptStyles,
  adoptStylesFor,
  adoptedStyleKeys,
  resetAdoptedStyles,
  domEventType,
} from '../src/engine/index.js';
import { createStore, DEFAULT_DOC } from '../src/product/lib/store.js';
import { documentToHtml, escapeHtml, renderNodeHtml } from '../src/product/lib/export.js';
import { FALLBACK_BLOCKS } from '../src/product/lib/skills.js';
import { createNodeElement, inspectorModel, registry } from '../src/product/nodes/index.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

section('layout: product vs engine');
{
  for (const path of [
    'src/engine/index.js',
    'src/engine/component.js',
    'src/engine/component-render.js',
    'src/engine/element.js',
    'src/engine/log.js',
    'src/product/main.js',
    'src/product/components/EditorComponent.js',
    'src/product/components/PreviewComponent.js',
    'src/product/components/BootComponent.js',
    'src/product/components/ToolbarComponent.js',
    'src/product/components/PaletteComponent.js',
    'src/product/components/ArtboardComponent.js',
    'src/product/components/InspectorComponent.js',
    'src/product/nodes/index.js',
    'src/product/nodes/button.js',
    'docs/architecture.md',
    'docs/api.md',
    'skills/engine/README.md',
    'src/engine/styles.js',
    'src/product/css/tokens.css',
    'src/product/css/base.css',
    'src/product/components/ToolbarComponent.css',
    'src/product/components/PaletteComponent.css',
    'src/product/components/ArtboardComponent.css',
    'src/product/components/InspectorComponent.css',
    'src/product/components/EditorComponent.css',
    'src/product/components/PreviewComponent.css',
    'src/product/components/BootComponent.css',
  ]) {
    assert(existsSync(join(root, path)), `${path} exists`);
  }
  assert(!existsSync(join(root, 'src/js')), 'legacy src/js removed');
  assert(!existsSync(join(root, 'src/product/views')), 'ad-hoc views/ removed');
  assert(!existsSync(join(root, 'src/product/css/app.css')), 'monolithic app.css removed');
  assert(!existsSync(join(root, 'index.py')), 'Flask entry removed');
}

section('engine: Log');
{
  const log = new Log(LogEnv.disable, ['ctx']);
  log.i('should not throw');
  assert(log.env() === LogEnv.disable, 'Log env is disable');
  const forked = log.fork();
  forked.pushContext('more');
  assert(forked !== log, 'Log.fork returns new instance');
}

section('engine: Component + ComponentRender navigation');
{
  const mounts = {};
  const displays = {};
  globalThis.document = {
    getElementById(id) {
      if (!mounts[id]) mounts[id] = { style: { display: 'none' }, id };
      return mounts[id];
    },
  };

  class PageA extends Component {
    constructor(deps) {
      super(deps);
      this.mounted = 0;
      this.unmounted = 0;
    }
    async componentDidMount() {
      this.mounted += 1;
    }
    componentDidUnMount() {
      this.unmounted += 1;
    }
    componentDidAttachEvents() {}
    render() {}
  }

  class PageB extends Component {
    constructor(deps) {
      super(deps);
      this.mounted = 0;
    }
    async componentDidMount() {
      this.mounted += 1;
    }
    componentDidUnMount() {}
    componentDidAttachEvents() {}
    render() {}
  }

  const render = new ComponentRender({ logEnv: LogEnv.disable });
  render.init(
    { loading: 'boot', home: 'editor' },
    {
      boot: PageA,
      editor: PageA,
      preview: { type: PageB, isModal: true },
    }
  );
  assert(render.state.components.editor.id === 'editor', 'init defaults id to name');
  assert(render.state.components.editor.isMount === false, 'init defaults isMount false');
  assert(!!render.state.components.editor.component.navigator, 'page gets navigator by default');
  assert(!!render.state.components.editor.component.logger, 'page gets logger by default');

  await new Promise((resolve) => {
    render._navigate('editor', null, resolve);
  });
  // hide boot after home
  render._renderPage('boot', 'none');

  assert(render.state.components.editor.component.mounted === 1, 'editor mounted once');
  assert(document.getElementById('editor').style.display === 'block', 'editor visible');

  await new Promise((resolve) => {
    // modal navigate
    const prev = render.state.componentState.current;
    render._navigate('preview', { doc: { meta: {}, nodes: [] } }, resolve);
    assert(prev === 'editor', 'editor was current before preview');
  });
  assert(document.getElementById('editor').style.display === 'block', 'modal keeps editor visible');
  assert(document.getElementById('preview').style.display === 'block', 'preview visible');
  assert(render.state.components.preview.component.mounted === 1, 'preview mounted');

  render._goBack();
  assert(document.getElementById('preview').style.display === 'none', 'preview hidden after goBack');
  assert(render.state.components.preview.isMount === false, 'preview unmounted flag');
  assert(render.state.components.editor.component.unmounted === 0, 'editor not unmounted by modal close');
}

section('engine: setData / refresh');
{
  class RefreshPage extends Component {
    constructor(deps) {
      super(deps);
      this.renderCount = 0;
      this.attachCount = 0;
      this.state.data.label = 'a';
    }
    async componentDidMount() {}
    componentDidUnMount() {}
    componentDidAttachEvents() {
      this.attachCount += 1;
    }
    render() {
      this.renderCount += 1;
    }
  }

  const mounts = {};
  globalThis.document = {
    getElementById(id) {
      if (!mounts[id]) mounts[id] = { style: { display: 'none' }, id };
      return mounts[id];
    },
  };

  const host = new ComponentRender({ logEnv: LogEnv.disable });
  host.init(
    { loading: 'boot', home: 'page' },
    {
      boot: RefreshPage,
      page: RefreshPage,
    }
  );

  await new Promise((resolve) => {
    host._navigate('page', null, resolve);
  });

  const page = host.state.components.page.component;
  assert(page.renderCount === 1, 'initial render once');
  assert(page.attachCount === 1, 'AttachEvents once on mount');

  page.setData({ label: 'b' });
  assert(page.state.data.label === 'b', 'setData merges state.data');
  assert(page.renderCount === 2, 'setData triggers refresh/render');
  assert(page.attachCount === 1, 'refresh does not re-AttachEvents');

  host.refresh();
  assert(page.renderCount === 3, 'navigator.refresh re-renders current page');
  assert(page.attachCount === 1, 'navigator.refresh still skips AttachEvents');

  page.setData({ label: 'c' }, { refresh: false });
  assert(page.state.data.label === 'c' && page.renderCount === 3, 'setData can skip refresh');
}

section('engine: Component.mount composition');
{
  class Child extends Component {
    constructor(deps) {
      super(deps);
      this.mounts = 0;
      this.unmounts = 0;
      this.renders = 0;
      this.attaches = 0;
      this.state.data.n = 0;
    }
    async componentDidMount() {
      this.mounts += 1;
    }
    componentDidUnMount() {
      this.unmounts += 1;
    }
    componentDidAttachEvents() {
      this.attaches += 1;
    }
    render() {
      this.renders += 1;
    }
  }

  const child = new Child();
  const hostEl = { id: 'host-x', firstChild: null, removeChild() {} };
  await child.mount(hostEl);
  assert(child.isMounted() && child.host() === hostEl, 'mount sets host');
  assert(child.mounts === 1 && child.renders === 1 && child.attaches === 1, 'mount runs full lifecycle');
  child.setData({ n: 1 });
  assert(child.renders === 2 && child.attaches === 1, 'setData refresh skips AttachEvents');
  child.unmount();
  assert(!child.isMounted() && child.unmounts === 1, 'unmount runs DidUnMount');
}

section('engine: paint / ensureShell / on');
{
  const listeners = new Map();
  function makeEl(id) {
    return {
      id,
      children: [],
      firstChild: null,
      style: {},
      dataset: {},
      appendChild(child) {
        this.children.push(child);
        this.firstChild = this.children[0] || null;
      },
      removeChild(child) {
        this.children = this.children.filter((c) => c !== child);
        this.firstChild = this.children[0] || null;
      },
      addEventListener(type, handler) {
        const key = `${type}`;
        if (!listeners.has(this)) listeners.set(this, []);
        listeners.get(this).push({ type, handler });
      },
      removeEventListener(type, handler) {
        const list = listeners.get(this) || [];
        listeners.set(
          this,
          list.filter((l) => !(l.type === type && l.handler === handler))
        );
      },
    };
  }

  globalThis.document = {
    createElement(tag) {
      return makeEl(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
    getElementById() {
      return null;
    },
  };

  class Panel extends Component {
    constructor() {
      super();
      this.clicks = 0;
    }
    componentDidAttachEvents() {
      this.onId('btn', 'click', () => {
        this.clicks += 1;
      });
    }
    render() {
      this.ensureShell(
        (ids) => ids.panel,
        ({ div, button }) => {
          div(
            { className: 'panel', id: 'panel' },
            button({ id: 'btn', type: 'button', text: 'Go' })
          );
        }
      );
    }
  }

  const host = makeEl('host');
  const panel = new Panel();
  await panel.mount(host);
  assert(!!panel.ids().panel && !!panel.ids().btn, 'paint/ensureShell indexes ids');
  assert(host.children.length === 1, 'paint appends root once');

  panel.refresh();
  assert(host.children.length === 1, 'ensureShell skips rebuild on refresh');

  const btn = panel.ids().btn;
  const click = listeners.get(btn)?.find((l) => l.type === 'click');
  assert(!!click, 'onId registered listener');
  click.handler();
  assert(panel.clicks === 1, 'onId handler runs');

  panel.unmount();
  assert((listeners.get(btn) || []).length === 0, 'unmount removes listeners');
  assert(host.children.length === 0, 'unmount clears host');
  assert(Object.keys(panel.ids()).length === 0, 'unmount resets ref');
}

section('product: component ergonomics');
{
  const toolbarSrc = readFileSync(join(root, 'src/product/components/ToolbarComponent.js'), 'utf8');
  const editorSrc = readFileSync(join(root, 'src/product/components/EditorComponent.js'), 'utf8');
  assert(toolbarSrc.includes('ensureShell'), 'Toolbar uses ensureShell');
  assert(toolbarSrc.includes('onClick'), 'Toolbar uses declarative onClick');
  assert(!toolbarSrc.includes('onId'), 'Toolbar no longer uses onId AttachEvents');
  assert(!toolbarSrc.includes('componentDidAttachEvents'), 'Toolbar has no AttachEvents split');
  assert(!toolbarSrc.includes('D.clear'), 'Toolbar does not hand-clear host');
  assert(editorSrc.includes('ensureShell') && editorSrc.includes("this.on(window"), 'Editor uses ensureShell + on(window)');
  assert(toolbarSrc.includes('static styles'), 'Toolbar declares static styles');
  assert(editorSrc.includes('EditorComponent.css'), 'Editor styles co-located');
  assert(editorSrc.includes('new ToolbarComponent'), 'Editor composes with new Child(deps)');
  assert(editorSrc.includes('navigator: this.navigator'), 'Editor forwards navigator in deps');
  assert(toolbarSrc.includes('this.navigator.navigate'), 'Toolbar uses navigator like a page');
  assert(!toolbarSrc.includes('constructor(navigator'), 'Toolbar no positional navigator ctor');
  const mainSrc = readFileSync(join(root, 'src/product/main.js'), 'utf8');
  assert(mainSrc.includes('boot: BootComponent'), 'main uses init shorthand');
}

section('engine: adoptStyles');
{
  resetAdoptedStyles();
  const headKids = [];
  globalThis.document = {
    head: {
      appendChild(el) {
        headKids.push(el);
        if (el.tagName === 'LINK' && typeof el.onload === 'function') {
          queueMicrotask(() => el.onload());
        }
      },
    },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        dataset: {},
        rel: '',
        href: '',
        textContent: '',
        onload: null,
        onerror: null,
      };
    },
  };

  await adoptStyles('.x { color: red }', 'text-x');
  assert(headKids.some((el) => el.tagName === 'STYLE' && el.textContent.includes('color: red')), 'adoptStyles injects style text');
  const before = headKids.length;
  await adoptStyles('.x { color: red }', 'text-x');
  assert(headKids.length === before, 'adoptStyles dedupes by key');
  assert(adoptedStyleKeys().includes('text-x'), 'adoptedStyleKeys lists keys');

  class Styled extends Component {
    static styles = '.panel { display: block }';
  }
  await adoptStylesFor(Styled);
  assert(
    headKids.some((el) => el.tagName === 'STYLE' && el.textContent.includes('display: block')),
    'adoptStylesFor reads static styles'
  );

  class Linked extends Component {
    static styles = new URL('http://example.test/panel.css');
    render() {}
  }
  const host = { id: 'h', firstChild: null, removeChild() {}, appendChild() {} };
  const linked = new Linked();
  await linked.mount(host);
  assert(
    headKids.some((el) => el.tagName === 'LINK' && el.href.includes('panel.css')),
    'mount adopts URL stylesheet'
  );
  resetAdoptedStyles();
}

section('engine: declarative on* events');
{
  assert(domEventType('onClick') === 'click', 'onClick → click');
  assert(domEventType('onPointerDown') === 'pointerdown', 'onPointerDown → pointerdown');
  assert(domEventType('onDoubleClick') === 'dblclick', 'onDoubleClick → dblclick');
  assert(domEventType('onclick') == null, 'lowercase onclick ignored');
  assert(domEventType('className') == null, 'non-event prop ignored');

  const listeners = [];
  globalThis.document = {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener(type, handler) {
          listeners.push({ type, handler, el: this });
        },
      };
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };

  let clicks = 0;
  const { button, get } = bind();
  button({
    id: 'go',
    type: 'button',
    text: 'Go',
    onClick: () => {
      clicks += 1;
    },
    events: {
      dragstart: () => {
        clicks += 10;
      },
    },
  });
  const [ref] = get();
  assert(!!ref.id.go, 'button created with id');
  assert(
    listeners.some((l) => l.type === 'click') && listeners.some((l) => l.type === 'dragstart'),
    'onClick and events bag register listeners'
  );
  listeners.find((l) => l.type === 'click').handler();
  listeners.find((l) => l.type === 'dragstart').handler();
  assert(clicks === 11, 'declarative handlers run');
  assert(ref.id.go.onClick == null, 'onClick not assigned as DOM property');
}

section('engine: D / Element');
{
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener() {},
      };
      return el;
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };
  const d = new D();
  d.div({ className: 'wrap', id: 'wrap' }).childList([
    d.div({ className: 'child', text: 'hi' }),
  ]);
  const [ref, root] = d.get();
  assert(!!ref.class.wrap && !!ref.id.wrap, 'D indexes class and id');
  assert(root.children.length === 1, 'D.childList appends child');
  assert(root.children[0].innerText === 'hi', 'Element text attribute sets innerText');
  assert(Element === Element, 'Element export available');

  const d2 = new D();
  d2.button({
    key: 'save',
    className: 'btn btn--primary',
    type: 'button',
    text: '保存',
    dataset: { action: 'save' },
    style: { marginTop: '8px' },
  });
  // 同构建再写一个同 class 前缀，不应 throw/alert
  d2.button({
    key: 'cancel',
    className: 'btn btn--ghost',
    type: 'button',
    text: '取消',
  });
  const [ref2] = d2.get();
  assert(ref2.key.save && ref2.key.cancel, 'D key indexes list items');
  assert(ref2.key.save.className === 'btn btn--primary', 'multi className allowed');
  assert(ref2.key.save.dataset.action === 'save', 'dataset assigned');
  assert(ref2.key.save.style.marginTop === '8px', 'style object assigned');
  assert(typeof d2.el === 'function', 'd.el helper exists');

  // trailing children
  const d3 = new D();
  d3.div({ className: 'parent', id: 'parent' }, d3.span({ className: 'kid', text: 'k' }));
  const [ref3, root3] = d3.get();
  assert(root3.children.length === 1 && root3.children[0].innerText === 'k', 'trailing children work');
  assert(ref3.id.parent, 'trailing-children root keeps id');

  // bind + map
  const { div, button, map, get, h } = bind();
  div(
    { className: 'list', id: 'list' },
    ...map(
      [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      (item, _i, key) => button({ key, className: 'item', text: item.label }),
      (item) => item.id
    )
  );
  const [ref4, root4] = get();
  assert(ref4.key.a && ref4.key.b, 'map auto-keys items');
  assert(root4.children.length === 2, 'map children appended via spread');
  assert(typeof h === 'function', 'bind exposes h');
  const nav = h('nav', { className: 'nav', id: 'navX' }, h('span', { text: 'n' }));
  assert(nav.e.tagName === 'NAV' && nav.e.children.length === 1, 'h builds arbitrary tags');
}

section('product: store + export');
{
  const store = createStore();
  const block = FALLBACK_BLOCKS.find((b) => b.id === 'button');
  const id = store.addNode(block, { x: 10, y: 20 });
  assert(store.getSelected()?.id === id, 'store selects new node');
  store.updateNode(id, { x: 40 });
  store.undo();
  assert(store.getSelected().x === 10, 'store undo works');

  assert(escapeHtml('<a>') === '&lt;a&gt;', 'escapeHtml works');
  const html = documentToHtml({
    meta: { ...DEFAULT_DOC.meta, name: 'Demo' },
    nodes: [
      {
        id: 'n1',
        kind: 'button',
        x: 1,
        y: 2,
        width: 100,
        height: 40,
        props: { text: 'Go' },
        style: {},
      },
    ],
  });
  assert(html.includes('Demo') && html.includes('Go'), 'documentToHtml includes content');
  assert(FALLBACK_BLOCKS.length >= 6, 'fallback blocks present');
}

section('product: nodes registry');
{
  assert(Object.keys(registry).length >= 6, 'node kinds registered');

  globalThis.document = {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        classList: { toggle() {} },
        appendChild(child) {
          this.children.push(child);
        },
      };
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };

  const node = {
    id: 'n_btn',
    kind: 'button',
    label: '按钮',
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    props: { text: 'Hi' },
    style: { background: '#2bb0a6' },
  };
  const el = createNodeElement(node);
  assert(el.dataset.kind === 'button' && el.innerText === 'Hi', 'button node create via registry');

  const model = inspectorModel(node);
  assert(model.props.some((f) => f.prop === 'text'), 'inspectorModel uses kind fields');
  assert(model.geometry.length === 4, 'inspectorModel includes geometry');

  const editorSrc = readFileSync(join(root, 'src/product/components/EditorComponent.js'), 'utf8');
  assert(!/switch\s*\(\s*node\.kind/.test(editorSrc), 'EditorComponent has no kind switch');
  assert(editorSrc.includes('ToolbarComponent') && editorSrc.includes('.mount('), 'Editor mounts child Components');
  assert(!editorSrc.includes('ToolbarView'), 'Editor no longer uses View pattern');
}

section('skills blocks');
{
  const manifest = JSON.parse(readFileSync(join(root, 'skills/blocks/manifest.json'), 'utf8'));
  for (const file of manifest.blocks) {
    assert(existsSync(join(root, 'skills/blocks', file)), `block ${file}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
