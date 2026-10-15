/**
 * ProtoLive document store — pure in-memory state with history.
 */

function uid(prefix = 'n') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DEFAULT_DOC = {
  meta: {
    name: 'Untitled Prototype',
    width: 390,
    height: 844,
    background: '#f7f4ef',
  },
  nodes: [],
};

export function createStore(initial = DEFAULT_DOC) {
  let doc = clone(initial);
  let selectedId = null;
  const listeners = new Set();
  const past = [];
  const future = [];

  function emit() {
    const snapshot = getState();
    listeners.forEach((fn) => fn(snapshot));
  }

  function pushHistory() {
    past.push(clone(doc));
    if (past.length > 50) past.shift();
    future.length = 0;
  }

  function getState() {
    return {
      doc: clone(doc),
      selectedId,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
    };
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function setMeta(patch) {
    pushHistory();
    doc.meta = { ...doc.meta, ...patch };
    emit();
  }

  function addNode(nodeDef, position = {}) {
    pushHistory();
    const node = {
      id: uid('node'),
      kind: nodeDef.kind,
      label: nodeDef.label,
      x: position.x ?? 24,
      y: position.y ?? 24,
      width: position.width ?? nodeDef.defaults.width,
      height: position.height ?? nodeDef.defaults.height,
      props: { ...nodeDef.defaults.props },
      style: { ...nodeDef.defaults.style },
    };
    doc.nodes.push(node);
    selectedId = node.id;
    emit();
    return node.id;
  }

  function updateNode(id, patch, options = {}) {
    const index = doc.nodes.findIndex((n) => n.id === id);
    if (index < 0) return;
    if (options.recordHistory !== false) pushHistory();
    const current = doc.nodes[index];
    doc.nodes[index] = {
      ...current,
      ...patch,
      props: patch.props ? { ...current.props, ...patch.props } : current.props,
      style: patch.style ? { ...current.style, ...patch.style } : current.style,
    };
    emit();
  }

  function beginGesture() {
    pushHistory();
  }

  function removeNode(id) {
    const index = doc.nodes.findIndex((n) => n.id === id);
    if (index < 0) return;
    pushHistory();
    doc.nodes.splice(index, 1);
    if (selectedId === id) selectedId = null;
    emit();
  }

  function select(id) {
    selectedId = id;
    emit();
  }

  function undo() {
    if (!past.length) return;
    future.push(clone(doc));
    doc = past.pop();
    if (selectedId && !doc.nodes.some((n) => n.id === selectedId)) {
      selectedId = null;
    }
    emit();
  }

  function redo() {
    if (!future.length) return;
    past.push(clone(doc));
    doc = future.pop();
    emit();
  }

  function replaceDoc(next, options = {}) {
    if (options.recordHistory !== false) pushHistory();
    doc = clone(next);
    selectedId = null;
    emit();
  }

  function clearHistory() {
    past.length = 0;
    future.length = 0;
    emit();
  }

  function getSelected() {
    return doc.nodes.find((n) => n.id === selectedId) || null;
  }

  return {
    getState,
    subscribe,
    setMeta,
    addNode,
    updateNode,
    beginGesture,
    removeNode,
    select,
    undo,
    redo,
    replaceDoc,
    clearHistory,
    getSelected,
  };
}

export { DEFAULT_DOC, uid, clone };
