/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 track* 系列埋点函数
 * [POS]: lib 的 Umami 埋点层，被 store.ts 和组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const PREFIX = 'jg_'

function trackEvent(name: string, data?: Record<string, string | number>) {
  try {
    ;(window as any).umami?.track(PREFIX + name, data)
  } catch { /* silent */ }
}

// ── 通用事件 ──────────────────────────────────────────
export const trackGameStart = () => trackEvent('game_start')
export const trackGameContinue = () => trackEvent('game_continue')
export const trackTimeAdvance = (day: number, period: string) =>
  trackEvent('time_advance', { day, period })
export const trackChapterEnter = (chapter: number) =>
  trackEvent('chapter_enter', { chapter })
export const trackEndingReached = (ending: string) =>
  trackEvent('ending_reached', { ending })

// ── 金沟专属事件 ──────────────────────────────────────
export const trackPlayerCreate = (name: string) =>
  trackEvent('player_create', { name })
export const trackSceneUnlock = (scene: string) =>
  trackEvent('scene_unlock', { scene })
export const trackClueFound = (clue: number) =>
  trackEvent('clue_found', { clue })
export const trackChainReaction = (type: string) =>
  trackEvent('chain_reaction', { type })
