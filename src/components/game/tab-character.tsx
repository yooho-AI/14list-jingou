/**
 * [INPUT]: 依赖 store.ts 的 characters/currentCharacter/selectCharacter/characterStats/currentDay
 * [OUTPUT]: 对外提供 TabCharacter 组件 + CharacterDossier 全屏档案卡
 * [POS]: 人物 Tab，2x2角色网格(聊天按钮+mini好感条) + SVG关系图谱 + CharacterDossier overlay+sheet + CharacterChat
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatCircleDots } from '@phosphor-icons/react'
import { useGameStore, getAvailableCharacters } from '../../lib/store'
import type { StatMeta, Character } from '../../lib/store'
import CharacterChat from './character-chat'

const P = 'jg'

// ── StatBar ───────────────────────────────────────────

function StatBar({ meta, value, delay = 0 }: { meta: StatMeta; value: number; delay?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 36, whiteSpace: 'nowrap' }}>{meta.icon} {meta.label}</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(139,105,20,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 3, backgroundColor: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, minWidth: 20, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ── 关系标签 ──────────────────────────────────────────

const STATIC_RELATIONS: Record<string, string> = {
  qiaozhen: '妻子',
  zhaoxiucai: '同乡',
  kuanggong: '工友',
}

function getRelationLabel(char: Character, stats: Record<string, number>): { text: string; color: string } {
  const relationMeta = char.statMetas.find((m) => m.category === 'relation')
  if (relationMeta) {
    const val = stats[relationMeta.key] ?? 0
    return { text: `${relationMeta.label} ${val}`, color: relationMeta.color }
  }
  return { text: STATIC_RELATIONS[char.id] ?? char.title, color: 'var(--text-muted)' }
}

// ── 角色档案卡（overlay + sheet） ───────────────────────

function CharacterDossier({ char, stats, onClose }: {
  char: Character
  stats: Record<string, number>
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rel = getRelationLabel(char, stats)

  return (
    <>
      <motion.div
        className={`${P}-dossier-overlay`}
        style={{ background: 'rgba(0,0,0,0.5)', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`${P}-record-sheet`}
        style={{ zIndex: 52, overflowY: 'auto' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* 关闭 */}
        <button className={`${P}-dossier-close`} onClick={onClose}>✕</button>

        {/* 密印标记 */}
        <div className={`${P}-dossier-seal`}>【卷宗】</div>

        {/* 立绘区 */}
        <div className={`${P}-dossier-portrait`}>
          {char.portrait.startsWith('/') ? (
            <motion.img
              src={char.portrait} alt={char.name}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : (
            <div className={`${P}-dossier-portrait-emoji`}>{char.portrait}</div>
          )}
          <div className={`${P}-dossier-portrait-fade`} />
        </div>

        {/* 姓名 + 头衔 */}
        <div className={`${P}-dossier-header`}>
          <h2 className={`${P}-dossier-name`}>{char.name}</h2>
          <p className={`${P}-dossier-title`}>{char.title} · {char.description}</p>
        </div>

        {/* 基础信息条 */}
        <div className={`${P}-dossier-tags`}>
          <span className={`${P}-dossier-tag`}>{char.gender === 'female' ? '女' : '男'}</span>
          {char.age > 0 && <span className={`${P}-dossier-tag`}>{char.age}岁</span>}
          <span className={`${P}-dossier-tag`}>{char.title}</span>
        </div>

        {/* 数值区 */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>数值</div>
          {char.statMetas.map((meta, i) => (
            <StatBar key={meta.key} meta={meta} value={stats[meta.key] ?? 0} delay={i * 0.1} />
          ))}
        </div>

        {/* 性格描述 */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>性情</div>
          <p className={`${P}-dossier-text`}>
            {expanded ? char.personality : char.personality.slice(0, 40)}
            {char.personality.length > 40 && (
              <button
                className={`${P}-dossier-expand`}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? ' 收起' : '...展开'}
              </button>
            )}
          </p>
          <p className={`${P}-dossier-text`} style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6 }}>
            「{char.speakingStyle}」
          </p>
        </div>

        {/* 关系线索 */}
        <div className={`${P}-dossier-section`}>
          <div className={`${P}-dossier-section-title`}>关系</div>
          <div className={`${P}-dossier-relation`}>
            <span style={{ color: rel.color, fontWeight: 600 }}>{rel.text}</span>
          </div>
          <div className={`${P}-dossier-hints`}>
            {char.triggerPoints.map((tp, i) => (
              <span key={i} className={`${P}-dossier-hint`}>
                {tp.slice(0, 4)}{'···'}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── SVG 关系图谱 ──────────────────────────────────────

const W = 380
const H = 300
const CX = W / 2
const CY = H / 2
const R = 105
const NODE_R = 22

function RelationGraph({ onNodeClick }: { onNodeClick: (id: string) => void }) {
  const { characters, characterStats, currentDay, currentCharacter } = useGameStore()
  const available = getAvailableCharacters(currentDay, characters)
  const entries = Object.entries(available)

  const nodes = entries.map(([id, char], i) => {
    const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2
    return { id, char, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginBottom: 16 }}>
      {/* 连线 */}
      {nodes.map((node) => {
        const stats = characterStats[node.id] ?? {}
        const rel = getRelationLabel(node.char, stats)
        const mx = (CX + node.x) / 2
        const my = (CY + node.y) / 2
        const dx = node.x - CX
        const dy = node.y - CY
        const len = Math.sqrt(dx * dx + dy * dy)
        const sx = CX + (dx / len) * (NODE_R + 2)
        const sy = CY + (dy / len) * (NODE_R + 2)
        const ex = node.x - (dx / len) * (NODE_R + 2)
        const ey = node.y - (dy / len) * (NODE_R + 2)
        const isSelected = node.id === currentCharacter

        return (
          <g key={`line-${node.id}`}>
            <line
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={isSelected ? node.char.themeColor : 'rgba(139,105,20,0.2)'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={isSelected ? 'none' : '4 3'}
            />
            <rect x={mx - 28} y={my - 8} width={56} height={16} rx={4} fill="rgba(26,22,16,0.9)" />
            <text x={mx} y={my + 3} textAnchor="middle" fontSize={9} fontWeight={600} fill={rel.color}>{rel.text}</text>
          </g>
        )
      })}

      {/* 中心节点 */}
      <circle cx={CX} cy={CY} r={NODE_R + 4} fill="none" stroke="var(--primary)" strokeWidth={2.5} opacity={0.6} />
      <circle cx={CX} cy={CY} r={NODE_R} fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.5} />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🧑</text>
      <text x={CX} y={CY + NODE_R + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--primary)">我</text>

      {/* NPC 节点 */}
      {nodes.map((node) => {
        const isSelected = node.id === currentCharacter
        return (
          <g key={`node-${node.id}`} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(node.id)}>
            {isSelected && <circle cx={node.x} cy={node.y} r={NODE_R + 4} fill="none" stroke={node.char.themeColor} strokeWidth={2} opacity={0.5} />}
            <circle cx={node.x} cy={node.y} r={NODE_R} fill="rgba(139,105,20,0.08)" stroke={isSelected ? node.char.themeColor : 'var(--border)'} strokeWidth={isSelected ? 1.5 : 1} />
            <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>
              {node.char.portrait.startsWith('/') ? '👤' : node.char.portrait}
            </text>
            <text x={node.x} y={node.y + NODE_R + 13} textAnchor="middle" fontSize={10} fontWeight={600} fill={isSelected ? node.char.themeColor : 'var(--text-secondary)'}>
              {node.char.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── TabCharacter ──────────────────────────────────────

export default function TabCharacter() {
  const { characters, currentCharacter, selectCharacter, characterStats, currentDay } = useGameStore()
  const [dossierCharId, setDossierCharId] = useState<string | null>(null)
  const [chatChar, setChatChar] = useState<string | null>(null)

  const available = getAvailableCharacters(currentDay, characters)

  const dossierChar = dossierCharId ? characters[dossierCharId] : null
  const dossierStats = dossierCharId ? (characterStats[dossierCharId] ?? {}) : {}

  const handleCharClick = (id: string) => {
    selectCharacter(id)
    setDossierCharId(id)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12 }} className={`${P}-scrollbar`}>

      {/* ── 角色网格 (2x2) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        👤 人物一览
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(available).map(([id, char]) => {
          const stats = characterStats[id] ?? {}
          const rel = getRelationLabel(char, stats)
          const relationMeta = char.statMetas.find((m) => m.category === 'relation')
          const affValue = relationMeta ? (stats[relationMeta.key] ?? 0) : 0
          return (
            <button
              key={id}
              onClick={() => handleCharClick(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: 10, borderRadius: 12,
                background: 'var(--bg-card)',
                border: currentCharacter === id ? `2px solid ${char.themeColor}` : '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* 聊天按钮 */}
              <div
                onClick={(e) => { e.stopPropagation(); setChatChar(id) }}
                style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${char.themeColor}18`,
                  border: `1px solid ${char.themeColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                <ChatCircleDots size={16} weight="fill" color={char.themeColor} />
              </div>
              {char.portrait.startsWith('/') ? (
                <img
                  src={char.portrait}
                  alt={char.name}
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    objectFit: 'cover', objectPosition: 'center top',
                    border: `2px solid ${char.themeColor}44`,
                    marginBottom: 6,
                  }}
                />
              ) : (
                <span style={{
                  width: 56, height: 56, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, background: 'var(--bg-hover)',
                  border: `2px solid ${char.themeColor}44`,
                  marginBottom: 6,
                }}>
                  {char.portrait}
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 500, color: char.themeColor }}>
                {char.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {char.title}
              </span>
              {/* Mini affection bar */}
              <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(139,105,20,0.1)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: char.themeColor,
                  width: `${Math.min(affValue, 100)}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {rel.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 人物关系图谱 ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        🔗 人物关系
      </h4>
      <div className={`${P}-card`} style={{ padding: 8, marginBottom: 16 }}>
        <RelationGraph onNodeClick={handleCharClick} />
      </div>

      <div style={{ height: 16 }} />

      {/* ── 全屏档案卡 ── */}
      <AnimatePresence>
        {dossierChar && (
          <CharacterDossier
            char={dossierChar}
            stats={dossierStats}
            onClose={() => setDossierCharId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Character Chat ── */}
      <AnimatePresence>
        {chatChar && characters[chatChar] && (
          <CharacterChat charId={chatChar} onClose={() => setChatChar(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
