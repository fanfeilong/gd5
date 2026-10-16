import { Component, D, bind } from '../../engine/index.js';

/**
 * 顶栏组件：撤销 / 重做 / 预览 / 导出。
 */
export class ToolbarComponent extends Component {
  constructor(navigator, logger, { store, onExport } = {}) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = store;
    this.onExport = onExport;
    this.state = { data: {}, ref: {} };
  }

  async componentDidMount() {}

  componentDidUnMount() {
    const host = this.host();
    if (host) D.clear(host);
    this.state.ref = {};
  }

  componentDidAttachEvents() {
    const ids = this.state.ref.id || {};
    ids.btnUndo?.addEventListener('click', () => this.store.undo());
    ids.btnRedo?.addEventListener('click', () => this.store.redo());
    ids.btnPreview?.addEventListener('click', () => {
      const { doc } = this.store.getState();
      this.navigator.navigate('preview', { doc });
    });
    ids.btnExport?.addEventListener('click', () => this.onExport?.());
  }

  render() {
    const host = this.host();
    if (!host) return;
    D.clear(host);

    const { header, div, span, h1, button, get } = bind();
    header(
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

    const [ref, root] = get();
    this.state.ref = ref;
    host.appendChild(root);
  }
}
