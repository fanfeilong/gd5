import { Component } from '../../engine/index.js';
import { documentToHtml } from '../lib/export.js';

/**
 * Live Preview — this.navigator 默认可用。
 */
export class PreviewComponent extends Component {
  static styles = new URL('./PreviewComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.state.data.doc = null;
    this.state.data.title = 'Live Preview';
  }

  async componentDidMount(params) {
    const doc = params?.doc || null;
    this.state.data.doc = doc;
    this.state.data.title = doc?.meta?.name ? `预览 · ${doc.meta.name}` : 'Live Preview';
    this.logger?.i(`PreviewComponent mounted from ${params?.source || 'unknown'}`);
  }

  componentDidUnMount() {
    const frame = this.ids().previewFrame;
    if (frame) frame.srcdoc = '';
    this.state.data.doc = null;
  }

  componentDidAttachEvents() {
    this.on(window, 'keydown', (event) => {
      if (event.key === 'Escape') this.navigator.goBack();
    });
  }

  render() {
    this.ensureShell(
      (ids) => ids.previewFrame,
      ({ div, span, button, iframe }) => {
        div(
          { className: 'preview-shell', id: 'previewShell' },
          div(
            { className: 'preview-shell__bar', id: 'previewBar' },
            span({ id: 'previewTitle', text: this.state.data.title }),
            div(
              {
                className: 'preview-shell__actions',
                id: 'previewActions',
                style: { display: 'flex', gap: '8px' },
              },
              button({
                id: 'btnRefreshPreview',
                type: 'button',
                className: 'btn btn--ghost',
                text: '刷新',
                onClick: () => {
                  const name = this.state.data.doc?.meta?.name || 'Untitled';
                  this.setData({
                    title: `预览 · ${name} · ${new Date().toLocaleTimeString()}`,
                  });
                },
              }),
              button({
                id: 'btnClosePreview',
                type: 'button',
                className: 'btn btn--ghost',
                text: '关闭',
                onClick: () => this.navigator.goBack(),
              })
            )
          ),
          iframe({
            id: 'previewFrame',
            className: 'preview-shell__frame',
            title: '原型预览',
          })
        );
      }
    );
    this._bindData();
  }

  _bindData() {
    const { previewTitle, previewFrame } = this.ids();
    if (previewTitle) {
      previewTitle.textContent = this.state.data.title || 'Live Preview';
    }
    if (previewFrame) {
      const doc = this.state.data.doc;
      previewFrame.srcdoc = doc ? documentToHtml(doc) : '';
    }
  }
}
