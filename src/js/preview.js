/**
 * Live preview modal powered by documentToHtml.
 */

import { documentToHtml } from './export.js';

export function createPreview({ modalEl, frameEl, closeBtn, store }) {
  function open() {
    const { doc } = store.getState();
    const html = documentToHtml(doc);
    frameEl.srcdoc = html;
    modalEl.hidden = false;
  }

  function close() {
    modalEl.hidden = true;
    frameEl.srcdoc = '';
  }

  closeBtn.addEventListener('click', close);
  modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) close();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modalEl.hidden) close();
  });

  return { open, close };
}
