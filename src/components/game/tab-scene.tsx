/**
 * [INPUT]: 依赖 store.ts 的 scenes/currentScene/selectScene/unlockedScenes/characters/selectCharacter/setActiveTab/currentDay
 * [OUTPUT]: 对外提供 TabScene 组件
 * [POS]: 场景 Tab，场景大图(9:16) + 相关人物 + 地点列表。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useGameStore, SCENES, getAvailableCharacters } from '../../lib/store'

const P = 'jg'

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
      {/* 场景大图 */}
      {scene && (
        <div className={`${P}-scene-hero`}>
          <img
            src={scene.background}
            alt={scene.name}
          />
          <div className={`${P}-scene-hero-overlay`}>
            <h3>{scene.icon} {scene.name}</h3>
            <p>{scene.description}</p>
          </div>
        </div>
      )}

      {/* 氛围描述 */}
      {scene?.atmosphere && (
        <p className={`${P}-scene-desc`}>
          🌫️ {scene.atmosphere}
        </p>
      )}

      {/* 相关人物 */}
      <div className={`${P}-section-title`}>👤 相关人物</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {Object.entries(availableChars).map(([id, char]) => (
          <div
            key={id}
            className={`${P}-char-tag`}
            style={{ flex: '0 0 auto' }}
            onClick={() => handleCharClick(id)}
          >
            <img
              src={char.portrait}
              alt={char.name}
              className={`${P}-char-avatar`}
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
            <span style={{ fontSize: 13 }}>{char.name}</span>
          </div>
        ))}
      </div>

      {/* 探索地点 */}
      <div className={`${P}-section-title`}>🗺️ 探索地点</div>
      {allScenes.map((s) => {
        const isActive = s.id === currentScene
        const isLocked = !unlockedScenes.includes(s.id)

        return (
          <div
            key={s.id}
            className={`${P}-location-tag ${isActive ? `${P}-location-tag-active` : ''} ${isLocked ? `${P}-location-tag-locked` : ''}`}
            onClick={() => !isLocked && selectScene(s.id)}
          >
            <span className={`${P}-location-icon`}>{s.icon}</span>
            <div className={`${P}-location-info`}>
              <h4>{s.name}{isLocked ? ' 🔒' : ''}</h4>
              <p>{s.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
