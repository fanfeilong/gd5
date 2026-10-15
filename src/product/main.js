/**
 * ProtoLive Product bootstrap
 *
 * 用引擎 ComponentRender 挂载产品页面：
 * - boot  → loading 槽
 * - editor → home
 * - preview → 模态预览（isModal）
 */

import { ComponentRender, LogEnv } from '../engine/index.js';
import { BootComponent } from './components/BootComponent.js';
import { EditorComponent } from './components/EditorComponent.js';
import { PreviewComponent } from './components/PreviewComponent.js';

const render = new ComponentRender({
  logEnv: LogEnv.chrome,
  getUserInfo: () => ({
    machId: 'browser',
    userId: 'protolive',
    token: '',
  }),
});

render.init(
  {
    loading: 'boot',
    home: 'editor',
  },
  {
    boot: {
      type: BootComponent,
      isMount: false,
      isModal: false,
      id: 'boot',
    },
    editor: {
      type: EditorComponent,
      isMount: false,
      isModal: false,
      id: 'editor',
    },
    preview: {
      type: PreviewComponent,
      isMount: false,
      isModal: true,
      id: 'preview',
    },
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
