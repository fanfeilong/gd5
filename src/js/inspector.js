/**
 * Right-side property inspector.
 */

function field(label, controlHtml) {
  return `<label class="field"><span>${label}</span>${controlHtml}</label>`;
}

export function createInspector({ bodyEl, store }) {
  function render() {
    const node = store.getSelected();
    if (!node) {
      bodyEl.innerHTML = `<p class="empty-state">选中画布上的元素以编辑属性</p>`;
      return;
    }

    const propFields = [];

    if ('text' in node.props) {
      propFields.push(field('文本', `<input data-prop="text" type="text" value="${escapeAttr(node.props.text)}">`));
    }
    if ('placeholder' in node.props) {
      propFields.push(
        field('占位符', `<input data-prop="placeholder" type="text" value="${escapeAttr(node.props.placeholder)}">`)
      );
    }
    if ('title' in node.props) {
      propFields.push(field('标题', `<input data-prop="title" type="text" value="${escapeAttr(node.props.title)}">`));
    }
    if ('body' in node.props) {
      propFields.push(
        field('正文', `<textarea data-prop="body" rows="3">${escapeAttr(node.props.body)}</textarea>`)
      );
    }
    if ('action' in node.props) {
      propFields.push(field('操作文案', `<input data-prop="action" type="text" value="${escapeAttr(node.props.action)}">`));
    }
    if ('alt' in node.props) {
      propFields.push(field('说明', `<input data-prop="alt" type="text" value="${escapeAttr(node.props.alt)}">`));
    }

    bodyEl.innerHTML = `
      <p class="panel-hint">${node.label || node.kind} · ${node.id}</p>
      <div class="field-row">
        ${field('X', `<input data-geo="x" type="number" value="${node.x}">`)}
        ${field('Y', `<input data-geo="y" type="number" value="${node.y}">`)}
      </div>
      <div class="field-row">
        ${field('宽', `<input data-geo="width" type="number" value="${node.width}">`)}
        ${field('高', `<input data-geo="height" type="number" value="${node.height}">`)}
      </div>
      ${propFields.join('')}
      ${field('背景色', `<input data-style="background" type="text" value="${escapeAttr(node.style.background || '')}">`)}
      ${field('文字色', `<input data-style="color" type="text" value="${escapeAttr(node.style.color || '')}">`)}
      ${field('字号', `<input data-style="fontSize" type="text" value="${escapeAttr(node.style.fontSize || '')}">`)}
      ${field('圆角', `<input data-style="borderRadius" type="text" value="${escapeAttr(node.style.borderRadius || '')}">`)}
      <div class="inspector-actions">
        <button type="button" class="btn btn--danger" data-action="delete">删除</button>
      </div>
    `;

    bodyEl.querySelectorAll('[data-prop]').forEach((input) => {
      input.addEventListener('change', () => {
        store.updateNode(node.id, { props: { [input.dataset.prop]: input.value } });
      });
    });

    bodyEl.querySelectorAll('[data-geo]').forEach((input) => {
      input.addEventListener('change', () => {
        store.updateNode(node.id, { [input.dataset.geo]: Number(input.value) || 0 });
      });
    });

    bodyEl.querySelectorAll('[data-style]').forEach((input) => {
      input.addEventListener('change', () => {
        store.updateNode(node.id, { style: { [input.dataset.style]: input.value } });
      });
    });

    const del = bodyEl.querySelector('[data-action="delete"]');
    if (del) {
      del.addEventListener('click', () => store.removeNode(node.id));
    }
  }

  return { render };
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
