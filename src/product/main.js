/**
 * ProtoLive Product bootstrap
 *
 * 用引擎 ComponentRender 挂载产品页面：
 * - boot  → loading 槽
 * - editor → home
 * - preview → 模态预览（isModal）
 *
 * 注册可简写：默认 id=name、isMount=false；页面构造自动获得 navigator/logger。
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
    boot: BootComponent,
    editor: EditorComponent,
    preview: { type: PreviewComponent, isModal: true },
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
