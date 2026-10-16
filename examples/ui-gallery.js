/**
 * Live gallery for gd5 UI kit — open examples/ui-gallery.html via static server.
 */
import { Component } from '../src/engine/index.js';
import {
  loadUi,
  Button,
  Input,
  TextArea,
  Select,
  Field,
  Checkbox,
  Switch,
  Badge,
  Space,
  Title,
  Text,
  Card,
  Tag,
  Alert,
  Spin,
  Empty,
  Modal,
} from '../src/ui/index.js';

class GalleryPage extends Component {
  constructor() {
    super({});
    this.state.data.name = '';
    this.state.data.notify = true;
    this.state.data.agree = false;
    this.modal = new Modal({});
  }

  async componentDidMount() {
    await loadUi();
    await this.modal.mount(document.body);
  }

  render() {
    this.ensureShell(
      (ids) => ids.galleryRoot,
      ({ div }) => {
        div(
          { id: 'galleryRoot' },
          Title({ level: 1, text: 'gd5 UI' }),
          Text({
            type: 'secondary',
            text: 'Component library on the real-DOM engine — antd-style primitives. Orange primary, white panels.',
          }),

          Card(
            { title: 'Button', className: 'gallery-card', style: { marginTop: '24px' } },
            Space(
              {},
              Button({ type: 'primary', text: 'Primary' }),
              Button({ type: 'default', text: 'Default' }),
              Button({ type: 'ghost', text: 'Ghost' }),
              Button({ type: 'danger', text: 'Danger' }),
              Button({ type: 'text', text: 'Text' }),
              Button({ type: 'primary', size: 'sm', text: 'Small' }),
              Button({ type: 'primary', size: 'lg', text: 'Large' }),
              Button({ type: 'primary', disabled: true, text: 'Disabled' })
            )
          ),

          Card(
            { title: 'Form controls', style: { marginTop: '24px' } },
            Space(
              { direction: 'vertical', size: 'md' },
              Field({
                label: 'Name',
                control: Input({
                  id: 'galleryName',
                  placeholder: 'Type something',
                  onInput: (e) => this.setData({ name: e.target.value }),
                }),
                hint: 'Synced to state.data.name',
              }),
              Field({
                label: 'Notes',
                control: TextArea({ id: 'galleryNotes', placeholder: 'Notes…' }),
              }),
              Field({
                label: 'Role',
                control: Select({
                  id: 'galleryRole',
                  options: [
                    { value: 'dev', label: 'Developer' },
                    { value: 'design', label: 'Designer' },
                    { value: 'pm', label: 'PM' },
                  ],
                }),
              }),
              Space(
                { align: 'center' },
                Checkbox({
                  label: 'I agree',
                  checked: !!this.state.data.agree,
                  onChange: (e) => this.setData({ agree: e.target.checked }),
                }),
                Switch({
                  checked: !!this.state.data.notify,
                  onChange: (on) => this.setData({ notify: on }),
                }),
                Text({
                  type: 'secondary',
                  text: this.state.data.notify ? 'Notify on' : 'Notify off',
                })
              )
            )
          ),

          Card(
            { title: 'Feedback', style: { marginTop: '24px' } },
            Space(
              { direction: 'vertical', size: 'md' },
              Space(
                { align: 'center' },
                Tag({ text: 'Default' }),
                Tag({ color: 'primary', text: 'Primary' }),
                Tag({ color: 'danger', text: 'Danger' }),
                Badge({ count: 5 }, Button({ text: 'Inbox' })),
                Badge({ status: 'processing', text: 'Live' }),
                Spin({}),
                Spin({ size: 'lg' })
              ),
              Alert({ type: 'info', message: 'Informational alert' }),
              Alert({ type: 'success', message: 'Saved successfully' }),
              Alert({ type: 'warning', message: 'Check your input' }),
              Alert({ type: 'error', message: 'Something went wrong' }),
              Empty({ description: 'Nothing here yet' })
            )
          ),

          Card(
            { title: 'Modal', style: { marginTop: '24px' } },
            Button({
              type: 'primary',
              text: 'Open modal',
              onClick: () =>
                this.modal.open({
                  title: 'Confirm',
                  content: `Hello${this.state.data.name ? `, ${this.state.data.name}` : ''}. Continue?`,
                  onOk: () => console.log('modal ok'),
                }),
            })
          )
        );
      }
    );
  }
}

const page = new GalleryPage();
await page.mount(document.getElementById('app'));
