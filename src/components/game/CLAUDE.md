# components/game/ — 游戏组件层
L2 | 父级: 14list-jingou/CLAUDE.md

## 成员清单

- `app-shell.tsx`: 游戏主壳——Header(SVG图标+衬线时间+渐变背景) + Tab路由(左右滑动手势导航) + TabBar(3项+发光条) + DashboardDrawer(左滑) + RecordSheet(右滑)
- `dashboard-drawer.tsx`: 调查笔记本——左侧滑入抽屉，6组件：FrontPage(农历扉页)/CharacterGallery(老照片轮播)/SceneMap(手绘舆图)/Objectives/EvidenceBoard/CaseBoard。Reorder拖拽排序。林承义私人笔记本风格
- `tab-dialogue.tsx`: 对话Tab——ChatArea(LetterCard/MessageBubble(角色色标左边框)/StreamingBubble/SceneTransitionCard/ClueCard/DayCard) + QuickActions(纵向药丸+emoji) + InputArea + InventorySheet
- `tab-scene.tsx`: 场景Tab——SceneHeroCard(9:16大图) + 相关人物tags + 地点列表(锁定/解锁/当前态)
- `tab-character.tsx`: 人物Tab——PortraitHero(9:16立绘) + StatGroups + RelationGraph + CharacterGrid + CharacterDossier全屏档案卡

## 富UI组件清单

| 组件 | 所在文件 | 风格 |
|------|----------|------|
| CharacterDossier | tab-character.tsx | 全屏卷宗，密印+立绘50vh+数值条stagger+性格+关系线索 |
| SceneTransitionCard | tab-dialogue.tsx | 场景大图200px+Ken Burns+电影字幕+红章 |
| ClueCard | tab-dialogue.tsx | 虚线框+去模糊+线索进度条+计数器跳动 |
| DayCard | tab-dialogue.tsx | 日历纸飘落+红色撕痕+楷体大字+打字机逐字 |
| MusicPlayer(铜钱) | app-shell.tsx | 3D rotateY铜钱旋转+展开面板(曲名+5条波形+暂停) |
| DashboardDrawer | dashboard-drawer.tsx | 左侧滑入笔记本：旧皮革底+泛黄纸+朱砂红标注+老照片轮播+手绘舆图+拖拽排序 |

## 交互架构

- **三向手势导航**：右滑→左侧笔记本 | 左滑→右侧记录 | Header按钮同等触发
- **笔记本拖拽排序**：Reorder.Group + dragControls + 拖拽手柄(⋮⋮)，排序持久化localStorage
- **人物轮播**：触摸滑动翻照片 + AnimatePresence方向动画 + 分页圆点
- 移动优先唯一布局，无 isMobile 条件分叉
- 所有组件通过 `useGameStore` 获取状态
- CSS 类名统一 `jg-` 前缀
- Framer Motion 驱动 Tab 切换、弹窗、富消息动画
- 富消息通过 Message.type 字段路由渲染，零 if/else 分支

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
