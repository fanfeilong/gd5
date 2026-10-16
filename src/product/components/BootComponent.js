import { Component, D, bind } from '../../engine/index.js';

/**
 * 启动页（产品）— loading 槽；bind 短名建壳。
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
    const messageEl = this.state.ref.class?.['boot-message'];

    if (!messageEl) {
      D.clear(host);
      const { div, get } = bind();
      div({ className: 'boot-message', text: this.state.data.message });
      const [ref, root] = get();
      this.state.ref = ref;
      host.appendChild(root);
      return;
    }

    messageEl.textContent = this.state.data.message;
  }
}
