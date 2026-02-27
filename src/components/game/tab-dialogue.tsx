/**
 * [INPUT]: 依赖 store.ts 的 messages/isTyping/streamingContent/sendMessage/inventory/useItem/cluesFound, parser.ts, data.ts
 * [OUTPUT]: 对外提供 TabDialogue 组件 + SceneTransitionCard + ClueCard + DayCard 富消息组件
 * [POS]: 对话 Tab，聊天气泡 + 富消息卡片 + 快捷操作 + 道具栏 + 输入框。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, QUICK_ACTIONS, ITEMS, SCENES, STORY_INFO } from '../../lib/store'
import type { Message } from '../../lib/store'
import { parseStoryParagraph } from '../../lib/parser'

const P = 'jg'

// ── LetterCard ────────────────────────────────────────

function LetterCard() {
  return (
    <div className={`${P}-letter-card`}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>⛏️</div>
      <h3>{STORY_INFO.title}</h3>
      <p>{STORY_INFO.description}</p>
      <div style={{
        marginTop: 16, padding: '14px 16px',
        background: 'rgba(139,105,20,0.08)', borderRadius: 12,
        textAlign: 'left', lineHeight: 1.8,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>📋 怎么玩</div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          🔹 <b>输入文字</b>或点击<b>快捷操作</b>与矿区互动<br />
          🔹 在<b>「场景」Tab</b>切换地点，探索线索<br />
          🔹 在<b>「人物」Tab</b>查看角色关系和数值变化<br />
          🔹 收集<b>12条线索</b>，揭开搭档失踪的三层真相<br />
          🔹 注意<b>警觉度</b>——被金把头盯上，你就是下一个失踪者
        </p>
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
        {STORY_INFO.era} · 共20天 · 5种结局
      </p>
    </div>
  )
}

// ── 场景转场卡（电影字幕卡 + 场景大图） ──────────────

function SceneTransitionCard({ msg }: { msg: Message }) {
  const scene = msg.sceneId ? SCENES[msg.sceneId] : null
  if (!scene) return null

  return (
    <motion.div
      className={`${P}-scene-card`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* 场景大图背景 */}
      <div className={`${P}-scene-card-bg`}>
        {scene.background.startsWith('/') ? (
          <motion.img
            src={scene.background} alt={scene.name}
            animate={{ scale: [1, 1.05] }}
            transition={{ duration: 8, ease: 'linear' }}
          />
        ) : (
          <div className={`${P}-scene-card-emoji`}>{scene.background}</div>
        )}
        <div className={`${P}-scene-card-mask`} />
      </div>

      {/* 场景信息 */}
      <div className={`${P}-scene-card-info`}>
        <span className={`${P}-scene-card-badge`}>📍 当前</span>
        <h3 className={`${P}-scene-card-name`}>{scene.icon} {scene.name}</h3>
        <p className={`${P}-scene-card-desc`}>{scene.atmosphere}</p>
      </div>
    </motion.div>
  )
}

// ── 线索获取卡片（从泥土中翻出旧物） ────────────────

