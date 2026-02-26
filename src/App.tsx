/**
 * [INPUT]: 依赖 store.ts 全部状态和操作, framer-motion, components/game/*
 * [OUTPUT]: 对外提供 App 根组件
 * [POS]: 应用根组件，StartScreen / GameScreen 二态 + EndingModal + MenuOverlay
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ENDINGS, STORY_INFO, buildCharacters } from './lib/store'
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
  const previewChars = Object.values(buildCharacters()).slice(0, 6)
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={`${P}-start-emoji`}>⛏️</div>
        <h1>{STORY_INFO.title}</h1>
        <h2>{STORY_INFO.subtitle}</h2>
        <p className={`${P}-start-desc`}>{STORY_INFO.description}</p>

        {/* 角色预览 */}
        <div className={`${P}-preview-grid`}>
          {previewChars.map((char) => (
            <div key={char.id} className={`${P}-preview-card`}>
              {char.portrait.startsWith('/') ? (
                <img src={char.portrait} alt={char.name} className={`${P}-preview-avatar`} loading="lazy" />
              ) : (
                <span className={`${P}-preview-avatar`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'var(--bg-hover)', borderRadius: '50%' }}>{char.portrait}</span>
              )}
              <span className={`${P}-preview-name`}>{char.name}</span>
            </div>
          ))}
        </div>

        {/* 固定角色身份 */}
        <div style={{
          padding: '12px 20px', marginBottom: 20,
          background: 'var(--primary-light)', border: '1px solid var(--primary-border)',
          borderRadius: 14, maxWidth: 280, width: '100%',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>你将扮演</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>林承义</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>山东逃荒汉，陈大哥的兄弟，巧珍的丈夫</div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className={`${P}-start-btn`} onClick={handleStart}>
            进入金沟
          </button>

          {saved && (
            <button className={`${P}-continue-btn`} onClick={handleContinue}>
              📖 继续上次
            </button>
          )}
        </div>

        <button
          className={`${P}-icon-btn`}
          onClick={handleMusic}
          style={{ marginTop: 16 }}
        >
          {musicOn ? '🔊' : '🔇'}
        </button>
      </motion.div>
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
