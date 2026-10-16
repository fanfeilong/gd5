import { Component, D, bind } from '../../engine/index.js';
import { createStore, uid } from '../lib/store.js';
import { downloadHtml } from '../lib/export.js';
import { loadSkillBlocks } from '../lib/skills.js';

function nodeFromBlock(block, position = {}, propOverrides = {}, styleOverrides = {}) {
  return {
    id: uid('node'),
    kind: block.kind,
    label: block.label,
    x: position.x ?? 24,
    y: position.y ?? 24,
    width: position.width ?? block.defaults.width,
    height: position.height ?? block.defaults.height,
    props: { ...block.defaults.props, ...propOverrides },
    style: { ...block.defaults.style, ...styleOverrides },
  };
}

function buildStarterDoc(blocksById) {
  const nodes = [];
  if (blocksById.navbar) {
    nodes.push(nodeFromBlock(blocksById.navbar, { x: 0, y: 0, width: 390, height: 56 }));
  }
  if (blocksById.image) {
    nodes.push(nodeFromBlock(blocksById.image, { x: 35, y: 80 }));
  }
  if (blocksById.text) {
    nodes.push(
      nodeFromBlock(
        blocksById.text,
        { x: 35, y: 280, width: 320, height: 48 },
        { text: '用纯前端搭 live demo' },
        { fontSize: '24px', fontWeight: '700', color: '#1a2330' }
      )
    );
  }
  if (blocksById.card) {
    nodes.push(nodeFromBlock(blocksById.card, { x: 35, y: 350 }));
  }
  if (blocksById.button) {
    nodes.push(nodeFromBlock(blocksById.button, { x: 125, y: 520 }));
  }

  return {
    meta: {
      name: 'Untitled Prototype',
      width: 390,
      height: 844,
      background: '#f7f4ef',
    },
    nodes,
  };
}

function applyNodeStyles(el, node) {
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.style.width = `${node.width}px`;
  el.style.height = `${node.height}px`;
  Object.assign(el.style, node.style || {});
}

/** 用 D 尾参组合创建画布节点 */
function createNodeElement(node) {
  const { div, button, input, strong, p, span, get } = bind();
  const base = {
    key: node.id,
    className: 'prototype-node',
    dataset: { id: node.id, kind: node.kind },
  };

  switch (node.kind) {
    case 'button':
      button({ ...base, type: 'button', text: node.props.text || '' });
      break;
    case 'input':
      input({
        ...base,
        placeholder: node.props.placeholder || '',
        readOnly: true,
      });
      break;
    case 'card':
      div(
        base,
        strong({
          key: `${node.id}__title`,
          style: { display: 'block', marginBottom: '8px' },
          text: node.props.title || '',
        }),
        p({
          key: `${node.id}__body`,
          style: { margin: '0', opacity: '0.8' },
          text: node.props.body || '',
        })
      );
      break;
    case 'navbar':
      div(
        base,
        span({ key: `${node.id}__title`, text: node.props.title || '' }),
        span({
          key: `${node.id}__action`,
          style: { opacity: '0.7' },
          text: node.props.action || '',
        })
      );
      break;
    case 'image':
      div({ ...base, text: node.props.alt || 'Image' });
      break;
    case 'text':
    default:
      div({ ...base, text: node.props.text || '' });
      break;
  }

  const [ref, root] = get();
  root._dref = ref;
  applyNodeStyles(root, node);
  return root;
}

function fillNodeContent(el, node) {
  const keys = el._dref?.key || {};
  switch (node.kind) {
    case 'button':
      el.textContent = node.props.text || '';
      break;
    case 'input':
      el.placeholder = node.props.placeholder || '';
      el.value = '';
      break;
    case 'image':
      el.textContent = node.props.alt || 'Image';
      break;
    case 'card':
      if (keys[`${node.id}__title`]) keys[`${node.id}__title`].textContent = node.props.title || '';
      if (keys[`${node.id}__body`]) keys[`${node.id}__body`].textContent = node.props.body || '';
      break;
    case 'navbar':
      if (keys[`${node.id}__title`]) keys[`${node.id}__title`].textContent = node.props.title || '';
      if (keys[`${node.id}__action`]) keys[`${node.id}__action`].textContent = node.props.action || '';
      break;
    case 'text':
    default:
      el.textContent = node.props.text || '';
      break;
  }
}

