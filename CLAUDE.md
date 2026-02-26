# 金沟（白山黑水·卷一）— AI 驱动交互式悬疑叙事游戏

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion

## 架构

```
14list-jingou/
├── CLAUDE.md               - L1 项目宪法
├── worker/index.js          - ☆ 零修改：CF Worker 代理（备用）
├── public/
│   ├── audio/bgm.mp3        - 背景音乐
│   ├── characters/           - 角色立绘 9:16 竖版 (jpg, 1152x2048)
│   └── scenes/               - 场景背景 9:16 竖版 (jpg, 1152x2048)
├── src/
│   ├── main.tsx              - ☆ 零修改：React 入口
│   ├── App.tsx               - 根组件：开场/游戏二态 + EndingModal + MenuOverlay
│   ├── lib/                  - 核心逻辑层 (6 文件)
│   ├── styles/globals.css    - 全局样式，jg- 前缀，暗金冷峻主题
│   └── components/game/      - 游戏组件层 (4 文件)
├── index.html                - ⛏️ favicon
├── package.json              - name: jingou
├── wrangler.toml             - ☆ 备用
└── tsconfig*.json + vite.config.ts  - ☆ 零修改
```

## 核心设计

- **剧本直通管道**：script.md 存五模块原文(813行)，`?raw` import 零损耗注入 prompt
- **UI 薄层**：data.ts 只存渲染字段，叙事内容在 script.md
- **移动优先唯一布局**：无 isMobile 分叉，桌面 430px 居中
- **底部 Tab 导航**：dialogue / scene / character
- **固定男性角色**：林承义，只输入名字
- **调查进度**：cluesFound (0-12) 全局计数器
- **连锁反应**：矿工怀疑≥50→刘金爷警觉+15，刘金爷警觉≥60→窝棚被翻

## 法则

- CSS 前缀 `jg-`，主题色 `#8B6914`（暗金）
- ☆ 标记文件绝不修改
- StatMeta 驱动渲染，零 if/else
- 结局映射表数据驱动

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
