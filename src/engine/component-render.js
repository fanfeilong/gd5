import { Log, LogEnv } from './log.js';

/**
 * 默认用户信息（浏览器 demo / 本地原型）
 * 产品可在构造 ComponentRender 时注入自己的 getUserInfo。
 */
export function defaultGetUserInfo() {
  return {
    machId: 'local',
    userId: 'demo',
    token: '',
  };
}

/**
 * 组件渲染器，支持在页面之间导航（引擎）：
 * 1. 通过 this.m_navigator 导航，提供 navigate / goBack 方法
 * 2. navigate 到下一个页面
 *   * 如果下一个页面是模态组件，则保留当前页面作为透视背景，否则当前页面不显示
 *   * 依次执行组件的 componentDidMount / render / componentDidAttachEvents 方法
 * 3. goBack 到前一个页面
 *   * 执行当前页面的 componentDidUnMount 方法
 *   * 不显示当前页面
 *   * 如果当前页面是模态组件，则什么都不做，否则显示上一个页面
 * 4. pop(n) 直接弹出 n 个页面
 *
 * 备注：React 之类的 Virtual Dom 有一定的好处，但是也有很多不必要的工作，
 * 本引擎使用迷你简单实模式 Dom 操作。
 * 参考：https://svelte.dev/blog/virtual-dom-is-pure-overhead
 */
export class ComponentRender {
  /**
   * @param {object} [options]
   * @param {() => {machId:string,userId:string,token:string}} [options.getUserInfo]
   * @param {string} [options.logEnv]
   * @param {import('./log.js').Log} [options.logger]
   */
  constructor(options = {}) {
    const getUserInfo = options.getUserInfo || defaultGetUserInfo;
    const logEnv = options.logEnv || LogEnv.chrome;
    const { machId, userId, token } = getUserInfo();
    const loggerContexts = [`machId:${machId}, userId:${userId}, token:${token}`];
    this.m_logger = options.logger || new Log(logEnv, loggerContexts);
    this.m_navigator = {
      navigate: (componentName, ...args) => {
        this._navigate(componentName, ...args);
      },
      goBack: () => {
        this._goBack();
      },
      pop: (n) => {
        this._pop(n);
      },
    };
    this.state = null;
  }

  init({ loading, home }, componentsDef) {
    this.state = {
      componentState: {
        stack: [],
        loading,
        home,
        current: null,
      },
      components: {},
    };

    for (const componentName in componentsDef) {
      const componentDef = componentsDef[componentName];
      this.state.components[componentName] = {
        componentName,
        isMount: componentDef.isMount,
        isModal: componentDef.isModal,
        id: componentDef.id,
        component: new componentDef.type(this.m_navigator, this.m_logger),
      };
    }
  }

  dump() {
    const o = [];
    for (const name in this.state.components) {
      const i = this.state.components[name];
      if (i.isMount) o.push(name);
    }
    console.log(o);
  }

  render() {
    const { componentState } = this.state;
    this._navigate(componentState.home, null, () => {
      this._renderPage(componentState.loading, 'none');
    });
  }

  _pop(n) {
    if (n == null) {
      n = 1;
    }

    while (n > 0) {
      n--;
      this._goBack();
    }
  }

  _navigate(nextComponentName, arg, onComplete) {
    const { componentState, components } = this.state;

    if (componentState.current === nextComponentName) {
      this.m_logger.w(
        `componentInstance not change, current:${componentState.current}, nextPage:${nextComponentName}`
      );
      return;
    }

    const instance = components[nextComponentName];
    if (instance == null) {
      this.m_logger.e(`Component:'${nextComponentName}' is not exist!`);
      return;
    }

    // hide current and push into stack
    componentState.stack.push(instance);

    if (instance.isModal) {
      // 模态对话框下，上一个页面不需要隐藏，做为透明背景
    } else if (componentState.current != null) {
      this._renderPage(componentState.current, 'none');
    }

    // reset current componentInstance and show nextPage
    componentState.current = nextComponentName;
    this._renderPage(nextComponentName, 'block', arg, onComplete);
  }

  _goBack() {
    const { componentState } = this.state;

    // pop previous and show
    const previousIndex = componentState.stack.length - 2;
    if (previousIndex >= 0) {
      const previousInstance = componentState.stack[previousIndex];
      const currentInstance = componentState.stack.pop();

      currentInstance.component.componentDidUnMount();
      this._renderPage(currentInstance.componentName, 'none');
      currentInstance.isMount = false;

      componentState.current = previousInstance.componentName;

      if (!currentInstance.isModal) {
        this._renderPage(componentState.current, 'block');
      } else {
        // 模态情况下，上一个页面不会被隐藏，不需要重置 display
      }
    } else {
      this.m_logger.w(`componentState.stack: ${JSON.stringify(componentState.stack)}`);
    }

    this.dump();
  }

  _renderPage(componentName, display, arg, onComplete) {
    const { componentState, components } = this.state;
    const instance = components[componentName];
    if (instance == null) {
      this.m_logger.w(`componentInstance is null, componentName:${componentName}`);
      return;
    }

    const _display = () => {
      if (onComplete) {
        onComplete();
      }
      document.getElementById(instance.id).style.display = display;
    };

    // check mount state
    const component = instance.component;
    if (instance.isMount) {
      // 不重复渲染，添加刷新机制
      console.log(`display:${componentName}, isMount:${instance.isMount}, ${display}`);
      _display();
      this.dump();
      return;
    }
    instance.isMount = true;

    // prepare params
    let params;
    if (arg == null) {
      params = {};
    } else {
      params = arg;
    }
    const previousIndex = componentState.stack.length - 2;
    if (previousIndex >= 0) {
      const previousInstance = componentState.stack[previousIndex];
      params.source = previousInstance.componentName;
    }

    // do mount
    component.componentDidMount(params).then(() => {
      component.render();
      component.componentDidAttachEvents();
      _display();
      this.dump();
    });
  }
}
