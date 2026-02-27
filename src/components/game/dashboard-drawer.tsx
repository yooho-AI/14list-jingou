/**
 * [INPUT]: 依赖 store.ts 全部游戏状态, data.ts 的 SCENES/ITEMS, framer-motion (Reorder)
 * [OUTPUT]: 对外提供 DashboardDrawer 组件（林承义调查笔记本）
 * [POS]: 左侧滑入抽屉，6组件：扉页/人物轮播/舆图/目标/证据/悬案。支持拖拽排序。被 app-shell 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  useGameStore, SCENES, ITEMS,
  getCurrentChapter, getAvailableCharacters,
} from '../../lib/store'

const P = 'jg'
const ORDER_KEY = 'jg-dash-order'
const DEFAULT_ORDER = ['characters', 'scenes', 'objectives', 'evidence', 'cases']

// ── 农历日期映射（腊月十九起算，游戏第1天=腊月十九） ──

const LUNAR_DATES = [
  '', '腊月十九', '腊月二十', '腊月廿一', '腊月廿二', '腊月廿三',
  '腊月廿四', '腊月廿五', '腊月廿六', '腊月廿七', '腊月廿八',
  '腊月廿九', '腊月三十', '正月初一', '正月初二', '正月初三',
  '正月初四', '正月初五', '正月初六', '正月初七', '正月初八',
]

const SHICHEN = [
  { name: '寅卯之交', alias: '黎明' },
  { name: '巳时', alias: '上午' },
  { name: '午时', alias: '午歇' },
  { name: '未申之交', alias: '下午' },
  { name: '酉时', alias: '黄昏' },
  { name: '亥子之交', alias: '深夜' },
]

// ── 林承义手记 ──

const CHAR_NOTES: Record<string, string> = {
  liujinye: '眼神像鹰隼，铜烟锅从不离手。',
  guansheng: '刀疤横脸，笑起来反而让人怕。',
  qiaozhen: '她知道什么，但不肯说。',
  zhaoxiucai: '满嘴之乎者也，眼珠子一直转。',
  eerdun: '汉话说不利索，可每句都有分量。',
  kuanggong: '两千双眼睛，没一双敢抬起来。',
}

// ── 舆图场景坐标（百分比，相对于地图容器） ──

const SCENE_POS: Record<string, { x: number; y: number }> = {
  forest: { x: 8, y: 12 },
  mine:   { x: 42, y: 6 },
  boss:   { x: 76, y: 16 },
  bandit: { x: 6, y: 58 },
  camp:   { x: 40, y: 46 },
  study:  { x: 76, y: 58 },
  deep:   { x: 40, y: 86 },
}

const SCENE_LINKS: [string, string][] = [
  ['camp', 'mine'],
  ['camp', 'boss'],
  ['camp', 'forest'],
  ['camp', 'study'],
  ['mine', 'deep'],
  ['forest', 'bandit'],
  ['boss', 'study'],
]

// ── 笔记本扉页 ───────────────────────────────────────

function FrontPage() {
  const { currentDay, currentPeriodIndex, actionPoints } = useGameStore()
  const chapter = getCurrentChapter(currentDay)
  const lunar = LUNAR_DATES[currentDay] ?? `第${currentDay}天`
  const shichen = SHICHEN[currentPeriodIndex] ?? SHICHEN[0]

  return (
    <div className={`${P}-dash-front`}>
      <div className={`${P}-dash-front-date`}>{lunar}</div>
      <div className={`${P}-dash-front-shichen`}>
        <span className={`${P}-dash-front-line`} />
        <span>{shichen.name}</span>
        <span className={`${P}-dash-front-alias`}>（{shichen.alias}）</span>
        <span className={`${P}-dash-front-line`} />
      </div>
      <div className={`${P}-dash-front-chapter`}>
        第{chapter.id}幕「{chapter.name}」
      </div>
      <div className={`${P}-dash-front-day`}>
        到金沟第 {currentDay} 天
      </div>
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
      <div className={`${P}-dash-front-stain`} />
    </div>
  )
}

// ── 人物轮播（老照片翻阅） ───────────────────────────

const SLIDE_VARIANTS = {
  enter: (d: number) => ({ x: d > 0 ? 260 : -260, opacity: 0, rotate: d > 0 ? 6 : -6 }),
  center: { x: 0, opacity: 1, rotate: -1.5 },
  exit: (d: number) => ({ x: d < 0 ? 260 : -260, opacity: 0, rotate: d < 0 ? 6 : -6 }),
}

function CharacterGallery({ onClose }: { onClose: () => void }) {
  const {
    characters, characterStats, currentCharacter, currentDay,
    selectCharacter,
  } = useGameStore()

  const available = getAvailableCharacters(currentDay, characters)
  const charEntries = Object.entries(characters)

  const [[idx, direction], setPage] = useState<[number, number]>(() => {
    const i = charEntries.findIndex(([id]) => id === currentCharacter)
    return [i >= 0 ? i : 0, 0]
  })

  /* ── 触摸滑动 ── */
  const touchX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx < -50 && idx < charEntries.length - 1) setPage([idx + 1, 1])
    else if (dx > 50 && idx > 0) setPage([idx - 1, -1])
  }

  const handleClick = (charId: string) => {
    if (charId in available) { selectCharacter(charId); onClose() }
  }

  const [id, char] = charEntries[idx]
  const isAvailable = id in available
  const isActive = id === currentCharacter
  const stats = characterStats[id] ?? {}

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>人物</div>

      {/* 轮播区 */}
      <div className={`${P}-dash-carousel`}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={idx}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: 'easeInOut' }}
            className={`${P}-dash-photo ${isActive ? `${P}-dash-photo-active` : ''}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => handleClick(id)}
            style={{ cursor: isAvailable ? 'pointer' : 'default' }}
          >
            {/* 照片白边框 */}
            <div className={`${P}-dash-photo-frame`}>
              {isAvailable ? (
                <>
                  <div className={`${P}-dash-photo-img`}>
                    {char.portrait.startsWith('/') ? (
                      <img src={char.portrait} alt={char.name} />
                    ) : (
                      <span className={`${P}-dash-photo-emoji`}>{char.portrait}</span>
                    )}
                    <div className={`${P}-dash-photo-vignette`} />
                    <div className={`${P}-dash-photo-nameplate`}>
                      <div className={`${P}-dash-photo-name`}>{char.name}</div>
                      <div className={`${P}-dash-photo-title`}>{char.title}</div>
                    </div>
                  </div>
                  {isActive && <div className={`${P}-dash-photo-seal`}>查</div>}
                </>
              ) : (
                <div className={`${P}-dash-photo-locked`}>
                  <span className={`${P}-dash-photo-question`}>？</span>
                  <span className={`${P}-dash-photo-locked-text`}>此人尚未照面</span>
                </div>
              )}
            </div>

            {/* 批注区 */}
            {isAvailable && (
              <div className={`${P}-dash-photo-note`}>
                「{CHAR_NOTES[id] ?? ''}」
              </div>
            )}

            {/* 数值条 */}
            {isAvailable && char.statMetas.slice(0, 2).map((meta) => {
              const val = stats[meta.key] ?? 0
              return (
                <div key={meta.key} className={`${P}-dash-photo-stat`}>
                  <span className={`${P}-dash-photo-stat-icon`}>{meta.icon}</span>
                  <div className={`${P}-dash-photo-stat-track`}>
                    <div
                      className={`${P}-dash-photo-stat-fill`}
                      style={{ width: `${val}%`, background: meta.color }}
                    />
                  </div>
                  <span className={`${P}-dash-photo-stat-label`}>{meta.label}</span>
                  <span className={`${P}-dash-photo-stat-val`} style={{ color: meta.color }}>
                    {val}
                  </span>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 分页圆点 */}
      <div className={`${P}-dash-dots`}>
        {charEntries.map(([cid], i) => (
          <button
            key={cid}
            className={`${P}-dash-dot ${i === idx ? `${P}-dash-dot-active` : ''}`}
            onClick={() => setPage([i, i > idx ? 1 : -1])}
          />
        ))}
      </div>
    </div>
  )
}

// ── 舆图（手绘地图） ─────────────────────────────────

function SceneMap({ onClose }: { onClose: () => void }) {
  const { currentScene, unlockedScenes, selectScene } = useGameStore()

  const handleClick = (sid: string) => {
    if (unlockedScenes.includes(sid) && sid !== currentScene) {
      selectScene(sid); onClose()
    }
  }

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>舆图</div>

      <div className={`${P}-dash-map`}>
        {/* 连接线 SVG */}
        <svg className={`${P}-dash-map-svg`} viewBox="0 0 100 100" preserveAspectRatio="none">
          {SCENE_LINKS.map(([a, b]) => {
            const pa = SCENE_POS[a], pb = SCENE_POS[b]
            if (!pa || !pb) return null
            const ok = unlockedScenes.includes(a) && unlockedScenes.includes(b)
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x + 7} y1={pa.y + 5}
                x2={pb.x + 7} y2={pb.y + 5}
                stroke={ok ? 'rgba(139,105,20,0.4)' : 'rgba(139,105,20,0.12)'}
                strokeWidth="0.6"
                strokeDasharray={ok ? '2 1.5' : '1 2'}
              />
            )
          })}
        </svg>

        {/* 场景节点 */}
        {Object.values(SCENES).map((s) => {
          const pos = SCENE_POS[s.id]
          if (!pos) return null
          const isCurrent = s.id === currentScene
          const isLocked = !unlockedScenes.includes(s.id)

          return (
            <button
              key={s.id}
              className={[
                `${P}-dash-map-node`,
                isCurrent && `${P}-dash-map-node-cur`,
                isLocked && `${P}-dash-map-node-lock`,
              ].filter(Boolean).join(' ')}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleClick(s.id)}
              disabled={isLocked}
            >
              <span className={`${P}-dash-map-icon`}>{isLocked ? '?' : s.icon}</span>
              <span className={`${P}-dash-map-name`}>{isLocked ? '未知' : s.name}</span>
              {isCurrent && <span className={`${P}-dash-map-ping`} />}
            </button>
          )
        })}

        {/* 装饰文字 */}
        <span className={`${P}-dash-map-deco`} style={{ left: '25%', top: '28%' }}>〰</span>
        <span className={`${P}-dash-map-deco`} style={{ left: '62%', top: '38%' }}>山</span>
        <span className={`${P}-dash-map-deco`} style={{ right: '5%', top: '42%' }}>路</span>
      </div>
    </div>
  )
}

// ── 章节目标 ──────────────────────────────────────────

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

      <div className={`${P}-dash-clue-track`}>
        <span className={`${P}-dash-clue-label`}>线索</span>
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

// ── 证据板 ────────────────────────────────────────────

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

// ── 悬案板 ────────────────────────────────────────────

function CaseBoard() {
  const { currentDay, triggeredEvents } = useGameStore()

  const cases = [
    {
      name: '陈大哥', status: '失踪',
      detail: '靰鞡鞋整齐摆在门口。灶台的灰是冷的。',
      visible: true,
    },
    {
      name: '孙铁匠', status: '第5天失踪',
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
        {visibleCases.length > 1 && (
          <svg className={`${P}-dash-case-line`} viewBox="0 0 100 10" preserveAspectRatio="none">
            <line x1="10" y1="5" x2="90" y2="5" stroke="#8b2500" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        )}
      </div>
      <div className={`${P}-dash-case-note`}>到底是谁？</div>
    </div>
  )
}

// ── 可拖拽 Section 包装 ──────────────────────────────

function DashSection({ id, children }: { id: string; children: React.ReactNode }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls}>
      <div className={`${P}-dash-reorder`}>
        <div
          className={`${P}-dash-grip`}
          onPointerDown={(e) => controls.start(e)}
        >
          ⋮⋮
        </div>
        {children}
      </div>
    </Reorder.Item>
  )
}

// ── DashboardDrawer 主体 ──────────────────────────────

export default function DashboardDrawer({ onClose }: { onClose: () => void }) {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(ORDER_KEY)
      if (s) {
        const arr = JSON.parse(s) as string[]
        if (DEFAULT_ORDER.every((k) => arr.includes(k))) return arr
      }
    } catch { /* noop */ }
    return [...DEFAULT_ORDER]
  })

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order))
  }, [order])

  const renderSection = (key: string) => {
    switch (key) {
      case 'characters': return <CharacterGallery onClose={onClose} />
      case 'scenes':     return <SceneMap onClose={onClose} />
      case 'objectives': return <Objectives />
      case 'evidence':   return <EvidenceBoard />
      case 'cases':      return <CaseBoard />
      default:           return null
    }
  }

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
        {/* 封面标题 */}
        <div className={`${P}-dash-header`}>
          <div className={`${P}-dash-title`}>调查笔记</div>
          <div className={`${P}-dash-subtitle`}>林承义 · 私人</div>
          <button className={`${P}-dash-close`} onClick={onClose}>✕</button>
        </div>

        {/* 滚动区 */}
        <div className={`${P}-dash-scroll ${P}-scrollbar`}>
          <FrontPage />
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {order.map((key) => (
              <DashSection key={key} id={key}>
                {renderSection(key)}
              </DashSection>
            ))}
          </Reorder.Group>
        </div>
      </motion.div>
    </motion.div>
  )
}
