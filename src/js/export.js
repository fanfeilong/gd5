/**
 * Serialize a ProtoLive document into a standalone HTML string.
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleObjectToCss(style) {
  return Object.entries(style || {})
    .map(([key, value]) => {
      const prop = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${prop}:${value}`;
    })
    .join(';');
}

function renderNodeHtml(node) {
  const baseStyle = {
    position: 'absolute',
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
    boxSizing: 'border-box',
    ...node.style,
  };

  const css = styleObjectToCss(baseStyle);
  const text = escapeHtml(node.props?.text ?? '');

  switch (node.kind) {
    case 'button':
      return `<button type="button" data-id="${node.id}" style="${css}">${text}</button>`;
    case 'input':
      return `<input data-id="${node.id}" placeholder="${escapeHtml(node.props?.placeholder || '')}" style="${css}">`;
    case 'image':
      return `<div data-id="${node.id}" role="img" aria-label="${escapeHtml(node.props?.alt || 'image')}" style="${css}">${escapeHtml(node.props?.alt || 'Image')}</div>`;
    case 'card':
      return `<section data-id="${node.id}" style="${css}"><strong style="display:block;margin-bottom:8px">${escapeHtml(node.props?.title || '')}</strong><p style="margin:0;opacity:.8">${escapeHtml(node.props?.body || '')}</p></section>`;
    case 'navbar':
      return `<header data-id="${node.id}" style="${css}"><span>${escapeHtml(node.props?.title || '')}</span><span style="opacity:.7">${escapeHtml(node.props?.action || '')}</span></header>`;
    case 'text':
    default:
      return `<div data-id="${node.id}" style="${css}">${text}</div>`;
  }
}

export function documentToHtml(doc) {
  const { meta, nodes } = doc;
  const body = nodes.map(renderNodeHtml).join('\n    ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.name || 'ProtoLive Export')}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #1a2330;
      font-family: "Segoe UI", "PingFang SC", sans-serif;
    }
    .device {
      position: relative;
      width: ${meta.width}px;
      height: ${meta.height}px;
      background: ${meta.background || '#f7f4ef'};
      overflow: hidden;
      border-radius: 24px;
      box-shadow: 0 24px 48px rgba(0,0,0,.4);
    }
  </style>
</head>
<body>
  <div class="device">
    ${body}
  </div>
</body>
</html>`;
}

export function downloadHtml(doc, filename = 'prototype.html') {
  const html = documentToHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return html;
}

export { escapeHtml, styleObjectToCss, renderNodeHtml };
