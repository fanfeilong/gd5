/**
 * Artboard / canvas rendering and pointer interactions.
 */

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
      el.innerHTML = `<strong style="display:block;margin-bottom:8px"></strong><p style="margin:0;opacity:.8"></p>`;
      el.querySelector('strong').textContent = node.props.title || '';
      el.querySelector('p').textContent = node.props.body || '';
      break;
    case 'navbar':
      el.innerHTML = `<span></span><span style="opacity:.7"></span>`;
      el.children[0].textContent = node.props.title || '';
      el.children[1].textContent = node.props.action || '';
      break;
    case 'text':
    default:
      el.textContent = node.props.text || '';
      break;
  }
}

function createNodeElement(node) {
  const tag =
    node.kind === 'button' ? 'button' : node.kind === 'input' ? 'input' : 'div';
  const el = document.createElement(tag);
  if (tag === 'button') el.type = 'button';
  if (tag === 'input') el.readOnly = true;

  el.className = 'prototype-node';
  el.dataset.id = node.id;
  el.dataset.kind = node.kind;
  applyNodeStyles(el, node);
  fillNodeContent(el, node);
  return el;
}

export function createCanvasController({ canvasEl, artboardEl, store, onDropSkill }) {
  let dragState = null;

  function render() {
    const { doc, selectedId } = store.getState();
    artboardEl.style.width = `${doc.meta.width}px`;
    artboardEl.style.height = `${doc.meta.height}px`;
    artboardEl.style.background = doc.meta.background || '#f7f4ef';

    const existing = new Map(
      [...canvasEl.querySelectorAll('.prototype-node')].map((el) => [el.dataset.id, el])
    );
    const keep = new Set();

    doc.nodes.forEach((node) => {
      keep.add(node.id);
      let el = existing.get(node.id);
      if (!el) {
        el = createNodeElement(node);
        canvasEl.appendChild(el);
      } else {
        applyNodeStyles(el, node);
        fillNodeContent(el, node);
      }
      el.classList.toggle('is-selected', node.id === selectedId);
    });

    existing.forEach((el, id) => {
      if (!keep.has(id)) el.remove();
    });
  }

  function clientToCanvas(clientX, clientY) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  canvasEl.addEventListener('pointerdown', (event) => {
    const target = event.target.closest('.prototype-node');
    if (!target) {
      store.select(null);
      return;
    }

    event.preventDefault();
    const id = target.dataset.id;
    store.select(id);
    const node = store.getState().doc.nodes.find((n) => n.id === id);
    if (!node) return;

    const point = clientToCanvas(event.clientX, event.clientY);
    store.beginGesture();
    dragState = {
      id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    };
    target.setPointerCapture(event.pointerId);
  });

  canvasEl.addEventListener('pointermove', (event) => {
    if (!dragState) return;
    const point = clientToCanvas(event.clientX, event.clientY);
    const x = Math.max(0, Math.round(point.x - dragState.offsetX));
    const y = Math.max(0, Math.round(point.y - dragState.offsetY));
    store.updateNode(dragState.id, { x, y }, { recordHistory: false });
  });

  canvasEl.addEventListener('pointerup', () => {
    dragState = null;
  });

  artboardEl.addEventListener('dragover', (event) => {
    event.preventDefault();
    artboardEl.classList.add('is-dragover');
  });

  artboardEl.addEventListener('dragleave', () => {
    artboardEl.classList.remove('is-dragover');
  });

  artboardEl.addEventListener('drop', (event) => {
    event.preventDefault();
    artboardEl.classList.remove('is-dragover');
    const skillId = event.dataTransfer.getData('application/x-protolive-skill');
    if (!skillId || !onDropSkill) return;
    const point = clientToCanvas(event.clientX, event.clientY);
    onDropSkill(skillId, point);
  });

  return { render };
}
