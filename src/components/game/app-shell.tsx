/**
 * [INPUT]: 依赖 store.ts 的 activeTab/setActiveTab/currentDay/currentPeriodIndex/cluesFound/storyRecords/showRecords/toggleRecords, framer-motion
 * [OUTPUT]: 对外提供 AppShell 组件
 * [POS]: 游戏主壳，Header + Tab 路由 + TabBar + RecordSheet。被 App.tsx 唯一消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, PERIODS, getCurrentChapter } from '../../lib/store'
import { useBgm } from '../../lib/bgm'
import TabDialogue from './tab-dialogue'
import TabScene from './tab-scene'
import TabCharacter from './tab-character'

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
        <h3 className={`${P}-menu-title`}>📜 记录</h3>
        {storyRecords.length === 0 && (
          <div className={`${P}-placeholder`}>
            <p>暂无记录</p>
          </div>
        )}
        <div className={`${P}-record-timeline`}>
          {[...storyRecords].reverse().map((rec) => (
            <div key={rec.id} className={`${P}-record-item`}>
              <div className={`${P}-record-dot`} />
              <div className={`${P}-record-body`}>
                <div className={`${P}-record-meta`}>
                  第{rec.day}天 · {rec.period}
                </div>
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

// ── AppShell ─────────────────────────────────────────

export default function AppShell({ onMenuOpen }: { onMenuOpen: () => void }) {
  const {
    activeTab, setActiveTab,
    currentDay, currentPeriodIndex, cluesFound,
    showRecords, toggleRecords,
  } = useGameStore()
  const { isPlaying: musicOn, toggle: handleMusic } = useBgm()

  const period = PERIODS[currentPeriodIndex]
  const chapter = getCurrentChapter(currentDay)

  return (
    <div className={`${P}-shell`}>
      {/* ── Header ── */}
      <header className={`${P}-header`}>
        <div className={`${P}-header-left`}>
          <span>{period.icon}</span>
          <span>第{currentDay}天 · {period.name}</span>
        </div>
        <div className={`${P}-header-center`}>
          <span className={`${P}-progress-badge`}>
            🔍 {cluesFound}/12
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {chapter.name}
          </span>
        </div>
        <div className={`${P}-header-right`}>
          <button className={`${P}-icon-btn`} onClick={handleMusic}>
            {musicOn ? '🔊' : '🔇'}
          </button>
          <button className={`${P}-icon-btn`} onClick={onMenuOpen}>
            ☰
          </button>
          <button className={`${P}-icon-btn`} onClick={toggleRecords}>
            📜
          </button>
        </div>
      </header>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
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

      {/* ── 记录面板 ── */}
      <AnimatePresence>
        {showRecords && <RecordSheet onClose={toggleRecords} />}
      </AnimatePresence>
    </div>
  )
}
