/**
 * ProtoLive Engine — 迷你实模式 DOM 组件运行时
 *
 * 产品（ProtoLive 编辑器）应依赖本引擎实现页面导航与视图构建，
 * 而不是绕过 Component / ComponentRender / D。
 */

export { Component } from './component.js';
export { ComponentRender, defaultGetUserInfo } from './component-render.js';
export { Element, D, bind } from './element.js';
export { Log, LogEnv } from './log.js';
export {
  adoptStyles,
  adoptStylesFor,
  adoptedStyleKeys,
  resetAdoptedStyles,
} from './styles.js';
