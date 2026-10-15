import { Component, D } from '../../engine/index.js';

/**
 * 启动页（产品）— 对应引擎 ComponentRender 的 loading 槽位。
 */
export class BootComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.state = {
      data: {
        message: 'ProtoLive Engine starting…',
      },
      ref: {},
    };
  }

  async componentDidMount() {
    this.logger.i('BootComponent mounted');
  }

  componentDidUnMount() {
    D.clear(document.getElementById('boot'));
    this.state.ref = {};
  }

  componentDidAttachEvents() {}

  render() {
    const host = document.getElementById('boot');
    D.clear(host);

    const d = new D();
    d.div({ className: 'boot-message', text: this.state.data.message });
    const [ref, root] = d.get();
    this.state.ref = ref;
    host.appendChild(root);
  }
}
