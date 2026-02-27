/**
 * [INPUT]: 依赖 store.ts 全部状态和操作, framer-motion, components/game/*
 * [OUTPUT]: 对外提供 App 根组件
 * [POS]: 应用根组件，StartScreen / GameScreen 二态 + EndingModal + MenuOverlay
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ENDINGS } from './lib/store'
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

// ── 手写字拆字渲染 ────────────────────────────────────
function HandWrite({ text }: { text: string }) {
  return <>{[...text].map((c, i) => (
    <span key={i} className={`${P}-letter-char`}>{c}</span>
  ))}</>
}

function StartScreen() {
  const { initGame, loadGame, hasSave } = useGameStore()
  const { isPlaying: musicOn, toggle: handleMusic } = useBgm()
  const saved = hasSave()
  const [phase, setPhase] = useState<'letter' | 'crawl'>('letter')

  const handleStart = useCallback(() => {
    trackGameStart()
    setPhase('crawl')
  }, [])

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  const handleCrawlEnd = useCallback(() => {
    initGame()
  }, [initGame])

  return (
    <div className={`${P}-start`}>

      {/* ── 第一幕：信 + 开始/继续 ── */}
      <AnimatePresence>
        {phase === 'letter' && (
          <motion.div
            className={`${P}-letter-scene`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={`${P}-letter`}>
              <div className={`${P}-letter-text`}>
                <span className={`${P}-letter-line`}><HandWrite text="承义兄弟，" /></span>
                <span className={`${P}-letter-line`}><HandWrite text="这里有活路。" /></span>
                <span className={`${P}-letter-line`}><HandWrite text="带嫂子来。" /></span>
              </div>
              <p className={`${P}-letter-sign`}><HandWrite text="陈大哥" /></p>
            </div>

            {/* CTA 按钮 */}
            <motion.div
              className={`${P}-start-cta`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              <button className={`${P}-start-btn`} onClick={handleStart}>
                ⛏️ 开始调查
              </button>
              {saved && (
                <button className={`${P}-continue-btn`} onClick={handleContinue}>
                  📖 继续上次
                </button>
              )}
              <button className={`${P}-icon-btn`} onClick={handleMusic} style={{ marginTop: 8 }}>
                {musicOn ? '🔊' : '🔇'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 第二幕：电影字幕 ── */}
      <AnimatePresence>
        {phase === 'crawl' && (
          <motion.div
            className={`${P}-crawl-scene`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <video
              className={`${P}-crawl-bg`}
              src="/scenes/crawl-bg.mp4"
              autoPlay muted loop playsInline
            />
            <div className={`${P}-crawl-frost`} />
            <div
              className={`${P}-crawl`}
              onAnimationEnd={handleCrawlEnd}
            >
              <p className={`${P}-crawl-era`}>光绪三十二年</p>

              <div className={`${P}-crawl-block`}>
                <p>大清国运将尽</p>
                <p>东北莽林深处</p>
                <p>漠河金矿却正鼎盛</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>朝廷设金厂</p>
                <p>民间称"老金沟"</p>
                <p>千余苦力日夜掘金</p>
                <p>黄金出山&#12288;&#12288;血肉入土</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>三个月前</p>
                <p>你收到搭档陈大哥的信</p>
                <p>信上说这里有活路</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>你叫林承义</p>
                <p>山东人&#12288;三十五岁</p>
                <p>种了半辈子地&#12288;颗粒无收</p>
                <p>带着怀孕的妻子巧珍</p>
                <p>变卖家当&#12288;一路北上</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>腊月十九</p>
                <p>你到了老金沟</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>陈大哥的窝棚还在</p>
                <p>他的靰鞡鞋整齐摆在门口</p>
                <p>灶台的灰是冷的</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>零下四十度</p>
                <p>没有人光脚出门</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>你问了一圈</p>
                <p>没人说见过他</p>
                <p>没人愿意多说一个字</p>
              </div>

              <div className={`${P}-crawl-block`}>
                <p>只有工头老孙头</p>
                <p>压低声音讲了句——</p>
              </div>

              <p className={`${P}-crawl-hook`}>"别问了&#12288;好好挖你的金"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 跳过按钮 ── */}
      <AnimatePresence>
        {phase === 'crawl' && (
          <motion.button
            className={`${P}-skip-btn`}
            onClick={handleCrawlEnd}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
          >
            跳过 ›
          </motion.button>
        )}
      </AnimatePresence>
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
