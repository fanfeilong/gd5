import { Component, D, bind } from '../../engine/index.js';
import { createStore } from '../lib/store.js';
import { downloadHtml } from '../lib/export.js';
import { loadSkillBlocks } from '../lib/skills.js';
import { buildStarterDoc } from '../lib/starter.js';
import { ToolbarView } from '../views/ToolbarView.js';
import { PaletteView } from '../views/PaletteView.js';
import { ArtboardView } from '../views/ArtboardView.js';
import { InspectorView } from '../views/InspectorView.js';

/**
 * 编辑器页（产品）— 只做组合：挂载子视图、订阅 store、转发快捷键。
 * 具体 UI / 节点 kind 分支在 views/ 与 nodes/。
 */
export class EditorComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = createStore();
    this.blocks = [];
    this.blocksById = {};
    this._unsub = null;
    this.state = { data: { ready: false }, ref: {} };

    const blockApi = {
      store: this.store,
      getBlocks: () => this.blocks,
      getBlock: (id) => this.blocksById[id],
    };

    this.toolbar = new ToolbarView({
      store: this.store,
      navigator: this.navigator,
      onExport: () => {
        const { doc } = this.store.getState();
        downloadHtml(doc, `${slugify(doc.meta.name)}.html`);
      },
    });
    this.palette = new PaletteView(blockApi);
    this.artboard = new ArtboardView(blockApi);
    this.inspector = new InspectorView({ store: this.store });
  }

  async componentDidMount() {
    this.blocks = await loadSkillBlocks('skills/blocks');
    this.blocksById = Object.fromEntries(this.blocks.map((b) => [b.id, b]));
    this.store.replaceDoc(buildStarterDoc(this.blocksById), { recordHistory: false });
    this.store.clearHistory();
    this.state.data.ready = true;
    this.logger.i(`EditorComponent mounted, blocks=${this.blocks.length}`);
  }

  refresh() {
    this._paint();
  }

  componentDidUnMount() {
    if (this._unsub) {
      this._unsub();
      this._unsub = null;
    }
    if (this._onKey) {
      window.removeEventListener('keydown', this._onKey);
      this._onKey = null;
    }
    D.clear(document.getElementById('editor'));
    this.state.ref = {};
  }

  componentDidAttachEvents() {
    const ref = this.state.ref;
    this.toolbar.attach(ref);
    this.palette.attach(ref);
    this.artboard.attach(ref);
    this.inspector.attach(ref);

    this._onKey = (event) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.store.undo();
      }
      if (
        meta &&
        (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))
      ) {
        event.preventDefault();
        this.store.redo();
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const selected = this.store.getSelected();
        if (selected) {
          event.preventDefault();
          this.store.removeNode(selected.id);
        }
      }
    };
    window.addEventListener('keydown', this._onKey);

    this._unsub = this.store.subscribe(() => this._paint());
    this._paint();
  }

  render() {
    const host = document.getElementById('editor');
    D.clear(host);

    const ui = bind();
    const { div, get } = ui;

    div(
      { className: 'app', id: 'appRoot' },
      this.toolbar.shell(ui),
      this.palette.shell(ui),
      this.artboard.shell(ui),
      this.inspector.shell(ui)
    );

    const [ref, root] = get();
    this.state.ref = ref;
    this.palette.paintList(ref.id.paletteList);
    host.appendChild(root);
  }

  _paint() {
    this.artboard.paint(this.state.ref);
    this.inspector.paint(this.state.ref);
  }
}

function slugify(name) {
  return (
    String(name || 'prototype')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-_]/g, '') || 'prototype'
  );
}
