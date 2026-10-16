/**
 * ProtoLive tests — engine + product helpers
 * Run: node test/run.mjs
 */

import { Log, LogEnv, Component, ComponentRender, D, Element, bind } from '../src/engine/index.js';
import { createStore, DEFAULT_DOC } from '../src/product/lib/store.js';
import { documentToHtml, escapeHtml, renderNodeHtml } from '../src/product/lib/export.js';
import { FALLBACK_BLOCKS } from '../src/product/lib/skills.js';
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
    'docs/architecture.md',
    'skills/engine/README.md',
  ]) {
    assert(existsSync(join(root, path)), `${path} exists`);
  }
  assert(!existsSync(join(root, 'src/js')), 'legacy src/js removed');
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
    constructor(nav, logger) {
      super();
      this.navigator = nav;
      this.logger = logger;
      this.mounted = 0;
      this.unmounted = 0;
      this.state = { data: {}, ref: {} };
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
    constructor(nav, logger) {
      super();
      this.navigator = nav;
      this.logger = logger;
      this.mounted = 0;
      this.state = { data: {}, ref: {} };
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
      boot: { type: PageA, isMount: false, isModal: false, id: 'boot' },
      editor: { type: PageA, isMount: false, isModal: false, id: 'editor' },
      preview: { type: PageB, isMount: false, isModal: true, id: 'preview' },
    }
  );

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
    constructor(nav, logger) {
      super();
      this.navigator = nav;
      this.logger = logger;
      this.renderCount = 0;
      this.attachCount = 0;
      this.state = { data: { label: 'a' }, ref: {} };
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
      boot: { type: RefreshPage, isMount: false, isModal: false, id: 'boot' },
      page: { type: RefreshPage, isMount: false, isModal: false, id: 'page' },
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

section('skills blocks');
{
  const manifest = JSON.parse(readFileSync(join(root, 'skills/blocks/manifest.json'), 'utf8'));
  for (const file of manifest.blocks) {
    assert(existsSync(join(root, 'skills/blocks', file)), `block ${file}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
