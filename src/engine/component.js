/**
 * 迷你实模式 HTML 组件规范（引擎）
 *
 * 统一采用如下格式索引组件内 ViewModel / View：
 * this.state = {
 *   data: {}, // 视图展示所依赖的数据
 *   ref: {}   // 视图 HTML Element 的索引
 * };
 *
 * 两种挂载方式：
 * 1. 页面：ComponentRender.navigate → 按 id 槽显示
 * 2. 组合：父组件 render 出宿主后，子组件 mount(host) 走同一套生命周期
 *
 * 刷新约定（Mount 之后）：
 * - setData(patch) 合并 this.state.data，并默认调用 refresh()
 * - refresh() 默认再跑 render()；AttachEvents 只在首次 mount
 */
export class Component {
  constructor() {
    this._host = null;
    this._mounted = false;
  }

  /**
   * 当前宿主 DOM（页槽或父组件给出的 mount 点）
   * @returns {HTMLElement|null}
   */
  host() {
    return this._host;
  }

  /**
   * 是否已 mount（含页内子组件）
   */
  isMounted() {
    return this._mounted;
  }

  /**
   * 挂到宿主并走完整生命周期（页内组合用，不经导航栈）。
   * @param {string|HTMLElement} host id 或元素
   * @param {object} [params]
   */
  async mount(host, params = {}) {
    if (this._mounted) {
      this.refresh();
      return this;
    }
    this._host = typeof host === 'string' ? document.getElementById(host) : host;
    if (!this._host) {
      throw new Error('Component.mount: host not found');
    }
    await this.componentDidMount(params);
    this.render();
    this.componentDidAttachEvents();
    this._mounted = true;
    return this;
  }

  /**
   * 卸载：DidUnMount + 清空宿主（子组件组合对称 API）
   */
  unmount() {
    if (!this._mounted) return;
    this.componentDidUnMount();
    this._mounted = false;
    this._host = null;
  }

  /**
   * 合并视图数据并刷新。
   * @param {object} patch
   * @param {{ refresh?: boolean }} [options] refresh 默认 true
   */
  setData(patch = {}, options = {}) {
    if (!this.state) {
      this.state = { data: {}, ref: {} };
    }
    if (!this.state.data || typeof this.state.data !== 'object') {
      this.state.data = {};
    }
    Object.assign(this.state.data, patch);
    if (options.refresh !== false) {
      this.refresh();
    }
    return this.state.data;
  }

  /**
   * Mount 之后的刷新入口：默认再次 render()。
   * 不重新 AttachEvents / 不走 UnMount。
   */
  refresh() {
    this.render();
  }

  /** virtual method */
  async componentDidMount() {
    // 组件创建后，navigate / mount 过来时会被调用
  }

  /** virtual method */
  componentDidUnMount() {
    // goBack / unmount 时调用：清理 data、动态 DOM、监听器
  }

  /** virtual method */
  componentDidAttachEvents() {
    // 首次 render 之后绑事件
  }

  /** virtual method */
  render() {
    // 绑定 state.data → state.ref / host DOM
  }
}
