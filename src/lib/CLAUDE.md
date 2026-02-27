# lib/ — 核心逻辑层
L2 | 父级: 14list-jingou/CLAUDE.md

## 成员清单

- `script.md`: 五模块剧本原文(813行)，`?raw` import 直通注入 buildSystemPrompt
- `data.ts`: UI 薄层——类型定义(含 Message 富消息扩展) + 6角色(图片立绘) + 7场景(图片背景) + 10道具 + 4章节 + 5事件 + 5结局 + QUICK_ACTIONS
- `store.ts`: Zustand+Immer 状态管理，GAME_SCRIPT 直通管道 + 双轨解析 + 连锁反应 + 富消息插入(场景转场/线索获取/日历翻页) + showDashboard/toggleDashboard
- `parser.ts`: AI 回复解析器，角色名着色(6人) + 数值变化着色，零 data.ts 依赖避免循环
- `analytics.ts`: Umami 埋点，`jg_` 前缀，含金沟专属事件(clue_found/chain_reaction)
- `stream.ts`: ☆ 零修改：SSE 流式通信
- `bgm.ts`: ☆ 零修改：背景音乐 useBgm hook
- `hooks.ts`: ☆ 零修改：useMediaQuery / useIsMobile

## 富消息数据流

```
selectScene() → type:'scene-transition' + sceneId
sendMessage() → 线索增长 → type:'clue-found'
advanceTime() → 日期变化 → type:'day-change' + dayInfo
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
