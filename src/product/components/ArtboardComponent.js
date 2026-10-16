import { Component } from '../../engine/index.js';
import { createNodeElement, syncNodeElement } from '../nodes/index.js';

/**
 * 画布：放置 / 拖动 / 选中。拖放与指针事件在壳 props 上声明。
 */
export class ArtboardComponent extends Component {
  static styles = new URL('./ArtboardComponent.css', import.meta.url);

  constructor(navigator, logger, { store, getBlock } = {}) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.store = store;
    this.getBlock = getBlock;
    this._dragState = null;
  }

  componentDidUnMount() {
    this._dragState = null;
  }

  render() {
    this.ensureShell(
      (ids) => ids.canvas,
      ({ main, div }) => {
        main(
          { className: 'workspace', id: 'workspace' },
          div(
            { className: 'artboard-wrap', id: 'artboardWrap' },
            div(
              {
                className: 'artboard',
                id: 'artboard',
                dataset: { dropZone: 'true' },
                onDragOver: (event) => {
                  event.preventDefault();
                  this.ids().artboard?.classList.add('is-dragover');
                },
                onDragLeave: () => this.ids().artboard?.classList.remove('is-dragover'),
                onDrop: (event) => {
                  event.preventDefault();
                  const { artboard, canvas } = this.ids();
                  artboard?.classList.remove('is-dragover');
                  const skillId = event.dataTransfer.getData('application/x-protolive-skill');
                  if (!skillId || !canvas) return;
                  const block = this.getBlock?.(skillId);
                  if (!block) return;
                  const point = clientToEl(canvas, event.clientX, event.clientY);
                  this.store.addNode(block, {
                    x: Math.max(0, Math.round(point.x - block.defaults.width / 2)),
                    y: Math.max(0, Math.round(point.y - block.defaults.height / 2)),
                  });
                },
              },
              div({
                className: 'canvas',
                id: 'canvas',
                onPointerDown: (event) => this._onPointerDown(event),
                onPointerMove: (event) => this._onPointerMove(event),
                onPointerUp: () => {
                  this._dragState = null;
                },
              })
            )
          )
        );
      }
    );
    this._syncCanvas();
  }

  refresh() {
    this._syncCanvas();
  }

  _syncCanvas() {
    const { doc, selectedId } = this.store.getState();
    const { artboard, canvas } = this.ids();
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

  _onPointerDown(event) {
    const canvas = this.ids().canvas;
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
    const canvas = this.ids().canvas;
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
