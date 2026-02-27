/**
 * [INPUT]: 依赖 store.ts 全部游戏状态, data.ts 的 SCENES/ITEMS/CHAPTERS, framer-motion
 * [OUTPUT]: 对外提供 DashboardDrawer 组件（林承义调查笔记本）
 * [POS]: 左侧滑入抽屉，6组件：时间标签/角色画廊/场景地图/章节目标/证据板/悬案板。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion'
import {
  useGameStore, SCENES, ITEMS,
  getCurrentChapter, getAvailableCharacters,
} from '../../lib/store'

const P = 'jg'

// ── 农历日期映射（腊月十九起算，游戏第1天=腊月十九） ──

const LUNAR_DATES = [
  '', '腊月十九', '腊月二十', '腊月廿一', '腊月廿二', '腊月廿三',
  '腊月廿四', '腊月廿五', '腊月廿六', '腊月廿七', '腊月廿八',
  '腊月廿九', '腊月三十', '正月初一', '正月初二', '正月初三',
  '正月初四', '正月初五', '正月初六', '正月初七', '正月初八',
]

// 时辰映射（对应 PERIODS 的 6 个时段）
const SHICHEN = [
  { name: '寅卯之交', alias: '黎明' },   // 04:00-07:00
  { name: '巳时', alias: '上午' },        // 08:00-11:00
  { name: '午时', alias: '午歇' },        // 12:00-13:00
  { name: '未申之交', alias: '下午' },    // 14:00-17:00
  { name: '酉时', alias: '黄昏' },        // 18:00-20:00
  { name: '亥子之交', alias: '深夜' },    // 21:00-03:00
]

// ── 笔记本扉页 ───────────────────────────────────────

function FrontPage() {
  const { currentDay, currentPeriodIndex, actionPoints } = useGameStore()
  const chapter = getCurrentChapter(currentDay)
  const lunar = LUNAR_DATES[currentDay] ?? `第${currentDay}天`
  const shichen = SHICHEN[currentPeriodIndex] ?? SHICHEN[0]

  return (
    <div className={`${P}-dash-front`}>
      {/* 农历大字 */}
      <div className={`${P}-dash-front-date`}>{lunar}</div>

      {/* 时辰 */}
      <div className={`${P}-dash-front-shichen`}>
        <span className={`${P}-dash-front-line`} />
        <span>{shichen.name}</span>
        <span className={`${P}-dash-front-alias`}>（{shichen.alias}）</span>
        <span className={`${P}-dash-front-line`} />
      </div>

      {/* 章节 */}
      <div className={`${P}-dash-front-chapter`}>
        第{chapter.id}幕「{chapter.name}」
      </div>
      <div className={`${P}-dash-front-day`}>
        到金沟第 {currentDay} 天
      </div>

      {/* 行动点墨条 */}
      <div className={`${P}-dash-front-ap`}>
        <div className={`${P}-dash-front-bars`}>
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className={`${P}-dash-bar ${i < actionPoints ? `${P}-dash-bar-filled` : ''}`}
            />
          ))}
        </div>
        <span className={`${P}-dash-front-ap-text`}>
          余力{['零', '一', '二', '三', '四', '五', '六'][actionPoints]}分
        </span>
      </div>

      {/* 水渍分隔 */}
      <div className={`${P}-dash-front-stain`} />
    </div>
  )
}

// ── 林承义的第一印象手记 ──────────────────────────────

const CHAR_NOTES: Record<string, string> = {
  liujinye: '眼神像鹰隼，铜烟锅从不离手。',
  guansheng: '刀疤横脸，笑起来反而让人怕。',
  qiaozhen: '她知道什么，但不肯说。',
  zhaoxiucai: '满嘴之乎者也，眼珠子一直转。',
  eerdun: '汉话说不利索，可每句都有分量。',
  kuanggong: '两千双眼睛，没一双敢抬起来。',
}

