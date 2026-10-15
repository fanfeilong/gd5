/**
 * Left-side skill palette.
 */

export function createPalette({ listEl, blocks, onAdd }) {
  listEl.innerHTML = '';

  blocks.forEach((block) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'palette-item';
    item.draggable = true;
    item.dataset.skillId = block.id;
    item.innerHTML = `
      <span class="palette-item__icon">${block.icon || block.kind.slice(0, 3).toUpperCase()}</span>
      <span class="palette-item__label">${block.label}</span>
    `;

    item.addEventListener('click', () => onAdd(block.id));

    item.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('application/x-protolive-skill', block.id);
      event.dataTransfer.effectAllowed = 'copy';
    });

    listEl.appendChild(item);
  });

  return {
    getBlock(id) {
      return blocks.find((b) => b.id === id) || null;
    },
  };
}