/**
 * 编辑器主页（产品）— 壳 / 面板 / 画布节点一律走引擎 D，避免手工拼 DOM。
 */
export class EditorComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = createStore();
    this.blocks = [];
    this.blocksById = {};
    this._unsub = null;
    this._dragState = null;
    this.state = {
      data: {
        ready: false,
      },
      ref: {},
    };
  }

  async componentDidMount() {
    this.blocks = await loadSkillBlocks('skills/blocks');
    this.blocksById = Object.fromEntries(this.blocks.map((b) => [b.id, b]));
    this.store.replaceDoc(buildStarterDoc(this.blocksById), { recordHistory: false });
    this.store.clearHistory();
    this.state.data.ready = true;
    this.logger.i(`EditorComponent mounted, blocks=${this.blocks.length}`);
  }

  refresh() {
    this._paint();
  }

  componentDidUnMount() {
    if (this._unsub) {
      this._unsub();
      this._unsub = null;
    }
    if (this._onKey) {
      window.removeEventListener('keydown', this._onKey);
      this._onKey = null;
    }
    D.clear(document.getElementById('editor'));
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
    ids.btnExport?.addEventListener('click', () => {
      const { doc } = this.store.getState();
      downloadHtml(doc, `${slugify(doc.meta.name)}.html`);
    });

    ids.boardWidth?.addEventListener('change', () => {
      this.store.setMeta({ width: Number(ids.boardWidth.value) || 390 });
    });
    ids.boardHeight?.addEventListener('change', () => {
      this.store.setMeta({ height: Number(ids.boardHeight.value) || 844 });
    });

    const paletteList = ids.paletteList;
    if (paletteList) {
      paletteList.addEventListener('click', (event) => {
        const item = event.target.closest('[data-skill-id]');
        if (!item) return;
        this._addBlock(item.dataset.skillId);
      });

      paletteList.addEventListener('dragstart', (event) => {
        const item = event.target.closest('[data-skill-id]');
        if (!item) return;
        event.dataTransfer.setData('application/x-protolive-skill', item.dataset.skillId);
        event.dataTransfer.effectAllowed = 'copy';
      });
    }

    const artboard = ids.artboard;
    const canvas = ids.canvas;
    if (artboard && canvas) {
      artboard.addEventListener('dragover', (event) => {
        event.preventDefault();
        artboard.classList.add('is-dragover');
      });
      artboard.addEventListener('dragleave', () => artboard.classList.remove('is-dragover'));
      artboard.addEventListener('drop', (event) => {
        event.preventDefault();
        artboard.classList.remove('is-dragover');
        const skillId = event.dataTransfer.getData('application/x-protolive-skill');
        if (!skillId) return;
        const point = clientToEl(canvas, event.clientX, event.clientY);
        const block = this.blocksById[skillId];
        if (!block) return;
        this.store.addNode(block, {
          x: Math.max(0, Math.round(point.x - block.defaults.width / 2)),
          y: Math.max(0, Math.round(point.y - block.defaults.height / 2)),
        });
      });

      canvas.addEventListener('pointerdown', (event) => this._onPointerDown(event));
      canvas.addEventListener('pointermove', (event) => this._onPointerMove(event));
      canvas.addEventListener('pointerup', () => {
        this._dragState = null;
      });
    }

    this._onKey = (event) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.store.undo();
      }
      if (
        meta &&
        (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))
      ) {
        event.preventDefault();
        this.store.redo();
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const selected = this.store.getSelected();
        if (selected) {
          event.preventDefault();
          this.store.removeNode(selected.id);
        }
      }
    };
    window.addEventListener('keydown', this._onKey);

    this._unsub = this.store.subscribe(() => this._paint());
    this._paint();
  }

  render() {
    const host = document.getElementById('editor');
    D.clear(host);

    const { div, header, aside, main, h1, h2, p, span, button, input, label, get } = bind();

    div(
      { className: 'app', id: 'appRoot' },
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
      ),
      aside(
        { className: 'palette', id: 'palette' },
        h2({ className: 'panel-title', id: 'paletteTitle', text: '组件' }),
        p({ className: 'panel-hint', id: 'paletteHint', text: '点击或拖到画布' }),
        div({ className: 'palette__list', id: 'paletteList' })
      ),
      main(
        { className: 'workspace', id: 'workspace' },
        div(
          { className: 'artboard-wrap', id: 'artboardWrap' },
          div(
            { className: 'artboard', id: 'artboard', dataset: { dropZone: 'true' } },
            div({ className: 'canvas', id: 'canvas' })
          )
        )
      ),
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
      )
    );

    const [ref, root] = get();
    this.state.ref = ref;
    this._renderPalette(ref.id.paletteList);
    host.appendChild(root);
  }

  _renderPalette(listEl) {
    D.clear(listEl);
    const { button, span, map } = bind();
    const items = map(
      this.blocks,
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

  _addBlock(skillId) {
    const block = this.blocksById[skillId];
    if (!block) return;
    const { doc } = this.store.getState();
    const count = doc.nodes.filter((n) => n.kind === block.kind).length;
    this.store.addNode(block, {
      x: 24 + (count % 4) * 16,
      y: 72 + (count % 6) * 24,
    });
  }

  _paint() {
    const { doc, selectedId } = this.store.getState();
    const ids = this.state.ref.id || {};
    if (!ids.canvas || !ids.artboard) return;

    ids.artboard.style.width = `${doc.meta.width}px`;
    ids.artboard.style.height = `${doc.meta.height}px`;
    ids.artboard.style.background = doc.meta.background || '#f7f4ef';
    if (ids.boardWidth) ids.boardWidth.value = doc.meta.width;
    if (ids.boardHeight) ids.boardHeight.value = doc.meta.height;

    const existing = new Map(
      [...ids.canvas.querySelectorAll('.prototype-node')].map((el) => [el.dataset.id, el])
    );
    const keep = new Set();

    doc.nodes.forEach((node) => {
      keep.add(node.id);
      let el = existing.get(node.id);
      if (!el) {
        el = createNodeElement(node);
        ids.canvas.appendChild(el);
      } else {
        applyNodeStyles(el, node);
        fillNodeContent(el, node);
      }
      el.classList.toggle('is-selected', node.id === selectedId);
    });

    existing.forEach((el, id) => {
      if (!keep.has(id)) el.remove();
    });

    this._paintInspector();
  }

  _paintInspector() {
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

    const { div, p, span, label, input, textarea, button, get } = bind();
    // 先建根，避免 field 抢 root
    const rootEl = div({ key: 'inspector-root', className: 'inspector-stack' });

    const field = (labelText, controlKey, controlEl) =>
      label({ className: 'field', key: `field-${controlKey}` }, span({ text: labelText }), controlEl);

    const kids = [
      p({
        className: 'panel-hint',
        key: 'inspector-hint',
        text: `${node.label || node.kind} · ${node.id}`,
      }),
      div(
        { className: 'field-row', key: 'geo-xy' },
        field('X', 'geo-x', input({ key: 'geo-x', type: 'number', value: node.x, dataset: { geo: 'x' } })),
        field('Y', 'geo-y', input({ key: 'geo-y', type: 'number', value: node.y, dataset: { geo: 'y' } }))
      ),
      div(
        { className: 'field-row', key: 'geo-wh' },
        field(
          '宽',
          'geo-w',
          input({ key: 'geo-w', type: 'number', value: node.width, dataset: { geo: 'width' } })
        ),
        field(
          '高',
          'geo-h',
          input({ key: 'geo-h', type: 'number', value: node.height, dataset: { geo: 'height' } })
        )
      ),
    ];

    if ('text' in node.props) {
      kids.push(
        field(
          '文本',
          'prop-text',
          input({
            key: 'prop-text',
            type: 'text',
            value: node.props.text || '',
            dataset: { prop: 'text' },
          })
        )
      );
    }
    if ('placeholder' in node.props) {
      kids.push(
        field(
          '占位符',
          'prop-placeholder',
          input({
            key: 'prop-placeholder',
            type: 'text',
            value: node.props.placeholder || '',
            dataset: { prop: 'placeholder' },
          })
        )
      );
    }
    if ('title' in node.props) {
      kids.push(
        field(
          '标题',
          'prop-title',
          input({
            key: 'prop-title',
            type: 'text',
            value: node.props.title || '',
            dataset: { prop: 'title' },
          })
        )
      );
    }
    if ('body' in node.props) {
      kids.push(
        field(
          '正文',
          'prop-body',
          textarea({
            key: 'prop-body',
            rows: 3,
            value: node.props.body || '',
            dataset: { prop: 'body' },
          })
        )
      );
    }
    if ('action' in node.props) {
      kids.push(
        field(
          '操作文案',
          'prop-action',
          input({
            key: 'prop-action',
            type: 'text',
            value: node.props.action || '',
            dataset: { prop: 'action' },
          })
        )
      );
    }
    if ('alt' in node.props) {
      kids.push(
        field(
          '说明',
          'prop-alt',
          input({
            key: 'prop-alt',
            type: 'text',
            value: node.props.alt || '',
            dataset: { prop: 'alt' },
          })
        )
      );
    }

    kids.push(
      field(
        '背景色',
        'style-bg',
        input({
          key: 'style-bg',
          type: 'text',
          value: node.style.background || '',
          dataset: { style: 'background' },
        })
      ),
      field(
        '文字色',
        'style-color',
        input({
          key: 'style-color',
          type: 'text',
          value: node.style.color || '',
          dataset: { style: 'color' },
        })
      ),
      field(
        '字号',
        'style-fs',
        input({
          key: 'style-fs',
          type: 'text',
          value: node.style.fontSize || '',
          dataset: { style: 'fontSize' },
        })
      ),
      field(
        '圆角',
        'style-br',
        input({
          key: 'style-br',
          type: 'text',
          value: node.style.borderRadius || '',
          dataset: { style: 'borderRadius' },
        })
      ),
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
    const [ref, root] = get();
    body.appendChild(root);

    Object.values(ref.key || {}).forEach((el) => {
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

  _onPointerDown(event) {
    const canvas = this.state.ref.id?.canvas;
    if (!canvas) return;
    const target = event.target.closest('.prototype-node');
    if (!target) {
      this.store.select(null);
      return;
    }
    event.preventDefault();
    const id = target.dataset.id;
    this.store.select(id);
    const node = this.store.getState().doc.nodes.find((n) => n.id === id);
    if (!node) return;
    const point = clientToEl(canvas, event.clientX, event.clientY);
    this.store.beginGesture();
    this._dragState = {
      id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    };
    target.setPointerCapture(event.pointerId);
  }

  _onPointerMove(event) {
    if (!this._dragState) return;
    const canvas = this.state.ref.id?.canvas;
    if (!canvas) return;
    const point = clientToEl(canvas, event.clientX, event.clientY);
    const x = Math.max(0, Math.round(point.x - this._dragState.offsetX));
    const y = Math.max(0, Math.round(point.y - this._dragState.offsetY));
    this.store.updateNode(this._dragState.id, { x, y }, { recordHistory: false });
  }
}

function clientToEl(el, clientX, clientY) {
  const rect = el.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function slugify(name) {
  return (
    String(name || 'prototype')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-_]/g, '') || 'prototype'
  );
}
