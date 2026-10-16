import { Component, D, bind } from '../../engine/index.js';

/**
 * 积木面板组件：列出 blocks，点击 / 拖放到画布。
 */
export class PaletteComponent extends Component {
  constructor(navigator, logger, { store, getBlocks, getBlock } = {}) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = store;
    this.getBlocks = getBlocks;
    this.getBlock = getBlock;
    this.state = { data: {}, ref: {} };
  }

  async componentDidMount() {}

  componentDidUnMount() {
    const host = this.host();
    if (host) D.clear(host);
    this.state.ref = {};
  }

  componentDidAttachEvents() {
    const list = this.state.ref.id?.paletteList;
    if (!list) return;

    list.addEventListener('click', (event) => {
      const item = event.target.closest('[data-skill-id]');
      if (!item) return;
      this._addBlock(item.dataset.skillId);
    });

    list.addEventListener('dragstart', (event) => {
      const item = event.target.closest('[data-skill-id]');
      if (!item) return;
      event.dataTransfer.setData('application/x-protolive-skill', item.dataset.skillId);
      event.dataTransfer.effectAllowed = 'copy';
    });
  }

  render() {
    const host = this.host();
    if (!host) return;
    D.clear(host);

    const { aside, h2, p, div, button, span, map, get } = bind();
    aside(
      { className: 'palette', id: 'palette' },
      h2({ className: 'panel-title', id: 'paletteTitle', text: '组件' }),
      p({ className: 'panel-hint', id: 'paletteHint', text: '点击或拖到画布' }),
      div(
        { className: 'palette__list', id: 'paletteList' },
        ...map(
          this.getBlocks?.() || [],
          (block, _i, key) =>
            button(
              {
                key,
                type: 'button',
                className: 'palette-item',
                draggable: true,
                dataset: { skillId: block.id },
              },
              span({
                className: 'palette-item__icon',
                text: block.icon || block.kind.slice(0, 3).toUpperCase(),
              }),
              span({ className: 'palette-item__label', text: block.label })
            ),
          (block) => `palette-${block.id}`
        )
      )
    );

    const [ref, root] = get();
    this.state.ref = ref;
    host.appendChild(root);
  }

  _addBlock(skillId) {
    const block = this.getBlock?.(skillId);
    if (!block) return;
    const { doc } = this.store.getState();
    const count = doc.nodes.filter((n) => n.kind === block.kind).length;
    this.store.addNode(block, {
      x: 24 + (count % 4) * 16,
      y: 72 + (count % 6) * 24,
    });
  }
}
