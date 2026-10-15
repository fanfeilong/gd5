import { Component, D } from '../../engine/index.js';
import { documentToHtml } from '../lib/export.js';

/**
 * Live Preview（产品）— 模态页，通过 navigator.navigate('preview', { doc }) 打开，
 * goBack() 关闭。依赖引擎的 isModal 透底行为。
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
    this.state.data.doc = params?.doc || null;
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

    this._onKey = (event) => {
      if (event.key === 'Escape') this.navigator.goBack();
    };
    window.addEventListener('keydown', this._onKey);
  }

  render() {
    const host = document.getElementById('preview');
    D.clear(host);

    const d = new D();
    d.div({ className: 'preview-shell', id: 'previewShell' }).childList([
      d.div({ className: 'preview-shell__bar', id: 'previewBar' }).childList([
        d.span({ id: 'previewTitle', text: this.state.data.title }),
        d.button({
          id: 'btnClosePreview',
          type: 'button',
          className: 'btn',
          text: '关闭',
        }),
      ]),
      d.iframe({
        id: 'previewFrame',
        className: 'preview-shell__frame',
        title: '原型预览',
      }),
    ]);

    // D indexes className as unique keys; button needs btn--ghost via classList after create
    const [ref, root] = d.get();
    ref.id.btnClosePreview.classList.add('btn--ghost');
    this.state.ref = ref;
    host.appendChild(root);

    const doc = this.state.data.doc;
    if (doc) {
      ref.id.previewFrame.srcdoc = documentToHtml(doc);
    }
  }
}
