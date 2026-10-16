/**
 * gd5 UI — component library on top of the engine (antd-style primitives + widgets).
 *
 * Primitives return real-DOM Elements for use inside ensureShell / bind trees.
 * Modal is a Component (overlay lifecycle).
 *
 *   import { loadUi, Button, Input, Modal } from '../ui/index.js';
 *   await loadUi();
 */

export { loadUi, ensureUiStyles, cx } from './util.js';

export { Button } from './button.js';
export { Input, TextArea, Select, Field } from './input.js';
export { Checkbox, Switch, Badge } from './control.js';
export { Space, Divider } from './space.js';
export { Title, Text } from './typography.js';
export { Card } from './card.js';
export { Tag, Alert, Spin, Empty } from './feedback.js';
export { Modal } from './Modal.js';
