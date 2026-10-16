import { Component } from '../../engine/index.js';

/**
 * 积木面板。业务只收 store / blocks；runtime 默认继承。
 */
export class PaletteComponent extends Component {
  static styles = new URL('./PaletteComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
    this.getBlocks = deps.getBlocks;
    this.getBlock = deps.getBlock;
  }

  render() {
    this.ensureShell(
      (ids) => ids.palette,
      ({ aside, h2, p, div, button, span, map }) => {
        aside(
          { className: 'palette', id: 'palette' },
          h2({ className: 'panel-title', id: 'paletteTitle', text: '组件' }),
          p({ className: 'panel-hint', id: 'paletteHint', text: '点击或拖到画布' }),
          div(
            {
              className: 'palette__list',
              id: 'paletteList',
              onClick: (event) => {
                const item = event.target.closest('[data-skill-id]');
                if (!item) return;
                this._addBlock(item.dataset.skillId);
              },
              onDragStart: (event) => {
                const item = event.target.closest('[data-skill-id]');
                if (!item) return;
                event.dataTransfer.setData('application/x-protolive-skill', item.dataset.skillId);
                event.dataTransfer.effectAllowed = 'copy';
              },
            },
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
      }
    );
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
