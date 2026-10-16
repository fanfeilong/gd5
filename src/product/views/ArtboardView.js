import { createNodeElement, syncNodeElement } from '../nodes/index.js';

/**
 * 中央画布：放置 / 拖动 / 选中原型节点。
 */
export class ArtboardView {
  constructor({ store, getBlock }) {
    this.store = store;
    this.getBlock = getBlock;
    this._dragState = null;
  }

  shell(ui) {
    const { main, div } = ui;
    return main(
      { className: 'workspace', id: 'workspace' },
      div(
        { className: 'artboard-wrap', id: 'artboardWrap' },
        div(
          { className: 'artboard', id: 'artboard', dataset: { dropZone: 'true' } },
          div({ className: 'canvas', id: 'canvas' })
        )
      )
    );
  }

  attach(ref) {
    const artboard = ref.id?.artboard;
    const canvas = ref.id?.canvas;
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
      const block = this.getBlock(skillId);
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

  paint(ref) {
    const { doc, selectedId } = this.store.getState();
    const artboard = ref.id?.artboard;
    const canvas = ref.id?.canvas;
    const boardWidth = ref.id?.boardWidth;
    const boardHeight = ref.id?.boardHeight;
    if (!artboard || !canvas) return;

    artboard.style.width = `${doc.meta.width}px`;
    artboard.style.height = `${doc.meta.height}px`;
    artboard.style.background = doc.meta.background || '#f7f4ef';
    if (boardWidth) boardWidth.value = doc.meta.width;
    if (boardHeight) boardHeight.value = doc.meta.height;

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
