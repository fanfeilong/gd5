import { Component, D, bind } from '../../engine/index.js';
import { inspectorModel } from '../nodes/index.js';

/**
 * 属性面板：壳与动态字段的 onChange / onClick 都写在 props 里。
 */
export class InspectorComponent extends Component {
  static styles = new URL('./InspectorComponent.css', import.meta.url);

  constructor(navigator, logger, { store } = {}) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = store;
  }

  render() {
    this.ensureShell(
      (ids) => ids.inspectorBody,
      ({ aside, h2, div, label, span, input }) => {
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
                onChange: () => {
                  this.store.setMeta({ width: Number(this.ids().boardWidth.value) || 390 });
                },
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
                onChange: () => {
                  this.store.setMeta({ height: Number(this.ids().boardHeight.value) || 844 });
                },
              })
            )
          )
        );
      }
    );
    this._syncMeta();
    this._paintBody();
  }

  refresh() {
    this._syncMeta();
    this._paintBody();
  }

  _syncMeta() {
    const { doc } = this.store.getState();
    const { boardWidth, boardHeight } = this.ids();
    if (boardWidth) boardWidth.value = doc.meta.width;
    if (boardHeight) boardHeight.value = doc.meta.height;
  }

  _paintBody() {
    const body = this.ids().inspectorBody;
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
            onChange: (event) => {
              this.store.updateNode(node.id, {
                [model.geometry[0].geo]: Number(event.target.value) || 0,
              });
            },
          })
        ),
        field(
          model.geometry[1].label,
          'geo-y',
          input({
            key: 'geo-y',
            type: 'number',
            value: model.geometry[1].value,
            onChange: (event) => {
              this.store.updateNode(node.id, {
                [model.geometry[1].geo]: Number(event.target.value) || 0,
              });
            },
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
            onChange: (event) => {
              this.store.updateNode(node.id, {
                [model.geometry[2].geo]: Number(event.target.value) || 0,
              });
            },
          })
        ),
        field(
          model.geometry[3].label,
          'geo-h',
          input({
            key: 'geo-h',
            type: 'number',
            value: model.geometry[3].value,
            onChange: (event) => {
              this.store.updateNode(node.id, {
                [model.geometry[3].geo]: Number(event.target.value) || 0,
              });
            },
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
              onChange: (event) => {
                this.store.updateNode(node.id, { props: { [f.prop]: event.target.value } });
              },
            })
          : input({
              key: `prop-${f.prop}`,
              type: 'text',
              value: f.value,
              onChange: (event) => {
                this.store.updateNode(node.id, { props: { [f.prop]: event.target.value } });
              },
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
            onChange: (event) => {
              this.store.updateNode(node.id, { style: { [f.style]: event.target.value } });
            },
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
          onClick: () => this.store.removeNode(node.id),
        })
      )
    );

    rootEl.childList(kids);
    body.appendChild(get()[1]);
  }
}
