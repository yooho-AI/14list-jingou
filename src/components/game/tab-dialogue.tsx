/**
 * [INPUT]: 依赖 store.ts 的 messages/isTyping/streamingContent/sendMessage/inventory/useItem, parser.ts, data.ts
 * [OUTPUT]: 对外提供 TabDialogue 组件
 * [POS]: 对话 Tab，聊天气泡 + 快捷操作 + 道具栏 + 输入框。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, QUICK_ACTIONS, ITEMS, STORY_INFO } from '../../lib/store'
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

// ── MessageBubble ─────────────────────────────────────

function MessageBubble({ msg }: { msg: { id: string; role: string; content: string } }) {
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
