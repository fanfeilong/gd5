/**
 * Live gallery for gd5 UI kit — NameThatUI-aligned catalog.
 * Open examples/ui-gallery.html via static server.
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
  RadioGroup,
  Badge,
  Chip,
  Pill,
  Space,
  Title,
  Text,
  Truncate,
  Card,
  Tag,
  Alert,
  Banner,
  Callout,
  Spin,
  Empty,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Avatar,
  AvatarGroup,
  StatusDot,
  Accordion,
  Tabs,
  ToggleGroup,
  Breadcrumbs,
  Steps,
  QuantityStepper,
  Pagination,
  Navbar,
  SiteHeader,
  BottomNav,
  Sidebar,
  Toolbar,
  HamburgerButton,
  Scrollspy,
  SplitButton,
  Tooltip,
  Popover,
  DropdownMenu,
  HoverCard,
  OverflowMenu,
  SearchInput,
  Combobox,
  TagInput,
  MultiSelect,
  Transfer,
  Slider,
  ColorWell,
  DatePicker,
  TimeField,
  Table,
  Timeline,
  ChatBubble,
  Carousel,
  BentoGrid,
  BentoTile,
  Marquee,
  ScrollArea,
  ResizeHandle,
  Splitter,
  Tree,
  PieChart,
  DonutChart,
  DragHandle,
  DropZone,
  SignInForm,
  Fab,
  Modal,
  Drawer,
  Toast,
  Lightbox,
  CommandPalette,
} from '../src/ui/index.js';

class GalleryPage extends Component {
  constructor() {
    super({});
    this.state.data = {
      name: '',
      notify: true,
      agree: false,
      tab: 'a',
      segment: 'day',
      page: 1,
      slide: 0,
      qty: 2,
      slider: 40,
      color: '#e86a17',
      tags: ['orange', 'ui'],
      multi: ['dev'],
      transfer: ['b'],
      combo: '',
      comboOpen: false,
      multiOpen: false,
      overflowOpen: false,
      popoverOpen: false,
      search: '',
      treeExpanded: ['root'],
      treeSelected: 'child-1',
      email: '',
      password: '',
      pwVisible: false,
      radio: 'a',
    };
    this.modal = new Modal({});
    this.drawer = new Drawer({});
    this.toast = new Toast({});
    this.lightbox = new Lightbox({});
    this.cmd = new CommandPalette({});
  }

  async componentDidMount() {
    await loadUi();
    await this.modal.mount();
    await this.drawer.mount();
    await this.toast.mount();
    await this.lightbox.mount();
    await this.cmd.mount();
    this.cmd.setData({
      items: [
        { id: 'save', label: 'Save document', onSelect: () => this.toast.show({ message: 'Saved', type: 'success' }) },
        { id: 'toast', label: 'Show toast', onSelect: () => this.toast.show({ message: 'Hello from palette' }) },
        { id: 'drawer', label: 'Open drawer', onSelect: () => this.drawer.open({ title: 'Menu', content: 'From ⌘K' }) },
      ],
    }, { refresh: false });
  }

  section(title, ...body) {
    return Card({ title, style: { marginTop: '24px' } }, ...body);
  }

  render() {
    const d = this.state.data;
    this.ensureShell(
      (ids) => ids.galleryRoot,
      ({ div }) => {
        div(
          { id: 'galleryRoot' },
          Banner({
            type: 'info',
            message: 'gd5 UI covers NameThatUI web elements — orange primary, white panels.',
            closable: false,
          }),
          Title({ level: 1, text: 'gd5 UI' }),
          Text({
            type: 'secondary',
            text: 'Component library aligned with namethatui.com web catalog.',
          }),

          this.section(
            'Header / Navbar / Toolbar',
            SiteHeader(
              { brand: 'ProtoLive', sticky: false },
              Navbar({
                items: [
                  { label: 'Home', active: true },
                  { label: 'Docs' },
                  { label: 'Gallery' },
                ],
              }),
              Toolbar(
                {},
                Button({ type: 'primary', size: 'sm', text: 'New' }),
                HamburgerButton({
                  onClick: () =>
                    this.drawer.open({
                      title: 'Nav drawer',
                      content: 'Hamburger → Drawer (left).',
                      placement: 'left',
                    }),
                }),
                OverflowMenu({
                  open: d.overflowOpen,
                  onOpenChange: (open) => this.setData({ overflowOpen: open }),
                  items: [
                    { label: 'Rename', onClick: () => this.toast.show({ message: 'Rename' }) },
                    { label: 'Delete', danger: true },
                  ],
                })
              )
            )
          ),

          this.section(
            'Button / Split / FAB',
            Space(
              {},
              Button({ type: 'primary', text: 'Primary' }),
              Button({ type: 'default', text: 'Default' }),
              Button({ type: 'ghost', text: 'Ghost' }),
              Button({ type: 'danger', text: 'Danger' }),
              Button({ type: 'text', text: 'Text' }),
              SplitButton({
                text: 'Publish',
                onClick: () => this.toast.show({ message: 'Published', type: 'success' }),
                onMenuClick: () => this.setData({ overflowOpen: !d.overflowOpen }),
              }),
              Tooltip({ title: 'Floating action' }, Button({ type: 'default', text: 'Hover me' }))
            )
          ),

          this.section(
            'Form controls',
            Space(
              { direction: 'vertical', size: 'md' },
              Field({
                label: 'Name',
                control: Input({
                  id: 'galleryName',
                  placeholder: 'Type something',
                  onInput: (e) => this.setData({ name: e.target.value }),
                }),
                hint: 'Form Field anatomy: label + control + hint',
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
              SearchInput({
                value: d.search,
                onInput: (e) => this.setData({ search: e.target.value }),
                onClear: () => this.setData({ search: '' }),
              }),
              Combobox({
                value: d.combo,
                open: d.comboOpen,
                options: ['Accordion', 'Avatar', 'Breadcrumbs', 'Carousel', 'Drawer'],
                onChange: (v) => this.setData({ combo: v }),
                onOpenChange: (open) => this.setData({ comboOpen: open }),
                onSelect: (v) => this.setData({ combo: v, comboOpen: false }),
              }),
              TagInput({
                value: d.tags,
                onChange: (tags) => this.setData({ tags }),
              }),
              MultiSelect({
                open: d.multiOpen,
                value: d.multi,
                options: [
                  { value: 'dev', label: 'Developer' },
                  { value: 'design', label: 'Designer' },
                  { value: 'pm', label: 'PM' },
                ],
                onOpenChange: (open) => this.setData({ multiOpen: open }),
                onChange: (multi) => this.setData({ multi }),
              }),
              Space(
                { align: 'center' },
                Checkbox({
                  label: 'I agree',
                  checked: !!d.agree,
                  onChange: (e) => this.setData({ agree: e.target.checked }),
                }),
                Switch({
                  checked: !!d.notify,
                  onChange: (on) => this.setData({ notify: on }),
                }),
                RadioGroup({
                  name: 'demo-radio',
                  direction: 'horizontal',
                  value: d.radio,
                  onChange: (radio) => this.setData({ radio }),
                  options: [
                    { value: 'a', label: 'A' },
                    { value: 'b', label: 'B' },
                  ],
                }),
                QuantityStepper({
                  value: d.qty,
                  min: 0,
                  max: 9,
                  onChange: (qty) => this.setData({ qty }),
                })
              ),
              Slider({
                value: d.slider,
                onChange: (slider) => this.setData({ slider }),
              }),
              Space(
                { align: 'center' },
                ColorWell({
                  value: d.color,
                  onChange: (color) => this.setData({ color }),
                }),
                DatePicker({}),
                TimeField({})
              ),
              Transfer({
                dataSource: [
                  { key: 'a', title: 'Alpha' },
                  { key: 'b', title: 'Bravo' },
                  { key: 'c', title: 'Charlie' },
                ],
                targetKeys: d.transfer,
                onChange: (transfer) => this.setData({ transfer }),
              })
            )
          ),

          this.section(
            'Feedback',
            Space(
              { direction: 'vertical', size: 'md' },
              Space(
                { align: 'center' },
                Tag({ text: 'Tag' }),
                Tag({ color: 'primary', text: 'Primary' }),
                Chip({ text: 'Chip', selected: true }),
                Pill({ text: 'Pill', color: 'primary' }),
                Badge({ count: 5 }, Button({ text: 'Inbox' })),
                StatusDot({ status: 'online' }),
                StatusDot({ status: 'processing' }),
                Spin({}),
                ProgressRing({ percent: 64, size: 40 })
              ),
              ProgressBar({ percent: d.slider, showInfo: true }),
              Skeleton({ variant: 'title' }),
              Alert({ type: 'info', message: 'Inline Alert' }),
              Callout({ type: 'warning', title: 'Callout', message: 'In-content notice, not a toast.' }),
              Empty({ description: 'Nothing here yet' })
            )
          ),

          this.section(
            'Avatar / Timeline / Chat',
            Space(
              { direction: 'vertical', size: 'md' },
              AvatarGroup({
                items: [
                  { name: 'Ava Reyes' },
                  { name: 'Bo Chen', status: 'online' },
                  { name: 'Cy Dunn' },
                  { name: 'Di Fox' },
                  { name: 'Ed Gu' },
                  { name: 'Fa Ho' },
                ],
                max: 4,
              }),
              Timeline({
                items: [
                  { time: '09:12', title: 'Order placed', description: '3 items' },
                  { time: '09:13', title: 'Payment confirmed', description: 'Visa ending 4242' },
                  { time: 'Today', title: 'Out for delivery', description: 'Arriving by 6 pm' },
                ],
              }),
              ChatBubble({ side: 'theirs', author: 'Ava', text: 'Ship the draft?', showAvatar: true }),
              ChatBubble({ side: 'mine', text: 'On it — opening the drawer.' })
            )
          ),

          this.section(
            'Navigation patterns',
            Space(
              { direction: 'vertical', size: 'md' },
              Breadcrumbs({
                items: [
                  { label: 'Home', onClick: () => {} },
                  { label: 'UI', onClick: () => {} },
                  { label: 'Gallery' },
                ],
              }),
              Steps({
                current: 1,
                items: [
                  { title: 'Cart', description: 'Review' },
                  { title: 'Pay', description: 'Card' },
                  { title: 'Done', description: 'Confirm' },
                ],
              }),
              Tabs({
                activeKey: d.tab,
                onChange: (tab) => this.setData({ tab }),
                items: [
                  { key: 'a', label: 'Overview', content: Text({ text: 'Tabs panel A' }) },
                  { key: 'b', label: 'API', content: Text({ text: 'Tabs panel B' }) },
                ],
              }),
              ToggleGroup({
                value: d.segment,
                onChange: (segment) => this.setData({ segment }),
                options: [
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ],
              }),
              Pagination({
                current: d.page,
                total: 5,
                onChange: (page) => this.setData({ page }),
              }),
              Accordion({
                items: [
                  { title: 'What is gd5 UI?', content: 'Antd-style kit on the real-DOM engine.', defaultOpen: true },
                  { title: 'How to theme?', content: 'Override --gd-* tokens on :root.' },
                ],
              }),
              Scrollspy({
                activeKey: 'nav',
                items: [
                  { key: 'nav', label: 'Navigation' },
                  { key: 'data', label: 'Data' },
                  { key: 'overlay', label: 'Overlays' },
                ],
              }),
              BottomNav({
                items: [
                  { key: 'home', label: 'Home', icon: '⌂', active: true },
                  { key: 'search', label: 'Search', icon: '⌕' },
                  { key: 'me', label: 'Me', icon: '☺' },
                ],
              })
            )
          ),

          this.section(
            'Data / Tree / Charts',
            Space(
              { direction: 'vertical', size: 'md' },
              Table({
                columns: [
                  { key: 'name', title: 'Name', sortable: true },
                  { key: 'status', title: 'Status' },
                  { key: 'amount', title: 'Amount', sortable: true },
                ],
                dataSource: [
                  { name: 'Northwind', status: 'Paid', amount: '$4,280' },
                  { name: 'Globex', status: 'Pending', amount: '$1,860' },
                ],
              }),
              Tree({
                treeData: [
                  {
                    key: 'root',
                    title: 'src',
                    children: [
                      { key: 'child-1', title: 'ui/' },
                      { key: 'child-2', title: 'engine/' },
                    ],
                  },
                ],
                expandedKeys: d.treeExpanded,
                selectedKey: d.treeSelected,
                onExpand: (treeExpanded) => this.setData({ treeExpanded }),
                onSelect: (treeSelected) => this.setData({ treeSelected }),
              }),
              Space(
                {},
                PieChart({
                  size: 120,
                  data: [
                    { value: 40, label: 'A' },
                    { value: 25, label: 'B' },
                    { value: 35, label: 'C' },
                  ],
                }),
                DonutChart({
                  size: 120,
                  data: [
                    { value: 55, label: 'Done' },
                    { value: 45, label: 'Todo' },
                  ],
                })
              )
            )
          ),

          this.section(
            'Layout / Carousel / Media',
            Space(
              { direction: 'vertical', size: 'md' },
              BentoGrid(
                { columns: 4 },
                BentoTile({ span: 2 }, Text({ text: 'Wide tile' })),
                BentoTile({}, Text({ text: 'A' })),
                BentoTile({}, Text({ text: 'B' })),
                BentoTile({ span: 2, rowSpan: 1 }, Text({ text: 'Another wide' }))
              ),
              Marquee(
                {},
                Pill({ text: 'Accordion' }),
                Pill({ text: 'Drawer' }),
                Pill({ text: 'Toast' }),
                Pill({ text: 'Carousel' }),
                Pill({ text: 'Command Palette' })
              ),
              Carousel({
                index: d.slide,
                onChange: (slide) => this.setData({ slide }),
                slides: ['Slide one — arrows & dots', 'Slide two', 'Slide three'],
              }),
              Splitter(
                {},
                Sidebar({
                  title: 'Sidebar',
                  items: [
                    { label: 'Inbox', active: true },
                    { label: 'Archive' },
                  ],
                  width: '100%',
                }),
                ScrollArea(
                  { height: 120 },
                  Text({ text: 'Scroll area pane — resize handle demo below.' }),
                  ResizeHandle({})
                )
              ),
              Space(
                {},
                DragHandle({}),
                DropZone({ label: 'Drop zone' })
              ),
              Truncate({
                text: 'Release notes: this update reworks the sync engine and adds shortcuts for every panel.',
                lines: 1,
              }),
              HoverCard({
                title: 'Jane Appleseed',
                content: Text({ type: 'secondary', text: 'Design systems engineer.' }),
              }, Text({ text: '@jane (hover card)' }))
            )
          ),

          this.section(
            'Overlays',
            Space(
              {},
              Button({
                type: 'primary',
                text: 'Modal',
                onClick: () =>
                  this.modal.open({
                    title: 'Confirm',
                    content: `Hello${d.name ? `, ${d.name}` : ''}. Continue?`,
                    onOk: () => this.toast.show({ message: 'OK', type: 'success' }),
                  }),
              }),
              Button({
                type: 'default',
                text: 'Drawer',
                onClick: () =>
                  this.drawer.open({
                    title: 'Drawer / Sheet',
                    content: 'Side overlay with scrim.',
                    placement: 'right',
                  }),
              }),
              Button({
                type: 'default',
                text: 'Toast',
                onClick: () => this.toast.show({ message: 'Snackbar message', type: 'info' }),
              }),
              Button({
                type: 'default',
                text: 'Lightbox',
                onClick: () =>
                  this.lightbox.open({
                    src: 'https://picsum.photos/seed/gd5/800/500',
                    alt: 'Demo',
                  }),
              }),
              Button({
                type: 'default',
                text: '⌘K Palette',
                onClick: () => this.cmd.open(),
              }),
              Popover({
                open: d.popoverOpen,
                title: 'Popover',
                content: Text({ text: 'Anchored rich panel.' }),
              },
                Button({
                  type: 'ghost',
                  text: 'Popover',
                  onClick: () => this.setData({ popoverOpen: !d.popoverOpen }),
                })
              ),
              DropdownMenu({
                open: d.overflowOpen,
                onOpenChange: (overflowOpen) => this.setData({ overflowOpen }),
                items: [
                  { label: 'Edit' },
                  { label: 'Share' },
                  { divider: true },
                  { label: 'Remove', danger: true },
                ],
              },
                Button({
                  type: 'ghost',
                  text: 'Menu',
                  onClick: () => this.setData({ overflowOpen: !d.overflowOpen }),
                })
              )
            )
          ),

          this.section(
            'Sign-in form',
            SignInForm({
              email: d.email,
              password: d.password,
              passwordVisible: d.pwVisible,
              onEmail: (email) => this.setData({ email }),
              onPassword: (password) => this.setData({ password }),
              onToggleVisible: () => this.setData({ pwVisible: !d.pwVisible }),
              onSubmit: () => this.toast.show({ message: 'Signed in (demo)', type: 'success' }),
              onContinueWith: (p) => this.toast.show({ message: `Continue with ${p}` }),
            })
          ),

          Fab({
            text: '+',
            onClick: () => this.toast.show({ message: 'FAB clicked', type: 'success' }),
          })
        );
      }
    );
  }
}

const page = new GalleryPage();
await page.mount(document.getElementById('app'));
