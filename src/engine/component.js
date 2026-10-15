/**
 * 迷你实模式 HTML 组件规范（引擎）
 *
 * 统一采用如下格式索引组件内 ViewModel / View：
 * this.state = {
 *   data: {}, // 视图展示所依赖的数据
 *   ref: {}   // 视图 HTML Element 的索引
 * };
 */
export class Component {
  constructor() {
    // subclass sets this.state
  }

  /** virtual method */
  async componentDidMount() {
    // 组件创建后，navigate 过来时会被调用
  }

  /** virtual method */
  componentDidUnMount() {
    // 组件创建后，执行 goBack 时会被调用
    // 1. 用来清理数据，例如重新初始化 this.state.data
    // 2. 用来清理视图，例如清空 this.state.ref 里动态添加的 HTML Element
  }

  /** virtual method */
  componentDidAttachEvents() {
    // 组件渲染之后，在此对 this.state.ref 里对各 HTML Element 添加事件
  }

  /** virtual method */
  render() {
    // 组件 Mount 之后，执行的渲染动作
    // HTML Element 有两种来源：
    // 1. 直接在 .html 里预先写好的
    //   * 将必须的 HTML Element 添加到 this.state.ref 索引，供后续使用
    //   * 做必要的数据重新绑定动作，数据源在 this.state.data 里
    // 2. 根据 this.state.data 里的数据，动态修改 HTML Element，
    //   * 包括数据绑定
    //   * HTML Element 元素增减，例如 List 列表的展示
  }
}
