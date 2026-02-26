# components/game/ — 游戏组件层
L2 | 父级: 14list-jingou/CLAUDE.md

## 成员清单

- `app-shell.tsx`: 游戏主壳——Header(时间/线索/音乐/菜单) + Tab路由(AnimatePresence) + TabBar(3项)
- `tab-dialogue.tsx`: 对话Tab——ChatArea(LetterCard/MessageBubble/StreamingBubble) + QuickActions(2x2) + InputArea + InventorySheet
- `tab-scene.tsx`: 场景Tab——SceneHeroCard(9:16大图) + 相关人物tags + 地点列表(锁定/解锁/当前态)
- `tab-character.tsx`: 人物Tab——PortraitHero(9:16立绘) + StatGroups(category分组) + RelationGraph + CharacterGrid

## 架构决策

- 移动优先唯一布局，无 isMobile 条件分叉
- 所有组件通过 `useGameStore` 获取状态
- CSS 类名统一 `jg-` 前缀
- Framer Motion 驱动 Tab 切换和弹窗动画
- parser.ts 的 parseStoryParagraph 渲染 NPC 气泡内容

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
