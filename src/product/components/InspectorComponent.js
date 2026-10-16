import { Component, D, bind } from '../../engine/index.js';
import { inspectorModel } from '../nodes/index.js';

/**
 * 属性面板组件：按 inspectorModel 渲染，不做 kind 分支。
 */
export class InspectorComponent extends Component {
  constructor(navigator, logger, { store } = {}) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = store;
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
    ids.boardWidth?.addEventListener('change', () => {
      this.store.setMeta({ width: Number(ids.boardWidth.value) || 390 });
    });
    ids.boardHeight?.addEventListener('change', () => {
      this.store.setMeta({ height: Number(ids.boardHeight.value) || 844 });
    });
  }

  render() {
    const host = this.host();
    if (!host) return;

    if (!this.state.ref.id?.inspectorBody) {
      D.clear(host);
      const { aside, h2, div, label, span, input, get } = bind();
      aside(
        { className: 'inspector', id: 'inspector' },
        h2({ className: 'panel-title', id: 'inspectorTitle', text: '属性' }),
        div({ className: 'inspector__body', id: 'inspectorBody' }),
        div(
          { className: 'inspector__meta', id: 'inspectorMeta' },
          label(
            { className: 'field', id: 'fieldWidth' },
            span({ id: 'labelWidth', text: '画布宽度' }),
            input({
              id: 'boardWidth',
              type: 'number',
              min: 320,
              max: 1440,
              step: 10,
              value: 390,
            })
          ),
          label(
            { className: 'field', id: 'fieldHeight' },
            span({ id: 'labelHeight', text: '画布高度' }),
            input({
              id: 'boardHeight',
              type: 'number',
              min: 480,
              max: 2000,
              step: 10,
              value: 844,
            })
          )
        )
      );
      const [ref, root] = get();
      this.state.ref = ref;
      host.appendChild(root);
    }

    this._syncMeta();
    this._paintBody();
  }

  refresh() {
    this._syncMeta();
    this._paintBody();
  }

  _syncMeta() {
    const { doc } = this.store.getState();
    const ids = this.state.ref.id || {};
    if (ids.boardWidth) ids.boardWidth.value = doc.meta.width;
    if (ids.boardHeight) ids.boardHeight.value = doc.meta.height;
  }

  _paintBody() {
    const body = this.state.ref.id?.inspectorBody;
    if (!body) return;
    D.clear(body);

    const node = this.store.getSelected();
    if (!node) {
      const { p, get } = bind();
      p({
        className: 'empty-state',
        key: 'inspector-empty',
        text: '选中画布上的元素以编辑属性',
      });
      body.appendChild(get()[1]);
      return;
    }

    const model = inspectorModel(node);
    const { div, p, span, label, input, textarea, button, get } = bind();
    const rootEl = div({ key: 'inspector-root', className: 'inspector-stack' });

    const field = (labelText, controlKey, controlEl) =>
      label({ className: 'field', key: `field-${controlKey}` }, span({ text: labelText }), controlEl);

    const kids = [
      p({ className: 'panel-hint', key: 'inspector-hint', text: model.hint }),
      div(
        { className: 'field-row', key: 'geo-xy' },
        field(
          model.geometry[0].label,
          'geo-x',
          input({
            key: 'geo-x',
            type: 'number',
            value: model.geometry[0].value,
            dataset: { geo: model.geometry[0].geo },
          })
        ),
        field(
          model.geometry[1].label,
          'geo-y',
          input({
            key: 'geo-y',
            type: 'number',
            value: model.geometry[1].value,
            dataset: { geo: model.geometry[1].geo },
          })
        )
      ),
      div(
        { className: 'field-row', key: 'geo-wh' },
        field(
          model.geometry[2].label,
          'geo-w',
          input({
            key: 'geo-w',
            type: 'number',
            value: model.geometry[2].value,
            dataset: { geo: model.geometry[2].geo },
          })
        ),
        field(
          model.geometry[3].label,
          'geo-h',
          input({
            key: 'geo-h',
            type: 'number',
            value: model.geometry[3].value,
            dataset: { geo: model.geometry[3].geo },
          })
        )
      ),
    ];

    model.props.forEach((f) => {
      const control =
        f.control === 'textarea'
          ? textarea({
              key: `prop-${f.prop}`,
              rows: 3,
              value: f.value,
              dataset: { prop: f.prop },
            })
          : input({
              key: `prop-${f.prop}`,
              type: 'text',
              value: f.value,
              dataset: { prop: f.prop },
            });
      kids.push(field(f.label, `prop-${f.prop}`, control));
    });

    model.styles.forEach((f) => {
      kids.push(
        field(
          f.label,
          `style-${f.style}`,
          input({
            key: `style-${f.style}`,
            type: 'text',
            value: f.value,
            dataset: { style: f.style },
          })
        )
      );
    });

    kids.push(
      div(
        { className: 'inspector-actions', key: 'inspector-actions' },
        button({
          key: 'btn-delete',
          type: 'button',
          className: 'btn btn--danger',
          text: '删除',
          dataset: { action: 'delete' },
        })
      )
    );

    rootEl.childList(kids);
    const [treeRef, root] = get();
    body.appendChild(root);

    Object.values(treeRef.key || {}).forEach((el) => {
      if (!el || !el.dataset) return;
      if (el.dataset.prop) {
        el.addEventListener('change', () => {
          this.store.updateNode(node.id, { props: { [el.dataset.prop]: el.value } });
        });
      }
      if (el.dataset.geo) {
        el.addEventListener('change', () => {
          this.store.updateNode(node.id, { [el.dataset.geo]: Number(el.value) || 0 });
        });
      }
      if (el.dataset.style) {
        el.addEventListener('change', () => {
          this.store.updateNode(node.id, { style: { [el.dataset.style]: el.value } });
        });
      }
      if (el.dataset.action === 'delete') {
        el.addEventListener('click', () => this.store.removeNode(node.id));
      }
    });
  }
}
