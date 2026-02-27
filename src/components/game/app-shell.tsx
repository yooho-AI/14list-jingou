/**
 * [INPUT]: 依赖 store.ts 的 activeTab/setActiveTab/currentDay/currentPeriodIndex/cluesFound/storyRecords/showRecords/toggleRecords/showDashboard/toggleDashboard, bgm.ts, framer-motion
 * [OUTPUT]: 对外提供 AppShell 组件（简易BGM开关 + 三向手势导航）
 * [POS]: 游戏主壳，Header(BgmToggle+笔记本按钮) + Tab路由(左右滑动手势) + TabBar + RecordSheet + DashboardDrawer。被 App.tsx 唯一消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, PERIODS, getCurrentChapter } from '../../lib/store'
import { useBgm } from '../../lib/bgm'
import TabDialogue from './tab-dialogue'
import TabScene from './tab-scene'
import TabCharacter from './tab-character'
import DashboardDrawer from './dashboard-drawer'

const P = 'jg'

const TAB_CONFIG = [
  { key: 'scene',     icon: '🗺️', label: '场景' },
  { key: 'dialogue',  icon: '💬', label: '对话' },
  { key: 'character', icon: '👤', label: '人物' },
] as const

// ── RecordSheet ──────────────────────────────────────

function RecordSheet({ onClose }: { onClose: () => void }) {
  const { storyRecords } = useGameStore()

  return (
    <motion.div
      className={`${P}-menu-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-record-sheet`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`${P}-menu-title`}>记录</h3>
        {storyRecords.length === 0 && (
          <div className={`${P}-placeholder`}><p>暂无记录</p></div>
        )}
        <div className={`${P}-record-timeline`}>
          {[...storyRecords].reverse().map((rec) => (
            <div key={rec.id} className={`${P}-record-item`}>
              <div className={`${P}-record-dot`} />
              <div className={`${P}-record-body`}>
                <div className={`${P}-record-meta`}>第{rec.day}天 · {rec.period}</div>
                <div className={`${P}-record-title`}>{rec.title}</div>
                <div className={`${P}-record-content`}>{rec.content}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Header 简易音乐开关 ──────────────────────────────

function BgmToggle() {
  const { isPlaying, toggle } = useBgm()
  return (
    <button className={`${P}-icon-btn`} onClick={(e) => toggle(e)}>
      {isPlaying ? '🔊' : '🔇'}
    </button>
  )
}

// ── AppShell ─────────────────────────────────────────

export default function AppShell({ onMenuOpen }: { onMenuOpen: () => void }) {
  const {
    activeTab, setActiveTab,
    currentDay, currentPeriodIndex, cluesFound,
    showRecords, toggleRecords,
    showDashboard, toggleDashboard,
  } = useGameStore()

  const period = PERIODS[currentPeriodIndex]
  const chapter = getCurrentChapter(currentDay)

  /* ── 左右滑动手势 ── */
  const touchRef = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current || showDashboard || showRecords) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    /* 必须是明确的水平滑动 */
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx > 0) toggleDashboard()   /* 右滑 → 打开左侧笔记本 */
    else toggleRecords()            /* 左滑 → 打开右侧记录 */
  }

  return (
    <div className={`${P}-shell`}>
      {/* ── Header ── */}
      <header className={`${P}-header`}>
        <div className={`${P}-header-left`}>
          <button className={`${P}-icon-btn ${P}-dash-btn`} onClick={toggleDashboard}>
            📓
          </button>
          <span>第{currentDay}天 · {period.name}</span>
        </div>
        <div className={`${P}-header-center`}>
          <span className={`${P}-progress-badge`}>🔍 {cluesFound}/12</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chapter.name}</span>
        </div>
        <div className={`${P}-header-right`}>
          <BgmToggle />
          <button className={`${P}-icon-btn`} onClick={onMenuOpen}>☰</button>
          <button className={`${P}-icon-btn`} onClick={toggleRecords}>📜</button>
        </div>
      </header>

      {/* ── Tab Content（支持左右滑动手势）── */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%' }}
          >
            {activeTab === 'dialogue' && <TabDialogue />}
            {activeTab === 'scene' && <TabScene />}
            {activeTab === 'character' && <TabCharacter />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── TabBar ── */}
      <nav className={`${P}-tab-bar`}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            className={`${P}-tab-item ${activeTab === tab.key ? `${P}-tab-active` : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ── 调查笔记本（左侧滑入）── */}
      <AnimatePresence>
        {showDashboard && <DashboardDrawer onClose={toggleDashboard} />}
      </AnimatePresence>

      {/* ── 记录面板（右侧滑入）── */}
      <AnimatePresence>
        {showRecords && <RecordSheet onClose={toggleRecords} />}
      </AnimatePresence>
    </div>
  )
}
