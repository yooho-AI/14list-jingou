/**
 * [INPUT]: 依赖 store.ts 的 scenes/currentScene/selectScene/unlockedScenes/characters/selectCharacter/setActiveTab/currentDay
 * [OUTPUT]: 对外提供 TabScene 组件
 * [POS]: 场景 Tab，当前场景卡(左图右文) + 相关人物(2列) + 所有地点(2列)。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useGameStore, SCENES, getAvailableCharacters } from '../../lib/store'

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

export default function TabScene() {
  const {
    currentScene, selectScene, unlockedScenes,
    characters, selectCharacter, setActiveTab,
    currentDay,
  } = useGameStore()

  const scene = SCENES[currentScene]
  const availableChars = getAvailableCharacters(currentDay, characters)
  const allScenes = Object.values(SCENES)

  const handleCharClick = (charId: string) => {
    selectCharacter(charId)
    setActiveTab('character')
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12 }} className={`${P}-scrollbar`}>

      {/* ── 当前场景 ── */}
      <div className={`${P}-section-title`}>📍 当前场景</div>
      {scene && (
        <div className={`${P}-card`} style={{ display: 'flex', gap: 14, marginBottom: 16, padding: 14 }}>
          <AssetBox src={scene.background} size={110} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{scene.icon} {scene.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
              {scene.description}
            </p>
            {scene.atmosphere && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
                🌫️ {scene.atmosphere}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 场景相关人物 ── */}
      <div className={`${P}-section-title`}>👤 场景相关人物</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(availableChars).map(([id, char]) => (
          <button
            key={id}
            className={`${P}-tag-btn`}
            onClick={() => handleCharClick(id)}
          >
            <SmallAvatar src={char.portrait} />
            <span>{char.name}</span>
          </button>
        ))}
      </div>

      {/* ── 所有地点 ── */}
      <div className={`${P}-section-title`}>🗺️ 所有地点</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {allScenes.map((s) => {
          const isActive = s.id === currentScene
          const isLocked = !unlockedScenes.includes(s.id)

          return (
            <button
              key={s.id}
              className={`${P}-tag-btn ${isActive ? `${P}-tag-btn-active` : ''}`}
              onClick={() => !isLocked && selectScene(s.id)}
              disabled={isLocked}
              style={isLocked ? { opacity: 0.35 } : undefined}
            >
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span>{s.name}{isLocked ? ' 🔒' : ''}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
