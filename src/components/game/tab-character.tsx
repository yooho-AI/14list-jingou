/**
 * [INPUT]: 依赖 store.ts 的 characters/currentCharacter/selectCharacter/characterStats/currentDay
 * [OUTPUT]: 对外提供 TabCharacter 组件
 * [POS]: 人物 Tab，角色立绘(9:16) + 数值条(category分组) + 关系图 + 角色列表。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion'
import { useGameStore, getAvailableCharacters, getStatLevel } from '../../lib/store'
import type { StatMeta } from '../../lib/store'

const P = 'jg'

// ── 分组标签 ──────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  relation: '🤝 关系',
  status: '📊 状态',
  skill: '⚡ 技能',
}

// ── StatBar ───────────────────────────────────────────

function StatBar({ meta, value }: { meta: StatMeta; value: number }) {
  return (
    <div className={`${P}-stat-bar`}>
      <span className={`${P}-stat-label`}>{meta.icon} {meta.label}</span>
      <div className={`${P}-stat-track`}>
        <motion.div
          className={`${P}-stat-fill`}
          style={{ backgroundColor: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className={`${P}-stat-value`} style={{ color: meta.color }}>{value}</span>
    </div>
  )
}

// ── StatGroups ────────────────────────────────────────

function StatGroups({ statMetas, stats }: {
  statMetas: StatMeta[]
  stats: Record<string, number>
}) {
  const groups = (['relation', 'status', 'skill'] as const)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      metas: statMetas.filter((m) => m.category === cat),
    }))
    .filter((g) => g.metas.length > 0)

  return (
    <div style={{ padding: '0 4px', marginBottom: 16 }}>
      {groups.map((group) => (
        <div key={group.category} className={`${P}-stat-group`}>
          <div className={`${P}-stat-group-title`}>{group.label}</div>
          {group.metas.map((meta) => (
            <StatBar key={meta.key} meta={meta} value={stats[meta.key] ?? 0} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── RelationGraph ─────────────────────────────────────

function RelationGraph() {
  const { characters, characterStats, currentDay, currentCharacter } = useGameStore()
  const available = getAvailableCharacters(currentDay, characters)

  const sorted = Object.entries(available)
    .filter(([id]) => id !== currentCharacter)
    .sort(([aId, aChar], [bId, bChar]) => {
      const aKey = aChar.statMetas[0]?.key
      const bKey = bChar.statMetas[0]?.key
      const aVal = aKey ? (characterStats[aId]?.[aKey] ?? 0) : 0
      const bVal = bKey ? (characterStats[bId]?.[bKey] ?? 0) : 0
      return bVal - aVal
    })

  if (sorted.length === 0) return null

  return (
    <div className={`${P}-relation-graph`}>
      <div className={`${P}-section-title`}>🔗 角色关系</div>
      {sorted.map(([id, char]) => {
        const stats = characterStats[id]
        return (
          <div key={id} className={`${P}-relation-card`}>
            <img
              src={char.portrait}
              alt={char.name}
              className={`${P}-relation-avatar`}
            />
            <span className={`${P}-relation-name`}>{char.name}</span>
            <div className={`${P}-relation-values`}>
              {char.statMetas
                .filter((m) => m.category === 'relation')
                .map((meta) => (
                  <span key={meta.key} style={{ color: meta.color }}>
                    {meta.icon}{stats?.[meta.key] ?? 0}
                  </span>
                ))}
              {char.statMetas
                .filter((m) => m.category !== 'relation')
                .slice(0, 1)
                .map((meta) => (
                  <span key={meta.key} style={{ color: meta.color, opacity: 0.7 }}>
                    {meta.icon}{stats?.[meta.key] ?? 0}
                  </span>
                ))}
            </div>
          </div>
        )
      })}
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

  // 选中角色的总体等级
  const levelInfo = char ? getStatLevel(
    char.statMetas.reduce((sum, m) => sum + (stats[m.key] ?? 0), 0) / Math.max(char.statMetas.length, 1)
  ) : null

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12 }} className={`${P}-scrollbar`}>
      {/* 角色立绘 */}
      {char ? (
        <div className={`${P}-portrait-hero`}>
          <img
            src={char.portrait}
            alt={char.name}
          />
          <div className={`${P}-portrait-hero-overlay`}>
            <h3>{char.name}</h3>
            <div className={`${P}-char-title`}>{char.title}</div>
            {levelInfo && (
              <span style={{
                display: 'inline-block', marginTop: 6,
                padding: '2px 10px', borderRadius: 10,
                fontSize: 11, fontWeight: 600,
                background: `${levelInfo.color}30`, color: levelInfo.color,
              }}>
                {levelInfo.name}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`${P}-placeholder`}>
          <div className={`${P}-placeholder-icon`}>👤</div>
          <p>选择一个角色开始互动</p>
        </div>
      )}

      {/* 数值条 */}
      {char && (
        <StatGroups statMetas={char.statMetas} stats={stats} />
      )}

      {/* 关系图 */}
      <RelationGraph />

      {/* 全部角色 */}
      <div className={`${P}-section-title`}>👥 全部角色</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(available).map(([id, c]) => {
          const isActive = id === currentCharacter
          const cStats = characterStats[id]
          const firstMeta = c.statMetas[0]
          const firstVal = firstMeta ? (cStats?.[firstMeta.key] ?? 0) : 0

          return (
            <div
              key={id}
              className={`${P}-char-tag ${isActive ? `${P}-char-tag-active` : ''}`}
              onClick={() => selectCharacter(id)}
            >
              <img
                src={c.portrait}
                alt={c.name}
                className={`${P}-char-avatar`}
              />
              <div className={`${P}-char-info`}>
                <h4>{c.name}</h4>
                <p>{c.title}</p>
              </div>
              {firstMeta && (
                <span className={`${P}-char-stat`} style={{ color: firstMeta.color }}>
                  {firstMeta.icon}{firstVal}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
