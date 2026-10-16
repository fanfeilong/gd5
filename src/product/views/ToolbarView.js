/**
 * 顶栏：撤销 / 重做 / 预览 / 导出。只负责这一件事。
 */
export class ToolbarView {
  constructor({ store, navigator, onExport }) {
    this.store = store;
    this.navigator = navigator;
    this.onExport = onExport;
  }

  /** @param {ReturnType<import('../../engine/index.js').bind>} ui */
  shell(ui) {
    const { header, div, span, h1, button } = ui;
    return header(
      { className: 'toolbar', id: 'toolbar' },
      div(
        { className: 'toolbar__brand', id: 'brand' },
        span({ className: 'toolbar__mark', id: 'brandMark' }),
        h1({ className: 'toolbar__title', id: 'brandTitle', text: 'ProtoLive' })
      ),
      div(
        { className: 'toolbar__actions', id: 'toolbarActions' },
        button({ id: 'btnUndo', type: 'button', className: 'btn btn--ghost', text: '撤销' }),
        button({ id: 'btnRedo', type: 'button', className: 'btn btn--ghost', text: '重做' }),
        button({
          id: 'btnPreview',
          type: 'button',
          className: 'btn btn--secondary',
          text: '预览',
        }),
        button({
          id: 'btnExport',
          type: 'button',
          className: 'btn btn--primary',
          text: '导出 HTML',
        })
      )
    );
  }

  attach(ref) {
    const ids = ref.id || {};
    ids.btnUndo?.addEventListener('click', () => this.store.undo());
    ids.btnRedo?.addEventListener('click', () => this.store.redo());
    ids.btnPreview?.addEventListener('click', () => {
      const { doc } = this.store.getState();
      this.navigator.navigate('preview', { doc });
    });
    ids.btnExport?.addEventListener('click', () => this.onExport?.());
  }
}
