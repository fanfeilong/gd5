import { D, bind } from '../../engine/index.js';

/**
 * 左侧积木面板：列出 blocks，点击 / 拖放到画布。
 */
export class PaletteView {
  constructor({ store, getBlocks, getBlock }) {
    this.store = store;
    this.getBlocks = getBlocks;
    this.getBlock = getBlock;
  }

  shell(ui) {
    const { aside, h2, p, div } = ui;
    return aside(
      { className: 'palette', id: 'palette' },
      h2({ className: 'panel-title', id: 'paletteTitle', text: '组件' }),
      p({ className: 'panel-hint', id: 'paletteHint', text: '点击或拖到画布' }),
      div({ className: 'palette__list', id: 'paletteList' })
    );
  }

  /** 列表单独填充（map 多根） */
  paintList(listEl) {
    if (!listEl) return;
    D.clear(listEl);
    const { button, span, map } = bind();
    const items = map(
      this.getBlocks(),
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
    );
    items.forEach((item) => listEl.appendChild(item.dom()));
  }

  attach(ref) {
    const list = ref.id?.paletteList;
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

  _addBlock(skillId) {
    const block = this.getBlock(skillId);
    if (!block) return;
    const { doc } = this.store.getState();
    const count = doc.nodes.filter((n) => n.kind === block.kind).length;
    this.store.addNode(block, {
      x: 24 + (count % 4) * 16,
      y: 72 + (count % 6) * 24,
    });
  }
}
