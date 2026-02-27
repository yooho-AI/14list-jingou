# 金沟（白山黑水·卷一）— AI 驱动交互式悬疑叙事游戏

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion

## 架构

```
14list-jingou/
├── CLAUDE.md               - L1 项目宪法
├── worker/index.js          - ☆ 零修改：CF Worker 代理（备用）
├── scripts/gen-images.mjs   - 火山方舟 SeeDream API 批量生图脚本
├── public/
│   ├── audio/bgm.mp3        - 背景音乐（预留，用户手动生成）
│   ├── characters/           - 6 角色立绘 9:16 竖版 (jpg, 1440x2560)
│   └── scenes/               - 7 场景背景 9:16 竖版 + crawl-bg.mp4
├── src/
│   ├── main.tsx              - ☆ 零修改：React 入口
│   ├── App.tsx               - 根组件：开场(信纸+按钮→字幕→游戏)/游戏二态 + EndingModal + MenuOverlay
│   ├── lib/                  - 核心逻辑层 (8 文件)
│   ├── styles/globals.css    - 全局样式，jg- 前缀，暗金冷峻主题 + 6组件富UI样式 + 调查笔记本
│   └── components/game/      - 游戏组件层 (5 文件)
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

## 富UI组件系统

6 个 SillyTavern 风格的精致组件，嵌入对话流和 Tab 交互：

| 组件 | 位置 | 触发 | 视觉风格 |
|------|------|------|----------|
| DashboardDrawer | app-shell | Header📓+右滑手势 | 左侧滑入笔记本：老照片轮播+手绘舆图+Reorder拖拽排序 |
| CharacterDossier | tab-character | 点击角色 | 全屏卷宗档案卡，密印+立绘+数值条+性格 |
| SceneTransitionCard | tab-dialogue | selectScene | 场景大图+Ken Burns+电影字幕卡 |
| ClueCard | tab-dialogue | 线索+1 | 虚线框+去模糊动画+进度条 |
| DayCard | tab-dialogue | 日期变化 | 日历撕页飘落+楷体大字+红色撕痕 |
| MusicPlayer(铜钱) | app-shell header | 始终可用 | 3D rotateY铜钱旋转+展开面板+5条波形 |

## 三向手势导航

- **右滑**（任意主Tab）→ 左侧调查笔记本
- **左滑**（任意主Tab）→ 右侧对话记录
- Header 按钮（📓/📜）同等触发
- 笔记本内组件支持拖拽排序（Reorder + localStorage 持久化）

## 富消息机制

Message 类型扩展 `type` 字段路由渲染：
- `scene-transition` → SceneTransitionCard（selectScene 触发）
- `clue-found` → ClueCard（cluesFound 增长时触发）
- `day-change` → DayCard（advanceTime 日期变化时触发）

## 法则

- CSS 前缀 `jg-`，主题色 `#8B6914`（暗金）
- ☆ 标记文件绝不修改
- StatMeta 驱动渲染，零 if/else
- 结局映射表数据驱动
- 图片素材由 scripts/gen-images.mjs 调用火山方舟 API 生成

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
