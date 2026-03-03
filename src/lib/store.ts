/**
 * [INPUT]: 依赖 zustand/immer, stream.ts, data.ts, script.md(?raw)
 * [OUTPUT]: 对外提供 useGameStore hook + 全部 data.ts 导出
 * [POS]: lib 的状态管理核心，驱动所有游戏逻辑，被所有组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from './stream'
import GAME_SCRIPT from './script.md?raw'
import {
  type Character, type CharacterStats, type Message, type StatMeta,
  PERIODS, MAX_DAYS, MAX_ACTION_POINTS,
  SCENES, ITEMS,
  STORY_INFO,
  buildCharacters, getCurrentChapter, getDayEvents,
} from './data'

// ── 类型 ──────────────────────────────────────────────

interface GameState {
  gameStarted: boolean
  playerName: string
  characters: Record<string, Character>

  currentDay: number
  currentPeriodIndex: number
  actionPoints: number

  currentScene: string
  currentCharacter: string | null
  characterStats: Record<string, CharacterStats>
  unlockedScenes: string[]

  currentChapter: number
  triggeredEvents: string[]
  inventory: Record<string, number>
  cluesFound: number

  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string

  endingType: string | null
  activeTab: 'dialogue' | 'scene' | 'character'
  showDashboard: boolean
  storyRecords: Array<{ id: string; day: number; period: string; title: string; content: string }>
  showRecords: boolean
}

interface GameActions {
  setPlayerName: (name: string) => void
  initGame: () => void
  selectCharacter: (charId: string) => void
  selectScene: (sceneId: string) => void
  setActiveTab: (tab: 'dialogue' | 'scene' | 'character') => void
  toggleDashboard: () => void
  addStoryRecord: (title: string, content: string) => void
  toggleRecords: () => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  useItem: (itemId: string) => void
  checkEnding: () => void
  addSystemMessage: (content: string) => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => void
  hasSave: () => boolean
  clearSave: () => void
}

type GameStore = GameState & GameActions

// ── 工具 ──────────────────────────────────────────────

let messageCounter = 0
const makeId = () => `msg-${Date.now()}-${++messageCounter}`
const SAVE_KEY = 'jingou-save-v1'

// ── 数值解析（双轨） ─────────────────────────────────

interface StatChangeResult {
  charChanges: Array<{ charId: string; stat: string; delta: number }>
  globalChanges: Array<{ key: string; delta: number }>
}

function parseStatChanges(
  content: string,
  characters: Record<string, Character>
): StatChangeResult {
  const charChanges: StatChangeResult['charChanges'] = []
  const globalChanges: StatChangeResult['globalChanges'] = []

  const nameToId: Record<string, string> = {}
  for (const [id, char] of Object.entries(characters)) {
    nameToId[char.name] = id
  }

  const labelToKey: Record<string, { charId: string; key: string }[]> = {}
  for (const [charId, char] of Object.entries(characters)) {
    for (const meta of char.statMetas) {
      const labels = [meta.label, meta.label + '度', meta.label + '值']
      for (const label of labels) {
        if (!labelToKey[label]) labelToKey[label] = []
        labelToKey[label].push({ charId, key: meta.key })
      }
    }
  }

  const GLOBAL_ALIASES: Record<string, string> = {
    '线索': 'clues',
    '调查': 'clues',
  }

  const regex = /[【\[]([^\]】]+)[】\]]\s*(\S+?)([+-])(\d+)/g
  let match
  while ((match = regex.exec(content))) {
    const [, context, statLabel, sign, numStr] = match
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)

    const globalKey = GLOBAL_ALIASES[statLabel] || GLOBAL_ALIASES[context]
    if (globalKey) {
      globalChanges.push({ key: globalKey, delta })
      continue
    }

    const charId = nameToId[context]
    if (charId) {
      const entries = labelToKey[statLabel]
      const entry = entries?.find((e) => e.charId === charId) || entries?.[0]
      if (entry) {
        charChanges.push({ charId: entry.charId, stat: entry.key, delta })
      }
    }
  }

  return { charChanges, globalChanges }
}

// ── 系统提示（剧本直通） ─────────────────────────────

function buildStatsSnapshot(state: GameState): string {
  return Object.entries(state.characterStats)
    .map(([charId, stats]) => {
      const char = state.characters[charId]
      if (!char) return ''
      const lines = char.statMetas
        .map((m: StatMeta) => `  ${m.icon} ${m.label}: ${stats[m.key] ?? 0}/100`)
        .join('\n')
      return `${char.name}:\n${lines}`
    })
    .filter(Boolean)
    .join('\n')
}

function buildSystemPrompt(state: GameState): string {
  const chapter = getCurrentChapter(state.currentDay)
  return `你是《${STORY_INFO.title}》的AI叙述者。

## 游戏剧本
${GAME_SCRIPT}

## 当前状态
玩家「${state.playerName}」（林承义）
第${state.currentDay}天 · ${PERIODS[state.currentPeriodIndex].name}
第${chapter.id}幕「${chapter.name}」
当前场景：${SCENES[state.currentScene].name}
${state.currentCharacter ? `当前角色：${state.characters[state.currentCharacter].name}` : ''}
调查进度：${state.cluesFound}/12 条线索

## 当前数值
${buildStatsSnapshot(state)}

## 背包
${Object.entries(state.inventory).filter(([, n]) => n > 0).map(([id]) => ITEMS[id]?.name ?? id).join('、') || '空'}

## 已触发事件
${state.triggeredEvents.join('、') || '无'}

## 已解锁场景
${state.unlockedScenes.map(id => SCENES[id]?.name ?? id).join('、')}

## 输出格式
- 每段回复 300-500 字（关键对话 500-800 字）
- 角色对话：【角色名】"对话内容"
- 严格遵守剧本中的叙事风格、信息差和时空法则

## 数值变化标注（必须严格遵守！）
每次回复末尾（选项之前）必须标注本次互动产生的所有数值变化，缺一不可：
- 角色数值变化：【角色名 信任+N】或【角色名 警觉+N】或【角色名 焦虑+N】等（N通常为3-10）
示例：
（叙述内容）
【关胜 信任+5】【刘金爷 警觉+3】【额尔敦 好感-2】
1. 选项一
2. 选项二
规则：
- 每次回复至少产生1个数值变化
- 数值变化必须与当前互动的角色相关
- 调查、对话、行动都应产生相应的数值变化`
}

// ── Store ─────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // ── 初始状态 ──
    gameStarted: false,
    playerName: '',
    characters: {},

    currentDay: 1,
    currentPeriodIndex: 1,
    actionPoints: MAX_ACTION_POINTS,

    currentScene: 'camp',
    currentCharacter: null,
    characterStats: {},
    unlockedScenes: ['camp', 'mine', 'boss', 'forest', 'study'],

    currentChapter: 1,
    triggeredEvents: [],
    inventory: {},
    cluesFound: 0,

    messages: [],
    historySummary: '',
    isTyping: false,
    streamingContent: '',

    endingType: null,
    activeTab: 'dialogue' as const,
    showDashboard: false,
    storyRecords: [],
    showRecords: false,

    // ── Actions ──

    setPlayerName: (name: string) => {
      set((s) => { s.playerName = name })
    },

    initGame: () => {
      const characters = buildCharacters()
      const characterStats: Record<string, CharacterStats> = {}
      for (const [id, char] of Object.entries(characters)) {
        characterStats[id] = { ...char.initialStats }
      }
      set((s) => {
        s.gameStarted = true
        s.playerName = '林承义'
        s.characters = characters
        s.characterStats = characterStats
      })
      get().addStoryRecord('抵达金沟', '你带着陈大哥的信，踏上了这片冰冷的矿区。寻找失踪搭档陈大哥的旅程开始了。')
    },

    selectCharacter: (charId: string) => {
      set((s) => {
        s.currentCharacter = charId
        s.activeTab = 'dialogue'
      })
    },

    selectScene: (sceneId: string) => {
      const state = get()
      if (!state.unlockedScenes.includes(sceneId)) return
      const prevScene = state.currentScene
      set((s) => {
        s.currentScene = sceneId
        s.activeTab = 'dialogue'
      })
      // 场景转场富消息（仅切换时插入）
      if (prevScene !== sceneId) {
        set((s) => {
          s.messages.push({
            id: makeId(), role: 'system',
            content: `你来到了${SCENES[sceneId].name}。`,
            timestamp: Date.now(),
            type: 'scene-transition',
            sceneId,
          })
        })
      }
    },

    setActiveTab: (tab) => {
      set((s) => { s.activeTab = tab })
    },

    toggleDashboard: () => {
      set((s) => { s.showDashboard = !s.showDashboard })
    },

    addStoryRecord: (title: string, content: string) => {
      const state = get()
      set((s) => {
        s.storyRecords.push({
          id: `rec-${Date.now()}`,
          day: state.currentDay,
          period: PERIODS[state.currentPeriodIndex].name,
          title,
          content,
        })
      })
    },

    toggleRecords: () => {
      set((s) => { s.showRecords = !s.showRecords })
    },

    sendMessage: async (text: string) => {
      set((s) => {
        s.messages.push({ id: makeId(), role: 'user', content: text, timestamp: Date.now() })
        s.isTyping = true
        s.streamingContent = ''
      })

      try {
        const state = get()
        if (state.messages.length > 15 && !state.historySummary) {
          const summary = await chat([
            { role: 'system', content: '将以下对话压缩为200字以内的摘要，保留关键剧情、数值变化和线索发现：' },
            ...state.messages.slice(0, -5).map((m) => ({ role: m.role, content: m.content })),
          ])
          set((s) => { s.historySummary = summary })
        }

        const systemPrompt = buildSystemPrompt(get())
        const apiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...(get().historySummary ? [{ role: 'system' as const, content: `历史摘要: ${get().historySummary}` }] : []),
          ...get().messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        ]

        let fullContent = ''
        await streamChat(
          apiMessages,
          (chunk) => {
            fullContent += chunk
            set((s) => { s.streamingContent = fullContent })
          },
          () => {}
        )

        const prevClues = get().cluesFound
        const { charChanges, globalChanges } = parseStatChanges(fullContent, get().characters)
        set((s) => {
          for (const change of charChanges) {
            const stats = s.characterStats[change.charId]
            if (stats) {
              stats[change.stat] = Math.max(0, Math.min(100, (stats[change.stat] ?? 0) + change.delta))
            }
          }
          for (const change of globalChanges) {
            if (change.key === 'clues') {
              s.cluesFound = Math.max(0, Math.min(12, s.cluesFound + change.delta))
            }
          }
        })

        // 线索获取富消息
        const newClues = get().cluesFound
        if (newClues > prevClues) {
          set((s) => {
            s.messages.push({
              id: makeId(), role: 'system',
              content: `发现了新线索`,
              timestamp: Date.now(),
              type: 'clue-found',
            })
          })
        }

        // 连锁变动
        const postState = get()
        set((s) => {
          const kuangSuspicion = s.characterStats.kuanggong?.suspicion ?? 0
          if (kuangSuspicion >= 50 && !s.triggeredEvents.includes('gossip_to_liu')) {
            s.characterStats.liujinye.alert = Math.min(100, (s.characterStats.liujinye.alert ?? 0) + 15)
            s.triggeredEvents.push('gossip_to_liu')
          }
          const liuAlert = s.characterStats.liujinye?.alert ?? 0
          if (liuAlert >= 60 && !s.triggeredEvents.includes('shack_searched')) {
            s.triggeredEvents.push('shack_searched')
            if (s.inventory.rubbing) {
              delete s.inventory.rubbing
            }
            s.characterStats.qiaozhen.anxiety = Math.min(100, (s.characterStats.qiaozhen.anxiety ?? 0) + 20)
          }
        })

        // 检查警觉度 BE
        if ((postState.characterStats.liujinye?.alert ?? 0) >= 100) {
          set((s) => { s.endingType = 'be-eighth' })
        }

        set((s) => {
          s.messages.push({ id: makeId(), role: 'assistant', content: fullContent, timestamp: Date.now() })
          s.isTyping = false
          s.streamingContent = ''
        })

        get().advanceTime()
        get().saveGame()

      } catch {
        set((s) => { s.isTyping = false; s.streamingContent = '' })
        get().addSystemMessage('网络连接异常，请重试。')
      }
    },

    advanceTime: () => {
      const prevDay = get().currentDay
      set((s) => {
        s.actionPoints -= 1
        s.currentPeriodIndex += 1

        if (s.currentPeriodIndex >= PERIODS.length) {
          s.currentPeriodIndex = 0
          s.currentDay += 1
          s.actionPoints = MAX_ACTION_POINTS

          // 巧珍焦虑自然衰减
          const anxiety = s.characterStats.qiaozhen?.anxiety ?? 0
          if (anxiety > 0) {
            s.characterStats.qiaozhen.anxiety = Math.max(0, anxiety - 3)
          }

          // 章节推进
          const newChapter = getCurrentChapter(s.currentDay)
          if (newChapter.id !== s.currentChapter) {
            s.currentChapter = newChapter.id
            s.storyRecords.push({
              id: `rec-ch-${newChapter.id}`,
              day: s.currentDay,
              period: PERIODS[0].name,
              title: `📖 进入${newChapter.name}`,
              content: newChapter.description ?? `第${newChapter.id}幕开始`,
            })
          }
        }
      })

      const state = get()

      // 日历翻页富消息（仅日期变化时）
      if (state.currentDay !== prevDay) {
        const chapter = getCurrentChapter(state.currentDay)
        set((s) => {
          s.messages.push({
            id: makeId(), role: 'system',
            content: `第${state.currentDay}天`,
            timestamp: Date.now(),
            type: 'day-change',
            dayInfo: { day: state.currentDay, chapter: chapter.name },
          })
        })
      } else {
        get().addSystemMessage(`${PERIODS[state.currentPeriodIndex].icon} 第${state.currentDay}天 · ${PERIODS[state.currentPeriodIndex].name}`)
      }

      // 强制事件
      const events = getDayEvents(state.currentDay, state.triggeredEvents)
      for (const event of events) {
        if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
          set((s) => {
            s.triggeredEvents.push(event.id)
            s.storyRecords.push({
              id: `rec-evt-${event.id}`,
              day: state.currentDay,
              period: PERIODS[state.currentPeriodIndex].name,
              title: `🎬 ${event.name}`,
              content: event.description,
            })
          })
          get().addSystemMessage(`🎬 【${event.name}】${event.description}`)
        }
      }

      // 时间结局检查
      if (state.currentDay >= MAX_DAYS && state.currentPeriodIndex === PERIODS.length - 1) {
        get().checkEnding()
      }
    },

    useItem: (itemId: string) => {
      const state = get()
      if (!state.inventory[itemId]) return
      get().addSystemMessage(`你使用了${ITEMS[itemId]?.name ?? itemId}。`)
    },

    checkEnding: () => {
      const state = get()
      const liuAlert = state.characterStats.liujinye?.alert ?? 0

      // BE: 警觉爆表或线索不足
      if (liuAlert >= 100 || (state.currentDay >= 16 && state.cluesFound < 8)) {
        set((s) => { s.endingType = 'be-eighth' })
        return
      }

      // TE/HE/NE 由 AI 通过对话触发，这里做兜底
      if (state.currentDay >= MAX_DAYS) {
        set((s) => { s.endingType = s.endingType || 'ne-silent' })
      }
    },

    addSystemMessage: (content: string) => {
      set((s) => {
        s.messages.push({ id: makeId(), role: 'system', content, timestamp: Date.now() })
      })
    },

    resetGame: () => {
      set((s) => {
        s.gameStarted = false
        s.playerName = ''
        s.characters = {}
        s.currentDay = 1
        s.currentPeriodIndex = 1
        s.actionPoints = MAX_ACTION_POINTS
        s.currentScene = 'camp'
        s.currentCharacter = null
        s.characterStats = {}
        s.unlockedScenes = ['camp', 'mine', 'boss', 'forest', 'study']
        s.currentChapter = 1
        s.triggeredEvents = []
        s.inventory = {}
        s.cluesFound = 0
        s.messages = []
        s.historySummary = ''
        s.isTyping = false
        s.streamingContent = ''
        s.endingType = null
        s.activeTab = 'dialogue'
        s.showDashboard = false
        s.storyRecords = []
        s.showRecords = false
      })
    },

    saveGame: () => {
      const s = get()
      const data = {
        version: 1,
        playerName: s.playerName,
        characters: s.characters,
        currentDay: s.currentDay,
        currentPeriodIndex: s.currentPeriodIndex,
        actionPoints: s.actionPoints,
        currentScene: s.currentScene,
        currentCharacter: s.currentCharacter,
        characterStats: s.characterStats,
        currentChapter: s.currentChapter,
        triggeredEvents: s.triggeredEvents,
        unlockedScenes: s.unlockedScenes,
        inventory: s.inventory,
        cluesFound: s.cluesFound,
        messages: s.messages.slice(-30),
        historySummary: s.historySummary,
        endingType: s.endingType,
        activeTab: s.activeTab,
        storyRecords: s.storyRecords,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    },

    loadGame: () => {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        set((s) => {
          s.gameStarted = true
          s.playerName = data.playerName
          s.characters = buildCharacters()
          s.currentDay = data.currentDay
          s.currentPeriodIndex = data.currentPeriodIndex
          s.actionPoints = data.actionPoints
          s.currentScene = data.currentScene
          s.currentCharacter = data.currentCharacter
          s.characterStats = data.characterStats
          s.currentChapter = data.currentChapter
          s.triggeredEvents = data.triggeredEvents
          s.unlockedScenes = data.unlockedScenes
          s.inventory = data.inventory ?? {}
          s.cluesFound = data.cluesFound ?? 0
          s.messages = data.messages ?? []
          s.historySummary = data.historySummary ?? ''
          s.endingType = data.endingType
          s.activeTab = data.activeTab ?? 'dialogue'
          s.storyRecords = data.storyRecords ?? []
        })
      } catch { /* 存档损坏，忽略 */ }
    },

    hasSave: () => !!localStorage.getItem(SAVE_KEY),

    clearSave: () => { localStorage.removeItem(SAVE_KEY) },
  }))
)

// ── 统一导出 data.ts ─────────────────────────────────

export {
  SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_DAYS, MAX_ACTION_POINTS,
  STORY_INFO, FORCED_EVENTS, ENDINGS,
  QUICK_ACTIONS,
  buildCharacters, getCurrentChapter,
  getStatLevel, getAvailableCharacters, getDayEvents,
} from './data'

export type {
  Character, CharacterStats, Scene, GameItem, Chapter,
  ForcedEvent, Ending, TimePeriod, Message, StatMeta,
} from './data'
