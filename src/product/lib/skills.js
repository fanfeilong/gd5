/**
 * Skill blocks — reusable prototype primitives loaded from /skills/blocks.
 */

const FALLBACK_BLOCKS = [
  {
    id: 'text',
    kind: 'text',
    label: '文本',
    icon: 'T',
    defaults: {
      width: 200,
      height: 40,
      props: { text: '标题文本' },
      style: {
        color: '#1a2330',
        fontSize: '20px',
        fontWeight: '600',
        lineHeight: '1.3',
      },
    },
  },
  {
    id: 'button',
    kind: 'button',
    label: '按钮',
    icon: 'BTN',
    defaults: {
      width: 140,
      height: 44,
      props: { text: '立即体验' },
      style: {
        background: '#2bb0a6',
        color: '#04201e',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: '600',
      },
    },
  },
  {
    id: 'input',
    kind: 'input',
    label: '输入框',
    icon: 'IN',
    defaults: {
      width: 260,
      height: 44,
      props: { placeholder: '请输入…' },
      style: {
        borderRadius: '8px',
        padding: '0 12px',
        fontSize: '14px',
        background: '#ffffff',
        border: '1px solid #c9d2dc',
        color: '#1a2330',
      },
    },
  },
  {
    id: 'card',
    kind: 'card',
    label: '卡片',
    icon: 'CD',
    defaults: {
      width: 320,
      height: 140,
      props: {
        title: '功能亮点',
        body: '用纯 HTML / CSS / JS 快速搭出可交互的 live demo。',
      },
      style: {
        borderRadius: '12px',
        padding: '16px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        color: '#1a2330',
        boxShadow: '0 8px 24px rgba(26,35,48,.08)',
      },
    },
  },
  {
    id: 'image',
    kind: 'image',
    label: '占位图',
    icon: 'IMG',
    defaults: {
      width: 320,
      height: 180,
      props: { alt: 'Hero Image' },
      style: {
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #dfe6ee, #c5d0dc)',
        color: '#5a6b7c',
      },
    },
  },
  {
    id: 'navbar',
    kind: 'navbar',
    label: '导航栏',
    icon: 'NAV',
    defaults: {
      width: 390,
      height: 56,
      props: { title: 'ProtoLive', action: '菜单' },
      style: {
        padding: '0 16px',
        background: '#1a2330',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '600',
      },
    },
  },
];

export async function loadSkillBlocks(baseUrl = 'skills/blocks') {
  try {
    const manifestRes = await fetch(`${baseUrl}/manifest.json`, { cache: 'no-store' });
    if (!manifestRes.ok) return FALLBACK_BLOCKS;

    const manifest = await manifestRes.json();
    const blocks = await Promise.all(
      (manifest.blocks || []).map(async (file) => {
        const res = await fetch(`${baseUrl}/${file}`);
        if (!res.ok) throw new Error(`Failed to load ${file}`);
        return res.json();
      })
    );
    return blocks.length ? blocks : FALLBACK_BLOCKS;
  } catch {
    return FALLBACK_BLOCKS;
  }
}

export { FALLBACK_BLOCKS };
