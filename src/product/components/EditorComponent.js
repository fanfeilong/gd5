import { Component, D } from '../../engine/index.js';
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

function fillNodeContent(el, node) {
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
      el.innerHTML =
        '<strong style="display:block;margin-bottom:8px"></strong><p style="margin:0;opacity:.8"></p>';
      el.querySelector('strong').textContent = node.props.title || '';
      el.querySelector('p').textContent = node.props.body || '';
      break;
    case 'navbar':
      el.innerHTML = '<span></span><span style="opacity:.7"></span>';
      el.children[0].textContent = node.props.title || '';
      el.children[1].textContent = node.props.action || '';
      break;
    case 'text':
    default:
      el.textContent = node.props.text || '';
      break;
  }
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * 编辑器主页（产品）— 用引擎 Component 生命周期驱动，
 * 壳层 DOM 用引擎 D 构建；画布节点为产品态数据绑定。
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
    const ref = this.state.ref;
    const ids = ref.id || {};

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

    const d = new D();
    d.div({ className: 'app', id: 'appRoot' }).childList([
      d.header({ className: 'toolbar', id: 'toolbar' }).childList([
        d.div({ className: 'toolbar__brand', id: 'brand' }).childList([
          d.span({ className: 'toolbar__mark', id: 'brandMark' }),
          d.h1({ className: 'toolbar__title', id: 'brandTitle', text: 'ProtoLive' }),
        ]),
        d.div({ className: 'toolbar__actions', id: 'toolbarActions' }).childList([
          d.button({ id: 'btnUndo', type: 'button', className: 'btnUndo', text: '撤销' }),
          d.button({ id: 'btnRedo', type: 'button', className: 'btnRedo', text: '重做' }),
          d.button({ id: 'btnPreview', type: 'button', className: 'btnPreview', text: '预览' }),
          d.button({ id: 'btnExport', type: 'button', className: 'btnExport', text: '导出 HTML' }),
        ]),
      ]),
      d.aside({ className: 'palette', id: 'palette' }).childList([
        d.h2({ className: 'paletteTitle', id: 'paletteTitle', text: '组件' }),
        d.p({ className: 'paletteHint', id: 'paletteHint', text: '点击或拖到画布' }),
        d.div({ className: 'palette__list', id: 'paletteList' }),
      ]),
      d.main({ className: 'workspace', id: 'workspace' }).childList([
        d.div({ className: 'artboard-wrap', id: 'artboardWrap' }).childList([
          d.div({ className: 'artboard', id: 'artboard' }).childList([
            d.div({ className: 'canvas', id: 'canvas' }),
          ]),
        ]),
      ]),
      d.aside({ className: 'inspector', id: 'inspector' }).childList([
        d.h2({ className: 'inspectorTitle', id: 'inspectorTitle', text: '属性' }),
        d.div({ className: 'inspector__body', id: 'inspectorBody' }),
        d.div({ className: 'inspector__meta', id: 'inspectorMeta' }).childList([
          d.label({ className: 'fieldWidth', id: 'fieldWidth' }).childList([
            d.span({ id: 'labelWidth', text: '画布宽度' }),
            d.input({ id: 'boardWidth', type: 'number', min: 320, max: 1440, step: 10, value: 390 }),
          ]),
          d.label({ className: 'fieldHeight', id: 'fieldHeight' }).childList([
            d.span({ id: 'labelHeight', text: '画布高度' }),
            d.input({
              id: 'boardHeight',
              type: 'number',
              min: 480,
              max: 2000,
              step: 10,
              value: 844,
            }),
          ]),
        ]),
      ]),
    ]);

    const [ref, root] = d.get();
    this.state.ref = ref;

    // D 要求同次构建 className 唯一；再映射到产品 CSS class
    ref.id.btnUndo.className = 'btn btn--ghost';
    ref.id.btnRedo.className = 'btn btn--ghost';
    ref.id.btnPreview.className = 'btn btn--secondary';
    ref.id.btnExport.className = 'btn btn--primary';
    ref.id.paletteTitle.className = 'panel-title';
    ref.id.paletteHint.className = 'panel-hint';
    ref.id.inspectorTitle.className = 'panel-title';
    ref.id.fieldWidth.className = 'field';
    ref.id.fieldHeight.className = 'field';
    ref.id.artboard.dataset.dropZone = 'true';

    this._renderPalette(ref.id.paletteList);
    host.appendChild(root);
  }

  _renderPalette(listEl) {
    D.clear(listEl);
    this.blocks.forEach((block) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'palette-item';
      item.draggable = true;
      item.dataset.skillId = block.id;
      item.innerHTML = `
        <span class="palette-item__icon">${block.icon || block.kind.slice(0, 3).toUpperCase()}</span>
        <span class="palette-item__label">${block.label}</span>
      `;
      listEl.appendChild(item);
    });
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
        const tag = node.kind === 'button' ? 'button' : node.kind === 'input' ? 'input' : 'div';
        el = document.createElement(tag);
        if (tag === 'button') el.type = 'button';
        if (tag === 'input') el.readOnly = true;
        el.className = 'prototype-node';
        el.dataset.id = node.id;
        el.dataset.kind = node.kind;
        ids.canvas.appendChild(el);
      }
      applyNodeStyles(el, node);
      fillNodeContent(el, node);
      el.classList.toggle('is-selected', node.id === selectedId);
    });

    existing.forEach((el, id) => {
      if (!keep.has(id)) el.remove();
    });

    this._paintInspector(selectedId);
  }

  _paintInspector(selectedId) {
    const body = this.state.ref.id?.inspectorBody;
    if (!body) return;
    const node = this.store.getSelected();
    if (!node) {
      body.innerHTML = '<p class="empty-state">选中画布上的元素以编辑属性</p>';
      return;
    }

    const propFields = [];
    if ('text' in node.props) {
      propFields.push(
        `<label class="field"><span>文本</span><input data-prop="text" type="text" value="${escapeAttr(node.props.text)}"></label>`
      );
    }
    if ('placeholder' in node.props) {
      propFields.push(
        `<label class="field"><span>占位符</span><input data-prop="placeholder" type="text" value="${escapeAttr(node.props.placeholder)}"></label>`
      );
    }
    if ('title' in node.props) {
      propFields.push(
        `<label class="field"><span>标题</span><input data-prop="title" type="text" value="${escapeAttr(node.props.title)}"></label>`
      );
    }
    if ('body' in node.props) {
      propFields.push(
        `<label class="field"><span>正文</span><textarea data-prop="body" rows="3">${escapeAttr(node.props.body)}</textarea></label>`
      );
    }
    if ('action' in node.props) {
      propFields.push(
        `<label class="field"><span>操作文案</span><input data-prop="action" type="text" value="${escapeAttr(node.props.action)}"></label>`
      );
    }
    if ('alt' in node.props) {
      propFields.push(
        `<label class="field"><span>说明</span><input data-prop="alt" type="text" value="${escapeAttr(node.props.alt)}"></label>`
      );
    }

    body.innerHTML = `
      <p class="panel-hint">${node.label || node.kind} · ${node.id}</p>
      <div class="field-row">
        <label class="field"><span>X</span><input data-geo="x" type="number" value="${node.x}"></label>
        <label class="field"><span>Y</span><input data-geo="y" type="number" value="${node.y}"></label>
      </div>
      <div class="field-row">
        <label class="field"><span>宽</span><input data-geo="width" type="number" value="${node.width}"></label>
        <label class="field"><span>高</span><input data-geo="height" type="number" value="${node.height}"></label>
      </div>
      ${propFields.join('')}
      <label class="field"><span>背景色</span><input data-style="background" type="text" value="${escapeAttr(node.style.background || '')}"></label>
      <label class="field"><span>文字色</span><input data-style="color" type="text" value="${escapeAttr(node.style.color || '')}"></label>
      <label class="field"><span>字号</span><input data-style="fontSize" type="text" value="${escapeAttr(node.style.fontSize || '')}"></label>
      <label class="field"><span>圆角</span><input data-style="borderRadius" type="text" value="${escapeAttr(node.style.borderRadius || '')}"></label>
      <div class="inspector-actions">
        <button type="button" class="btn btn--danger" data-action="delete">删除</button>
      </div>
    `;

    body.querySelectorAll('[data-prop]').forEach((input) => {
      input.addEventListener('change', () => {
        this.store.updateNode(node.id, { props: { [input.dataset.prop]: input.value } });
      });
    });
    body.querySelectorAll('[data-geo]').forEach((input) => {
      input.addEventListener('change', () => {
        this.store.updateNode(node.id, { [input.dataset.geo]: Number(input.value) || 0 });
      });
    });
    body.querySelectorAll('[data-style]').forEach((input) => {
      input.addEventListener('change', () => {
        this.store.updateNode(node.id, { style: { [input.dataset.style]: input.value } });
      });
    });
    body.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      this.store.removeNode(node.id);
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
