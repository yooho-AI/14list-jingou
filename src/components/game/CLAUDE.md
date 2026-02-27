# components/game/ — 游戏组件层
L2 | 父级: 14list-jingou/CLAUDE.md

## 成员清单

- `app-shell.tsx`: 游戏主壳——Header(时间/线索/MusicPlayer唱片播放器/菜单) + Tab路由(AnimatePresence) + TabBar(3项) + RecordSheet
- `tab-dialogue.tsx`: 对话Tab——ChatArea(LetterCard/MessageBubble/StreamingBubble/SceneTransitionCard/ClueCard/DayCard) + QuickActions(2x2) + InputArea + InventorySheet
- `tab-scene.tsx`: 场景Tab——SceneHeroCard(9:16大图) + 相关人物tags + 地点列表(锁定/解锁/当前态)
- `tab-character.tsx`: 人物Tab——PortraitHero(9:16立绘) + StatGroups + RelationGraph + CharacterGrid + CharacterDossier全屏档案卡

## 富UI组件清单

| 组件 | 所在文件 | 风格 |
|------|----------|------|
| CharacterDossier | tab-character.tsx | 全屏卷宗，密印+立绘50vh+数值条stagger+性格+关系线索 |
| SceneTransitionCard | tab-dialogue.tsx | 场景大图200px+Ken Burns+电影字幕+红章 |
| ClueCard | tab-dialogue.tsx | 虚线框+去模糊+线索进度条+计数器跳动 |
| DayCard | tab-dialogue.tsx | 日历纸飘落+红色撕痕+楷体大字+打字机逐字 |
| MusicPlayer | app-shell.tsx | 唱片旋转+迷你面板(曲名+波形+暂停) |

## 架构决策

- 移动优先唯一布局，无 isMobile 条件分叉
- 所有组件通过 `useGameStore` 获取状态
- CSS 类名统一 `jg-` 前缀
- Framer Motion 驱动 Tab 切换、弹窗、富消息动画
- 富消息通过 Message.type 字段路由渲染，零 if/else 分支
- parser.ts 的 parseStoryParagraph 渲染 NPC 气泡内容

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
