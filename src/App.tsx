/**
 * [INPUT]: 依赖 store.ts 全部状态和操作, framer-motion, components/game/*
 * [OUTPUT]: 对外提供 App 根组件
 * [POS]: 应用根组件，StartScreen / GameScreen 二态 + EndingModal + MenuOverlay
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ENDINGS, STORY_INFO } from './lib/store'
import { useBgm } from './lib/bgm'
import { trackGameStart, trackGameContinue, trackEndingReached } from './lib/analytics'
import AppShell from './components/game/app-shell'
import './styles/globals.css'

const P = 'jg'

// ── 结局映射 ──────────────────────────────────────────

const ENDING_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  TE: { label: '⭐ True Ending',   color: '#ffd700', icon: '👑' },
  HE: { label: '🎉 Happy Ending',  color: '#22c55e', icon: '🌟' },
  BE: { label: '💀 Bad Ending',     color: '#64748b', icon: '💔' },
  NE: { label: '🌙 Normal Ending',  color: '#eab308', icon: '🌙' },
}

// ── StartScreen ──────────────────────────────────────

function StartScreen() {
  const { initGame, loadGame, hasSave } = useGameStore()
  const { isPlaying: musicOn, toggle: handleMusic } = useBgm()
  const saved = hasSave()

  const handleStart = useCallback(() => {
    trackGameStart()
    initGame()
  }, [initGame])

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  return (
    <div className={`${P}-start`}>
      {/* ── 可滚动内容区 ── */}
      <div className={`${P}-start-scroll`}>
        <motion.div
          className={`${P}-start-inner`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* ── 标题 ── */}
          <div className={`${P}-start-emoji`}>⛏️</div>
          <h1>{STORY_INFO.title}</h1>
          <h2>{STORY_INFO.subtitle}</h2>

          {/* ── 身份卡：你是谁 ── */}
          <div className={`${P}-identity-card`}>
            <div className={`${P}-identity-label`}>你将扮演</div>
            <div className={`${P}-identity-name`}>林承义</div>
            <div className={`${P}-identity-desc`}>
              山东逃荒汉，为了活命，带着妻子巧珍一路北上，投奔在漠河淘金的搭档——陈大哥。
            </div>
          </div>

          {/* ── 情报卡：发生了什么 ── */}
          <div className={`${P}-briefing-card`}>
            <div className={`${P}-briefing-header`}>⚠️ 情况</div>
            <p className={`${P}-briefing-text`}>
              光绪三十二年冬，你抵达漠河老金沟矿区，却发现<strong>陈大哥已经失踪</strong>。
              他的靰鞡鞋整整齐齐摆在门口——零下四十度，没有人光脚出门。
            </p>
            <p className={`${P}-briefing-text`}>
              矿区由<strong>金把头刘德厚</strong>一手遮天。
              工人们讳莫如深，没人愿意提起失踪的事。
            </p>
          </div>

          {/* ── 目标卡：你要做什么 ── */}
          <div className={`${P}-objective-card`}>
            <div className={`${P}-objective-header`}>🎯 你的目标</div>
            <div className={`${P}-objective-item`}>
              <span className={`${P}-objective-num`}>1</span>
              <span>在<strong>20天内</strong>收集<strong>12条线索</strong>，调查陈大哥失踪的真相</span>
            </div>
            <div className={`${P}-objective-item`}>
              <span className={`${P}-objective-num`}>2</span>
              <span>与矿区各色人物周旋——有人是帮手，有人是威胁</span>
            </div>
            <div className={`${P}-objective-item`}>
              <span className={`${P}-objective-num`}>3</span>
              <span>控制<strong>警觉度</strong>——被金把头盯上，你就是下一个失踪者</span>
            </div>
          </div>

          {/* ── 玩法提示 ── */}
          <div className={`${P}-howto-card`}>
            <div className={`${P}-howto-header`}>💡 怎么玩</div>
            <p className={`${P}-howto-text`}>
              输入文字或点击快捷操作与矿区互动。<br />
              底部切换「场景」探索不同地点，「人物」查看关系与数值变化。
            </p>
          </div>

          <div className={`${P}-start-footer`}>
            <button className={`${P}-icon-btn`} onClick={handleMusic}>
              {musicOn ? '🔊' : '🔇'}
            </button>
            <span className={`${P}-start-meta`}>20天 · 5种结局 · AI驱动叙事</span>
          </div>
        </motion.div>
      </div>

      {/* ── 底部固定按钮 ── */}
      <div className={`${P}-start-cta`}>
        <button className={`${P}-start-btn`} onClick={handleStart}>
          ⛏️ 开始调查
        </button>
        {saved && (
          <button className={`${P}-continue-btn`} onClick={handleContinue}>
            📖 继续上次
          </button>
        )}
      </div>
    </div>
  )
}

// ── EndingModal ──────────────────────────────────────

function EndingModal() {
  const { endingType, resetGame, clearSave } = useGameStore()
  if (!endingType) return null

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null

  const meta = ENDING_TYPE_MAP[ending.type] ?? ENDING_TYPE_MAP.NE

  useEffect(() => {
    trackEndingReached(ending.id)
  }, [ending.id])

  const handleReturn = () => {
    clearSave()
    resetGame()
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`${P}-ending-overlay`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`${P}-ending-modal`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`${P}-ending-icon`}>{meta.icon}</div>
          <div
            className={`${P}-ending-type`}
            style={{ background: `${meta.color}20`, color: meta.color }}
          >
            {meta.label}
          </div>
          <h2 className={`${P}-ending-name`}>{ending.name}</h2>
          <p className={`${P}-ending-desc`}>{ending.description}</p>
          <button className={`${P}-ending-btn`} onClick={handleReturn}>
            回到起点
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── MenuOverlay ──────────────────────────────────────

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const { saveGame, loadGame, resetGame, clearSave } = useGameStore()
  const [notification, setNotification] = useState('')

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 2000)
  }

  return (
    <motion.div
      className={`${P}-menu-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-menu-sheet`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`${P}-menu-title`}>菜单</h3>
        <button className={`${P}-menu-btn`} onClick={() => { saveGame(); notify('已保存') }}>
          💾 保存进度
        </button>
        <button className={`${P}-menu-btn`} onClick={() => { loadGame(); onClose() }}>
          📖 读取存档
        </button>
        <button className={`${P}-menu-btn ${P}-menu-btn-danger`} onClick={() => {
          clearSave(); resetGame(); onClose()
        }}>
          🗑️ 重新开始
        </button>
        <button className={`${P}-menu-btn`} onClick={onClose}>
          继续游戏
        </button>

        {notification && (
          <motion.div
            className={`${P}-notification`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)' }}
          >
            {notification}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── App 根组件 ────────────────────────────────────────

export default function App() {
  const { gameStarted } = useGameStore()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!gameStarted) return <StartScreen />

  return (
    <>
      <AppShell onMenuOpen={() => setMenuOpen(true)} />

      <AnimatePresence>
        {menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>

      <EndingModal />
    </>
  )
}
