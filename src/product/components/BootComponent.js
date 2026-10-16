import { Component } from '../../engine/index.js';

/**
 * 启动页（产品）— loading 槽。
 */
export class BootComponent extends Component {
  constructor(navigator, logger) {
    super();
    this.navigator = navigator;
    this.logger = logger;
    this.state.data.message = 'ProtoLive Engine starting…';
  }

  async componentDidMount() {
    this.logger.i('BootComponent mounted');
  }

  render() {
    this.ensureShell(
      (ids) => ids.bootMessage,
      ({ div }) => {
        div({
          className: 'boot-message',
          id: 'bootMessage',
          text: this.state.data.message,
        });
      }
    );
    const el = this.ids().bootMessage;
    if (el) el.textContent = this.state.data.message;
  }
}
