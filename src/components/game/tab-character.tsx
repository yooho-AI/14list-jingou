/**
 * [INPUT]: 依赖 store.ts 的 characters/currentCharacter/selectCharacter/characterStats/currentDay
 * [OUTPUT]: 对外提供 TabCharacter 组件
 * [POS]: 人物 Tab，当前人物卡(左绘右值) + 关系图 + 全部人物(2列)。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion'
import { useGameStore, getAvailableCharacters } from '../../lib/store'
import type { StatMeta } from '../../lib/store'

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

            {/* 数值条 */}
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

      {/* ── 人物关系 ── */}
      <div className={`${P}-section-title`}>🔗 人物关系</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {Object.entries(available).map(([id, c]) => {
          const cStats = characterStats[id]
          return (
            <div
              key={id}
              className={`${P}-relation-card`}
              style={{ cursor: 'pointer' }}
              onClick={() => selectCharacter(id)}
            >
              <SmallAvatar src={c.portrait} size={36} />
              <span className={`${P}-relation-name`}>{c.name}</span>
              <div className={`${P}-relation-values`}>
                {c.statMetas.map((meta) => (
                  <span key={meta.key} style={{ color: meta.color }}>
                    {meta.icon}{cStats?.[meta.key] ?? 0}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
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
