import { Component } from '../../engine/index.js';
import { createStore } from '../lib/store.js';
import { downloadHtml } from '../lib/export.js';
import { loadSkillBlocks } from '../lib/skills.js';
import { buildStarterDoc } from '../lib/starter.js';
import { ToolbarComponent } from './ToolbarComponent.js';
import { PaletteComponent } from './PaletteComponent.js';
import { ArtboardComponent } from './ArtboardComponent.js';
import { InspectorComponent } from './InspectorComponent.js';

/**
 * 编辑器页 — 子组件仍是 new Child(业务 deps)；导航留在页面（this.navigator 默认有）。
 */
export class EditorComponent extends Component {
  static styles = new URL('./EditorComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = createStore();
    this.blocks = [];
    this.blocksById = {};
    this._unsub = null;
    this.state.data.ready = false;

    // 页面构造时已有 this.navigator / this.logger；下传给子组件后用法相同
    const panelDeps = {
      navigator: this.navigator,
      logger: this.logger,
      store: this.store,
      getBlocks: () => this.blocks,
      getBlock: (id) => this.blocksById[id],
      onExport: () => {
        const { doc } = this.store.getState();
        downloadHtml(doc, `${slugify(doc.meta.name)}.html`);
      },
    };

    this.toolbar = new ToolbarComponent(panelDeps);
    this.palette = new PaletteComponent(panelDeps);
    this.artboard = new ArtboardComponent(panelDeps);
    this.inspector = new InspectorComponent(panelDeps);
    this.children = [this.toolbar, this.palette, this.artboard, this.inspector];
  }

  async componentDidMount() {
    this.blocks = await loadSkillBlocks('skills/blocks');
    this.blocksById = Object.fromEntries(this.blocks.map((b) => [b.id, b]));
    this.store.replaceDoc(buildStarterDoc(this.blocksById), { recordHistory: false });
    this.store.clearHistory();
    this.state.data.ready = true;
    this.logger?.i(`EditorComponent mounted, blocks=${this.blocks.length}`);
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
    this.children.forEach((child) => child.unmount());
  }

  componentDidAttachEvents() {
    void this._mountChildren();

    this.on(window, 'keydown', (event) => {
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
    });
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
    this.ensureShell(
      (ids) => ids.appRoot,
      ({ div }) => {
        div(
          { className: 'app', id: 'appRoot' },
          div({ id: 'host-toolbar', className: 'component-host' }),
          div({ id: 'host-palette', className: 'component-host' }),
          div({ id: 'host-artboard', className: 'component-host' }),
          div({ id: 'host-inspector', className: 'component-host' })
        );
      }
    );
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
