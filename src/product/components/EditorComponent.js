import { Component, D, bind } from '../../engine/index.js';
import { createStore } from '../lib/store.js';
import { downloadHtml } from '../lib/export.js';
import { loadSkillBlocks } from '../lib/skills.js';
import { buildStarterDoc } from '../lib/starter.js';
import { ToolbarComponent } from './ToolbarComponent.js';
import { PaletteComponent } from './PaletteComponent.js';
import { ArtboardComponent } from './ArtboardComponent.js';
import { InspectorComponent } from './InspectorComponent.js';

/**
 * 编辑器页 — 组合子 Component：先画宿主槽，再 mount 子组件。
 * 子模块同样走 DidMount / render / AttachEvents / refresh / unmount。
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

    const deps = {
      store: this.store,
      getBlocks: () => this.blocks,
      getBlock: (id) => this.blocksById[id],
      onExport: () => {
        const { doc } = this.store.getState();
        downloadHtml(doc, `${slugify(doc.meta.name)}.html`);
      },
    };

    this.toolbar = new ToolbarComponent(navigator, logger, deps);
    this.palette = new PaletteComponent(navigator, logger, deps);
    this.artboard = new ArtboardComponent(navigator, logger, deps);
    this.inspector = new InspectorComponent(navigator, logger, deps);
    this.children = [this.toolbar, this.palette, this.artboard, this.inspector];
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
    this.artboard.refresh();
    this.inspector.refresh();
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
    this.children.forEach((child) => child.unmount());
    D.clear(document.getElementById('editor'));
    this.state.ref = {};
  }

  componentDidAttachEvents() {
    // 宿主已在 render 中建好 → 挂载子 Component
    void this._mountChildren();

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
  }

  async _mountChildren() {
    await this.toolbar.mount('host-toolbar');
    await this.palette.mount('host-palette');
    await this.artboard.mount('host-artboard');
    await this.inspector.mount('host-inspector');

    this._unsub = this.store.subscribe(() => this.refresh());
    this.refresh();
  }

  render() {
    const host = document.getElementById('editor');
    D.clear(host);

    const { div, get } = bind();
    // display:contents 宿主：子 Component 根节点直接参与 .app 网格
    div(
      { className: 'app', id: 'appRoot' },
      div({ id: 'host-toolbar', className: 'component-host' }),
      div({ id: 'host-palette', className: 'component-host' }),
      div({ id: 'host-artboard', className: 'component-host' }),
      div({ id: 'host-inspector', className: 'component-host' })
    );

    const [ref, root] = get();
    this.state.ref = ref;
    host.appendChild(root);
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
