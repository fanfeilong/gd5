const ComponentRender = require('./ComponentRender');
const Component = require('./Component');

/**
 * 定义组件
 */
class HomeComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.state = {
      data: {
        title: 'Home Page',
        description: 'Welcome to the Home Page!',
      },
      ref: {},
    };
  }

  async componentDidMount(params) {
    console.log('HomeComponent Mounted with params:', params);
  }

  componentDidUnMount() {
    console.log('HomeComponent UnMounted');
  }

  componentDidAttachEvents() {
    console.log('HomeComponent Events Attached');
  }

  render() {
    const { title, description } = this.state.data;
    const element = document.getElementById(this.state.ref.home);
    if (element) {
      element.innerHTML = `<h1>${title}</h1><p>${description}</p>`;
    }
  }
}

class LoadingComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.state = {
      data: {
        message: 'Loading...',
      },
      ref: {},
    };
  }

  async componentDidMount(params) {
    console.log('LoadingComponent Mounted with params:', params);
  }

  componentDidUnMount() {
    console.log('LoadingComponent UnMounted');
  }

  componentDidAttachEvents() {
    console.log('LoadingComponent Events Attached');
  }

  render() {
    const { message } = this.state.data;
    const element = document.getElementById(this.state.ref.loading);
    if (element) {
      element.innerHTML = `<p>${message}</p>`;
    }
  }
}

/**
 * 初始化组件渲染器
 */
const componentRender = new ComponentRender();
componentRender.init(
  {
    loading: 'loading',
    home: 'home',
  },
  {
    home: {
      type: HomeComponent,
      isMount: false,
      isModal: false,
      id: 'home',
    },
    loading: {
      type: LoadingComponent,
      isMount: false,
      isModal: false,
      id: 'loading',
    },
  }
);

/**
 * 渲染初始页面
 */
window.onload = () => {
  componentRender.render();
};