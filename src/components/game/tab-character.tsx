/**
 * [INPUT]: 依赖 store.ts 的 characters/currentCharacter/selectCharacter/characterStats/currentDay
 * [OUTPUT]: 对外提供 TabCharacter 组件
 * [POS]: 人物 Tab，当前人物卡(左绘右值) + SVG关系图谱 + 全部人物(2列)。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion'
import { useGameStore, getAvailableCharacters } from '../../lib/store'
import type { StatMeta, Character } from '../../lib/store'

const P = 'jg'

// ── 图片/emoji 渲染辅助 ──────────────────────────────

function AssetBox({ src, size = 120 }: { src: string; size?: number }) {
  if (src.startsWith('/')) {
    return <img src={src} alt="" style={{ width: size, height: size * 16 / 9, objectFit: 'cover', borderRadius: 12 }} />
  }
  return (
    <div style={{
      width: size, height: size * 16 / 9,
      background: 'var(--bg-hover)', borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4,
    }}>
      {src}
    </div>
  )
}

function SmallAvatar({ src, size = 28 }: { src: string; size?: number }) {
  if (src.startsWith('/')) {
    return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.6,
    }}>
      {src}
    </span>
  )
}

// ── StatBar ───────────────────────────────────────────

function StatBar({ meta, value }: { meta: StatMeta; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 36, whiteSpace: 'nowrap' }}>{meta.icon} {meta.label}</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(139,105,20,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 3, backgroundColor: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, minWidth: 20, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ── 关系标签（没有 relation 类数值时用身份描述） ──────

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

// ── SVG 关系图谱 ──────────────────────────────────────

const W = 380
const H = 300
const CX = W / 2
const CY = H / 2
const R = 105
const NODE_R = 22

function RelationGraph() {
  const { characters, characterStats, currentDay, selectCharacter, currentCharacter } = useGameStore()
  const available = getAvailableCharacters(currentDay, characters)
  const entries = Object.entries(available)

  // 环形布局：NPC 节点围绕中心
  const nodes = entries.map(([id, char], i) => {
    const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2
    return {
      id,
      char,
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    }
  })

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', marginBottom: 16 }}
    >
      {/* 连线 */}
      {nodes.map((node) => {
        const stats = characterStats[node.id] ?? {}
        const rel = getRelationLabel(node.char, stats)

        // 连线中点
        const mx = (CX + node.x) / 2
        const my = (CY + node.y) / 2

        // 连线角度
        const dx = node.x - CX
        const dy = node.y - CY
        const len = Math.sqrt(dx * dx + dy * dy)

        // 缩短连线：从中心节点边缘到 NPC 节点边缘
        const sx = CX + (dx / len) * (NODE_R + 2)
        const sy = CY + (dy / len) * (NODE_R + 2)
        const ex = node.x - (dx / len) * (NODE_R + 2)
        const ey = node.y - (dy / len) * (NODE_R + 2)

        const isSelected = node.id === currentCharacter

        return (
          <g key={`line-${node.id}`}>
            <line
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={isSelected ? node.char.themeColor : 'rgba(139,105,20,0.25)'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={isSelected ? 'none' : '4 3'}
            />
            {/* 关系标签背景 */}
            <rect
              x={mx - 28} y={my - 8}
              width={56} height={16}
              rx={4}
              fill="var(--bg-primary)"
              opacity={0.9}
            />
            <text
              x={mx} y={my + 3}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill={rel.color}
            >
              {rel.text}
            </text>
          </g>
        )
      })}

      {/* 中心节点 = 玩家 */}
      <circle cx={CX} cy={CY} r={NODE_R + 4} fill="none" stroke="var(--primary)" strokeWidth={2.5} opacity={0.6} />
      <circle cx={CX} cy={CY} r={NODE_R} fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={1.5} />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🧑</text>
      <text x={CX} y={CY + NODE_R + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--primary)">我</text>

      {/* NPC 节点 */}
      {nodes.map((node) => {
        const isSelected = node.id === currentCharacter
        return (
          <g
            key={`node-${node.id}`}
            style={{ cursor: 'pointer' }}
            onClick={() => selectCharacter(node.id)}
          >
            {isSelected && (
              <circle cx={node.x} cy={node.y} r={NODE_R + 4} fill="none" stroke={node.char.themeColor} strokeWidth={2} opacity={0.5} />
            )}
            <circle
              cx={node.x} cy={node.y} r={NODE_R}
              fill="rgba(139,105,20,0.08)"
              stroke={isSelected ? node.char.themeColor : 'var(--border)'}
              strokeWidth={isSelected ? 1.5 : 1}
            />
            <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>
              {node.char.portrait.startsWith('/') ? '👤' : node.char.portrait}
            </text>
            <text
              x={node.x} y={node.y + NODE_R + 13}
              textAnchor="middle" fontSize={10} fontWeight={600}
              fill={isSelected ? node.char.themeColor : 'var(--text-secondary)'}
            >
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
  const {
    characters, currentCharacter, selectCharacter,
    characterStats, currentDay,
  } = useGameStore()

  const available = getAvailableCharacters(currentDay, characters)
  const char = currentCharacter ? characters[currentCharacter] : null
  const stats = currentCharacter ? (characterStats[currentCharacter] ?? {}) : {}

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12 }} className={`${P}-scrollbar`}>

      {/* ── 当前人物 ── */}
      <div className={`${P}-section-title`}>👤 当前人物</div>
      {char ? (
        <div className={`${P}-card`} style={{ display: 'flex', gap: 14, marginBottom: 16, padding: 14 }}>
          <AssetBox src={char.portrait} size={100} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{char.name}</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{char.title} · {char.description}</p>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>数值</div>
            {char.statMetas.map((meta) => (
              <StatBar key={meta.key} meta={meta} value={stats[meta.key] ?? 0} />
            ))}
          </div>
        </div>
      ) : (
        <div className={`${P}-placeholder`} style={{ marginBottom: 16 }}>
          <div className={`${P}-placeholder-icon`}>👤</div>
          <p>选择一个角色开始互动</p>
        </div>
      )}

      {/* ── 人物关系图谱 ── */}
      <div className={`${P}-section-title`}>🔗 人物关系</div>
      <div className={`${P}-card`} style={{ padding: 8, marginBottom: 16 }}>
        <RelationGraph />
      </div>

      {/* ── 所有人物 ── */}
      <div className={`${P}-section-title`}>👥 所有人物</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(available).map(([id, c]) => {
          const isActive = id === currentCharacter
          return (
            <button
              key={id}
              className={`${P}-tag-btn ${isActive ? `${P}-tag-btn-active` : ''}`}
              onClick={() => selectCharacter(id)}
            >
              <SmallAvatar src={c.portrait} />
              <span>{c.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
