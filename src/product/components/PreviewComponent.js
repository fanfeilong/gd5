import { Component, D } from '../../engine/index.js';
import { documentToHtml } from '../lib/export.js';

/**
 * Live Preview（产品）— 模态页；壳层用 D，refresh 只绑 data。
 */
export class PreviewComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.state = {
      data: {
        doc: null,
        title: 'Live Preview',
      },
      ref: {},
    };
  }

  async componentDidMount(params) {
    const doc = params?.doc || null;
    this.state.data.doc = doc;
    if (doc?.meta?.name) {
      this.state.data.title = `预览 · ${doc.meta.name}`;
    } else {
      this.state.data.title = 'Live Preview';
    }
    this.logger.i(`PreviewComponent mounted from ${params?.source || 'unknown'}`);
  }

  componentDidUnMount() {
    if (this._onKey) {
      window.removeEventListener('keydown', this._onKey);
      this._onKey = null;
    }
    if (this.state.ref.id?.previewFrame) {
      this.state.ref.id.previewFrame.srcdoc = '';
    }
    D.clear(document.getElementById('preview'));
    this.state.ref = {};
    this.state.data.doc = null;
  }

  componentDidAttachEvents() {
    const closeBtn = this.state.ref.id?.btnClosePreview;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.navigator.goBack());
    }

    const refreshBtn = this.state.ref.id?.btnRefreshPreview;
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const name = this.state.data.doc?.meta?.name || 'Untitled';
        this.setData({
          title: `预览 · ${name} · ${new Date().toLocaleTimeString()}`,
        });
      });
    }

    this._onKey = (event) => {
      if (event.key === 'Escape') this.navigator.goBack();
    };
    window.addEventListener('keydown', this._onKey);
  }

  render() {
    const host = document.getElementById('preview');
    const hasShell = !!this.state.ref.id?.previewFrame;

    if (!hasShell) {
      D.clear(host);

      const d = new D();
      d.div({ className: 'preview-shell', id: 'previewShell' }).childList([
        d.div({ className: 'preview-shell__bar', id: 'previewBar' }).childList([
          d.span({ id: 'previewTitle', text: this.state.data.title }),
          d.div({
            className: 'preview-shell__actions',
            id: 'previewActions',
            style: { display: 'flex', gap: '8px' },
          }).childList([
            d.button({
              id: 'btnRefreshPreview',
              type: 'button',
              className: 'btn btn--ghost',
              text: '刷新',
            }),
            d.button({
              id: 'btnClosePreview',
              type: 'button',
              className: 'btn btn--ghost',
              text: '关闭',
            }),
          ]),
        ]),
        d.iframe({
          id: 'previewFrame',
          className: 'preview-shell__frame',
          title: '原型预览',
        }),
      ]);

      const [ref, root] = d.get();
      this.state.ref = ref;
      host.appendChild(root);
    }

    this._bindData();
  }

  _bindData() {
    const ids = this.state.ref.id || {};
    if (ids.previewTitle) {
      ids.previewTitle.textContent = this.state.data.title || 'Live Preview';
    }
    if (ids.previewFrame) {
      const doc = this.state.data.doc;
      ids.previewFrame.srcdoc = doc ? documentToHtml(doc) : '';
    }
  }
}
