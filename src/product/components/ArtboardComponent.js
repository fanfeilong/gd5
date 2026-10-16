import { Component, D, bind } from '../../engine/index.js';
import { createNodeElement, syncNodeElement } from '../nodes/index.js';

/**
 * 画布组件：放置 / 拖动 / 选中原型节点。
 */
export class ArtboardComponent extends Component {
  constructor(navigator, logger, { store, getBlock } = {}) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = store;
    this.getBlock = getBlock;
    this._dragState = null;
    this.state = { data: {}, ref: {} };
  }

  async componentDidMount() {}

  componentDidUnMount() {
    const host = this.host();
    if (host) D.clear(host);
    this.state.ref = {};
    this._dragState = null;
  }

  componentDidAttachEvents() {
    const artboard = this.state.ref.id?.artboard;
    const canvas = this.state.ref.id?.canvas;
    if (!artboard || !canvas) return;

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
      const block = this.getBlock?.(skillId);
      if (!block) return;
      const point = clientToEl(canvas, event.clientX, event.clientY);
      this.store.addNode(block, {
        x: Math.max(0, Math.round(point.x - block.defaults.width / 2)),
        y: Math.max(0, Math.round(point.y - block.defaults.height / 2)),
      });
    });

    canvas.addEventListener('pointerdown', (event) => this._onPointerDown(event, canvas));
    canvas.addEventListener('pointermove', (event) => this._onPointerMove(event, canvas));
    canvas.addEventListener('pointerup', () => {
      this._dragState = null;
    });
  }

  render() {
    const host = this.host();
    if (!host) return;

    // 首次建壳；之后 refresh 只同步节点
    if (!this.state.ref.id?.canvas) {
      D.clear(host);
      const { main, div, get } = bind();
      main(
        { className: 'workspace', id: 'workspace' },
        div(
          { className: 'artboard-wrap', id: 'artboardWrap' },
          div(
            { className: 'artboard', id: 'artboard', dataset: { dropZone: 'true' } },
            div({ className: 'canvas', id: 'canvas' })
          )
        )
      );
      const [ref, root] = get();
      this.state.ref = ref;
      host.appendChild(root);
    }

    this._syncCanvas();
  }

  refresh() {
    this._syncCanvas();
  }

  _syncCanvas() {
    const { doc, selectedId } = this.store.getState();
    const artboard = this.state.ref.id?.artboard;
    const canvas = this.state.ref.id?.canvas;
    if (!artboard || !canvas) return;

    artboard.style.width = `${doc.meta.width}px`;
    artboard.style.height = `${doc.meta.height}px`;
    artboard.style.background = doc.meta.background || '#f7f4ef';

    const existing = new Map(
      [...canvas.querySelectorAll('.prototype-node')].map((el) => [el.dataset.id, el])
    );
    const keep = new Set();

    doc.nodes.forEach((node) => {
      keep.add(node.id);
      let el = existing.get(node.id);
      if (!el) {
        el = createNodeElement(node);
        canvas.appendChild(el);
      } else {
        syncNodeElement(el, node, selectedId);
      }
      el.classList.toggle('is-selected', node.id === selectedId);
    });

    existing.forEach((el, id) => {
      if (!keep.has(id)) el.remove();
    });
  }

  _onPointerDown(event, canvas) {
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

  _onPointerMove(event, canvas) {
    if (!this._dragState) return;
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