function CharacterGallery({ onClose }: { onClose: () => void }) {
  const {
    characters, characterStats, currentCharacter, currentDay,
    selectCharacter,
  } = useGameStore()

  const available = getAvailableCharacters(currentDay, characters)

  const handleClick = (charId: string) => {
    selectCharacter(charId)
    onClose()
  }

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>人物</div>
      <div className={`${P}-dash-char-grid`}>
        {Object.entries(characters).map(([id, char]) => {
          const isAvailable = id in available
          const isActive = id === currentCharacter
          const stats = characterStats[id] ?? {}

          return (
            <button
              key={id}
              className={`${P}-dash-card ${isActive ? `${P}-dash-card-active` : ''} ${!isAvailable ? `${P}-dash-card-locked` : ''}`}
              onClick={() => isAvailable && handleClick(id)}
              disabled={!isAvailable}
            >
              {/* 选中朱砂竖条 */}
              {isActive && <div className={`${P}-dash-card-seal`} />}

              {/* 照片区 */}
              <div className={`${P}-dash-card-portrait`}>
                {char.portrait.startsWith('/') ? (
                  <img src={char.portrait} alt={char.name} />
                ) : (
                  <span className={`${P}-dash-card-emoji`}>{char.portrait}</span>
                )}
                {/* 暗角做旧 */}
                <div className={`${P}-dash-card-vignette`} />
                {/* 渐变遮罩+名字叠加 */}
                <div className={`${P}-dash-card-nameplate`}>
                  <div className={`${P}-dash-card-name`}>
                    {isAvailable ? char.name : '？？？'}
                  </div>
                  {isAvailable && (
                    <div className={`${P}-dash-card-title`}>{char.title}</div>
                  )}
                </div>
                {/* 锁定 */}
                {!isAvailable && (
                  <div className={`${P}-dash-card-lockscreen`}>
                    <span className={`${P}-dash-card-question`}>？</span>
                  </div>
                )}
              </div>

              {/* 手写批注 + 数值 */}
              {isAvailable && (
                <div className={`${P}-dash-card-body`}>
                  {/* 林承义的手记 */}
                  <div className={`${P}-dash-card-note`}>
                    "{CHAR_NOTES[id] ?? ''}"
                  </div>

                  {/* 数值竖条 */}
                  {char.statMetas.slice(0, 2).map((meta) => {
                    const val = stats[meta.key] ?? 0
                    return (
                      <div key={meta.key} className={`${P}-dash-card-stat`}>
                        <span className={`${P}-dash-card-stat-icon`}>{meta.icon}</span>
                        <div className={`${P}-dash-card-stat-track`}>
                          <div
                            className={`${P}-dash-card-stat-fill`}
                            style={{ width: `${val}%`, background: meta.color }}
                          />
                        </div>
                        <span className={`${P}-dash-card-stat-label`}>{meta.label}</span>
                        <span className={`${P}-dash-card-stat-val`} style={{ color: meta.color }}>
                          {val}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 场景地图（手绘地图感） ────────────────────────────

function SceneMap({ onClose }: { onClose: () => void }) {
  const { currentScene, unlockedScenes, selectScene } = useGameStore()
  const scene = SCENES[currentScene]

  const handleSceneClick = (sceneId: string) => {
    if (unlockedScenes.includes(sceneId) && sceneId !== currentScene) {
      selectScene(sceneId)
      onClose()
    }
  }

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>地图</div>

      {/* 当前场景大图 */}
      {scene && (
        <div className={`${P}-dash-scene-hero`}>
          {scene.background.startsWith('/') ? (
            <img src={scene.background} alt={scene.name} className={`${P}-dash-scene-img`} />
          ) : (
            <div className={`${P}-dash-scene-emoji`}>{scene.background}</div>
          )}
          <div className={`${P}-dash-scene-overlay`}>
            <div className={`${P}-dash-scene-name`}>{scene.icon} {scene.name}</div>
            <div className={`${P}-dash-scene-atmo`}>{scene.atmosphere}</div>
          </div>
        </div>
      )}

      {/* 场景网格 */}
      <div className={`${P}-dash-scene-grid`}>
        {Object.values(SCENES).map((s) => {
          const isActive = s.id === currentScene
          const isLocked = !unlockedScenes.includes(s.id)

          return (
            <button
              key={s.id}
              className={`${P}-dash-scene-tag ${isActive ? `${P}-dash-scene-tag-active` : ''} ${isLocked ? `${P}-dash-scene-tag-locked` : ''}`}
              onClick={() => handleSceneClick(s.id)}
              disabled={isLocked}
            >
              <span>{isLocked ? '?' : s.icon}</span>
              <span>{isLocked ? '未知' : s.name}</span>
              {isActive && <span className={`${P}-dash-scene-dot`}>●</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 章节目标（手写清单） ──────────────────────────────

function Objectives() {
  const { currentDay, cluesFound } = useGameStore()
  const chapter = getCurrentChapter(currentDay)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>调查目标</div>
      <div className={`${P}-dash-chapter-badge`}>
        第{chapter.id}幕「{chapter.name}」
      </div>
      <ul className={`${P}-dash-objectives`}>
        {chapter.objectives.map((obj, i) => (
          <li key={i} className={`${P}-dash-obj-item`}>
            <span className={`${P}-dash-obj-circle`} />
            <span>{obj}</span>
          </li>
        ))}
      </ul>

      {/* 线索进度（12个圆） */}
      <div className={`${P}-dash-clue-track`}>
        <span className={`${P}-dash-clue-label`}>🔍 线索</span>
        <div className={`${P}-dash-clue-dots`}>
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className={`${P}-dash-clue-dot ${i < cluesFound ? `${P}-dash-clue-found` : ''}`}
            />
          ))}
        </div>
        <span className={`${P}-dash-clue-count`}>{cluesFound}/12</span>
      </div>
    </div>
  )
}

// ── 证据板（夹在笔记本的纸片） ──────────────────────

function EvidenceBoard() {
  const { inventory } = useGameStore()
  const collected = Object.entries(inventory).filter(([, n]) => n > 0)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>证据</div>
      {collected.length === 0 ? (
        <div className={`${P}-dash-empty`}>暂未发现线索</div>
      ) : (
        <div className={`${P}-dash-evidence-grid`}>
          {collected.map(([id]) => {
            const item = ITEMS[id]
            if (!item) return null
            return (
              <div key={id} className={`${P}-dash-evidence-card`}>
                <div className={`${P}-dash-evidence-icon`}>{item.icon}</div>
                <div className={`${P}-dash-evidence-info`}>
                  <div className={`${P}-dash-evidence-name`}>{item.name}</div>
                  <div className={`${P}-dash-evidence-desc`}>{item.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 悬案板（失踪者红线） ──────────────────────────────

function CaseBoard() {
  const { currentDay, triggeredEvents } = useGameStore()

  const cases = [
    {
      name: '陈大哥',
      status: '失踪',
      detail: '靰鞡鞋整齐摆在门口。灶台的灰是冷的。',
      visible: true,
    },
    {
      name: '孙铁匠',
      status: '第5天失踪',
      detail: '铺位空了，冻粥留着。',
      visible: currentDay >= 5 || triggeredEvents.includes('sun_missing'),
    },
  ]

  const visibleCases = cases.filter((c) => c.visible)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>悬案</div>
      <div className={`${P}-dash-case-board`}>
        {visibleCases.map((c, i) => (
          <div key={i} className={`${P}-dash-case-card`}>
            <div className={`${P}-dash-case-name`}>{c.name}</div>
            <div className={`${P}-dash-case-status`}>{c.status}</div>
            <div className={`${P}-dash-case-detail`}>{c.detail}</div>
          </div>
        ))}

        {/* 红线连接 */}
        {visibleCases.length > 1 && (
          <svg className={`${P}-dash-case-line`} viewBox="0 0 100 10" preserveAspectRatio="none">
            <line x1="10" y1="5" x2="90" y2="5" stroke="#8b2500" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        )}
      </div>

      <div className={`${P}-dash-case-note`}>
        到底是谁？
      </div>
    </div>
  )
}

// ── DashboardDrawer 主体 ──────────────────────────────

export default function DashboardDrawer({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className={`${P}-dash-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-dash-drawer`}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 笔记本封面标题 */}
        <div className={`${P}-dash-header`}>
          <div className={`${P}-dash-title`}>调查笔记</div>
          <div className={`${P}-dash-subtitle`}>林承义 · 私人</div>
          <button className={`${P}-dash-close`} onClick={onClose}>✕</button>
        </div>

        {/* 内容滚动区 */}
        <div className={`${P}-dash-scroll ${P}-scrollbar`}>
          <FrontPage />
          <CharacterGallery onClose={onClose} />
          <SceneMap onClose={onClose} />
          <Objectives />
          <EvidenceBoard />
          <CaseBoard />
        </div>
      </motion.div>
    </motion.div>
  )
}