function ClueCard() {
  const { cluesFound } = useGameStore()

  return (
    <motion.div
      className={`${P}-clue-card`}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className={`${P}-clue-card-header`}>
        <span className={`${P}-clue-card-icon`}>🔍</span>
        <span className={`${P}-clue-card-title`}>发现新线索</span>
        <span className={`${P}-clue-card-type`}>调查</span>
      </div>

      {/* 线索进度 */}
      <div className={`${P}-clue-card-progress`}>
        <span className={`${P}-clue-card-count`}>
          线索进度 <motion.span
            key={cluesFound}
            initial={{ scale: 1.5, color: '#f59e0b' }}
            animate={{ scale: 1, color: 'var(--primary)' }}
            transition={{ duration: 0.4 }}
          >{cluesFound}</motion.span>/12
        </span>
        <div className={`${P}-clue-card-track`}>
          <motion.div
            className={`${P}-clue-card-fill`}
            initial={{ width: `${((cluesFound - 1) / 12) * 100}%` }}
            animate={{ width: `${(cluesFound / 12) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ── 日历翻页卡（老式日历撕页飘落） ──────────────────

function DayCard({ msg }: { msg: Message }) {
  if (!msg.dayInfo) return null

  // 光绪三十二年 = 1906年，腊月起算
  const DAY_NAMES = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']

  return (
    <motion.div
      className={`${P}-day-card`}
      initial={{ opacity: 0, y: -40, rotate: -5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200 }}
    >
      <div className={`${P}-day-card-tear`} />
      <div className={`${P}-day-card-body`}>
        <div className={`${P}-day-card-number`}>
          {`第${msg.dayInfo.day}天`.split('').map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >{ch}</motion.span>
          ))}
        </div>
        <div className={`${P}-day-card-date`}>
          腊月{DAY_NAMES[msg.dayInfo.day] ?? `第${msg.dayInfo.day}日`}
        </div>
        <div className={`${P}-day-card-chapter`}>
          {msg.dayInfo.chapter}
        </div>
      </div>
    </motion.div>
  )
}

// ── MessageBubble ─────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  // 富消息路由
  if (msg.type === 'scene-transition') return <SceneTransitionCard msg={msg} />
  if (msg.type === 'clue-found') return <ClueCard />
  if (msg.type === 'day-change') return <DayCard msg={msg} />

  if (msg.role === 'system') {
    return (
      <motion.div
        key={msg.id}
        className={`${P}-bubble-system`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {msg.content}
      </motion.div>
    )
  }

  if (msg.role === 'user') {
    return (
      <motion.div
        key={msg.id}
        className={`${P}-bubble-player`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {msg.content}
      </motion.div>
    )
  }

  // assistant
  const { narrative, statHtml } = parseStoryParagraph(msg.content)
  return (
    <motion.div
      key={msg.id}
      className={`${P}-bubble-npc`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`${P}-story-paragraph`} dangerouslySetInnerHTML={{ __html: narrative }} />
      {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
    </motion.div>
  )
}

// ── StreamingBubble ───────────────────────────────────

function StreamingBubble({ content }: { content: string }) {
  const { narrative, statHtml } = parseStoryParagraph(content)
  return (
    <div className={`${P}-bubble-npc`}>
      <div className={`${P}-story-paragraph`} dangerouslySetInnerHTML={{ __html: narrative }} />
      {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
    </div>
  )
}

// ── TypingIndicator ───────────────────────────────────

function TypingIndicator() {
  return (
    <div className={`${P}-typing-indicator`}>
      <div className={`${P}-typing-dot`} />
      <div className={`${P}-typing-dot`} />
      <div className={`${P}-typing-dot`} />
    </div>
  )
}

// ── InventorySheet ────────────────────────────────────

function InventorySheet({ onClose }: { onClose: () => void }) {
  const { inventory, useItem } = useGameStore()
  const items = Object.entries(inventory).filter(([, count]) => count > 0)

  return (
    <motion.div
      className={`${P}-menu-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-inventory-sheet`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`${P}-menu-title`}>🎒 背包</h3>
        {items.length === 0 && (
          <div className={`${P}-placeholder`}>
            <p>背包里空空如也</p>
          </div>
        )}
        {items.map(([id]) => {
          const item = ITEMS[id]
          if (!item) return null
          return (
            <div
              key={id}
              className={`${P}-inventory-item`}
              onClick={() => { useItem(id); onClose() }}
            >
              <span className={`${P}-inventory-icon`}>{item.icon}</span>
              <div className={`${P}-inventory-info`}>
                <h4>{item.name}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

// ── TabDialogue ───────────────────────────────────────

export default function TabDialogue() {
  const { messages, isTyping, streamingContent, sendMessage, inventory } = useGameStore()
  const [input, setInput] = useState('')
  const [showInventory, setShowInventory] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const itemCount = Object.values(inventory).filter((n) => n > 0).length

  // 自动滚底
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    sendMessage(text)
  }, [input, isTyping, sendMessage])

  const handleQuick = useCallback((action: string) => {
    if (isTyping) return
    sendMessage(action)
  }, [isTyping, sendMessage])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 聊天区 */}
      <div ref={chatRef} className={`${P}-chat-area ${P}-scrollbar`}>
        {messages.length === 0 && <LetterCard />}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && streamingContent && <StreamingBubble content={streamingContent} />}
        {isTyping && !streamingContent && <TypingIndicator />}
      </div>

      {/* 快捷操作 */}
      <div className={`${P}-quick-grid`}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            className={`${P}-quick-btn`}
            onClick={() => handleQuick(action)}
            disabled={isTyping}
          >
            {action}
          </button>
        ))}
      </div>

      {/* 输入区 */}
      <div className={`${P}-input-area`}>
        <button
          className={`${P}-icon-btn`}
          onClick={() => setShowInventory(true)}
          style={{ position: 'relative' }}
        >
          🎒
          {itemCount > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: 0,
              background: 'var(--primary)', color: '#1a1610',
              fontSize: 10, fontWeight: 700, borderRadius: '50%',
              width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {itemCount}
            </span>
          )}
        </button>
        <input
          type="text"
          className={`${P}-input`}
          placeholder="输入你的行动..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isTyping}
        />
        <button
          className={`${P}-send-btn`}
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
        >
          ▶
        </button>
      </div>

      {/* 背包弹窗 */}
      <AnimatePresence>
        {showInventory && <InventorySheet onClose={() => setShowInventory(false)} />}
      </AnimatePresence>
    </div>
  )
}
