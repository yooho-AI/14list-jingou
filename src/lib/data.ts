/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供所有类型定义 + 常量 + 角色/场景/道具/章节/事件/结局 + 工具函数
 * [POS]: lib 的 UI 薄层数据定义，被 store.ts 和所有组件消费。叙事内容在 script.md
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ── 时段系统 ──────────────────────────────────────────
export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '黎明', icon: '🌑', hours: '04:00-07:00' },
  { index: 1, name: '上午', icon: '☀️', hours: '08:00-11:00' },
  { index: 2, name: '午歇', icon: '🍜', hours: '12:00-13:00' },
  { index: 3, name: '下午', icon: '⛅', hours: '14:00-17:00' },
  { index: 4, name: '黄昏', icon: '🌇', hours: '18:00-20:00' },
  { index: 5, name: '深夜', icon: '🌙', hours: '21:00-03:00' },
]

export const MAX_DAYS = 20
export const MAX_ACTION_POINTS = 6

// ── 消息 ──────────────────────────────────────────────
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
}

// ── 数值元数据 ────────────────────────────────────────
export interface StatMeta {
  key: string
  label: string
  color: string
  icon: string
  category?: 'relation' | 'status' | 'skill'
  autoIncrement?: number
  decayRate?: number
}

export type CharacterStats = Record<string, number>

// ── 角色 ──────────────────────────────────────────────
export interface Character {
  id: string
  name: string
  portrait: string
  gender: 'female' | 'male'
  age: number
  title: string
  description: string
  personality: string
  speakingStyle: string
  secret: string
  triggerPoints: string[]
  behaviorPatterns: string
  themeColor: string
  joinDay: number
  statMetas: StatMeta[]
  initialStats: CharacterStats
}

// ── 场景 ──────────────────────────────────────────────
export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  atmosphere: string
  tags: string[]
  unlockCondition?: {
    event?: string
    stat?: { charId: string; key: string; min: number }
  }
}

// ── 道具 ──────────────────────────────────────────────
export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'evidence' | 'memory' | 'environment' | 'hidden'
  description: string
  maxCount?: number
}

// ── 章节/事件/结局 ────────────────────────────────────
export interface Chapter {
  id: number
  name: string
  dayRange: [number, number]
  description: string
  objectives: string[]
  atmosphere: string
}

export interface ForcedEvent {
  id: string
  name: string
  triggerDay: number
  triggerPeriod?: number
  description: string
}

export interface Ending {
  id: string
  name: string
  type: 'TE' | 'HE' | 'NE' | 'BE'
  description: string
  condition: string
}

// ── 角色定义 ──────────────────────────────────────────

const LIU_JINYE: Character = {
  id: 'liujinye',
  name: '刘金爷',
  portrait: '🧓',
  gender: 'male',
  age: 55,
  title: '金把头',
  description: '老金沟实际统治者，二十年矿区生涯',
  personality: '沉稳权威，话少但每句有千钧之重',
  speakingStyle: '慢，停顿多，短句，不解释不辩护',
  secret: '全部三层真相的知情者',
  triggerPoints: ['直接质疑杀人', '未经允许进工棚'],
  behaviorPatterns: '长辈式管控，铜烟锅是思考工具',
  themeColor: '#8B6914',
  joinDay: 1,
  statMetas: [
    { key: 'alert', label: '警觉', color: '#dc2626', icon: '🔺', category: 'status' },
    { key: 'trust', label: '信任', color: '#22c55e', icon: '🤝', category: 'relation' },
  ],
  initialStats: { alert: 0, trust: 30 },
}

const GUAN_SHENG: Character = {
  id: 'guansheng',
  name: '关胜',
  portrait: '🗡️',
  gender: 'male',
  age: 40,
  title: '大柜',
  description: '胡子头目，百来号弟兄，有规矩的绺子',
  personality: '豪爽仗义，重名声如命',
  speakingStyle: '大声利落，不用形容词，东北腔+胡子切口',
  secret: '矿区眼线网络，知道每次凶手不同',
  triggerPoints: ['暗示他是凶手', '撒谎被识破'],
  behaviorPatterns: '直来直去，江湖义气至上',
  themeColor: '#7c3aed',
  joinDay: 6,
  statMetas: [
    { key: 'trust', label: '信任', color: '#3b82f6', icon: '🤝', category: 'relation' },
  ],
  initialStats: { trust: 0 },
}

const QIAO_ZHEN: Character = {
  id: 'qiaozhen',
  name: '巧珍',
  portrait: '👩',
  gender: 'female',
  age: 28,
  title: '林嫂',
  description: '矿区洗衣妇，情报网节点，林承义之妻',
  personality: '极度坚韧，为保护家人可以吞下一切真相',
  speakingStyle: '极少极简，山东口音重，提供情报时句子突然变长',
  secret: '知道孙铁匠杀了陈大哥',
  triggerPoints: ['提到陈大哥旱烟袋', '直问你瞒着我什么'],
  behaviorPatterns: '精确操控信息方向，只暴露指向刘金爷的线索',
  themeColor: '#e11d48',
  joinDay: 1,
  statMetas: [
    { key: 'anxiety', label: '焦虑', color: '#f59e0b', icon: '😰', category: 'status' },
  ],
  initialStats: { anxiety: 20 },
}

const ZHAO_XIUCAI: Character = {
  id: 'zhaoxiucai',
  name: '赵秀才',
  portrait: '📜',
  gender: 'male',
  age: 45,
  title: '落第秀才',
  description: '替刘金爷伪造采矿文书的灰色白手套',
  personality: '自保第一，圆滑怯懦',
  speakingStyle: '文绉绉带酸劲，爱用反问句，长句绕弯',
  secret: '能读懂封禁碑满文，采矿是杀头罪',
  triggerPoints: ['提封禁碑', '暗示利益关系'],
  behaviorPatterns: '绝不把自己钉在任何立场',
  themeColor: '#6366f1',
  joinDay: 1,
  statMetas: [
    { key: 'alert', label: '警觉', color: '#ef4444', icon: '🔺', category: 'status' },
  ],
  initialStats: { alert: 0 },
}

const EERDUN: Character = {
  id: 'eerdun',
  name: '额尔敦',
  portrait: '🏹',
  gender: 'male',
  age: 60,
  title: '猎人长老',
  description: '鄂伦春族萨满传承者，森林的守护者',
  personality: '超然世外，自然即信仰',
  speakingStyle: '汉语不流利，每句极有分量，全是自然意象',
  secret: '在森林里观察到矿工异常死亡',
  triggerPoints: ['对森林不敬', '否认山有主人'],
  behaviorPatterns: '不回应矿区人际纠纷',
  themeColor: '#059669',
  joinDay: 1,
  statMetas: [
    { key: 'favor', label: '好感', color: '#10b981', icon: '💚', category: 'relation' },
  ],
  initialStats: { favor: 10 },
}

const KUANG_GONG: Character = {
  id: 'kuanggong',
  name: '矿工群体',
  portrait: '⛏️',
  gender: 'male',
  age: 0,
  title: '众矿工',
  description: '两千矿工的集体意志，闲话是最快的传播媒介',
  personality: '群体盲从，恐惧驱动',
  speakingStyle: '各种口音混杂，闲话碎语',
  secret: '每个人都可能是杀人犯',
  triggerPoints: ['频繁打听失踪案'],
  behaviorPatterns: '怀疑度高时闲话传到金把头',
  themeColor: '#94a3b8',
  joinDay: 1,
  statMetas: [
    { key: 'suspicion', label: '怀疑', color: '#94a3b8', icon: '👁', category: 'status' },
  ],
  initialStats: { suspicion: 0 },
}

export function buildCharacters(): Record<string, Character> {
  return {
    liujinye: LIU_JINYE,
    guansheng: GUAN_SHENG,
    qiaozhen: QIAO_ZHEN,
    zhaoxiucai: ZHAO_XIUCAI,
    eerdun: EERDUN,
    kuanggong: KUANG_GONG,
  }
}

// ── 场景定义 ──────────────────────────────────────────

export const SCENES: Record<string, Scene> = {
  camp: {
    id: 'camp',
    name: '矿工棚户区',
    icon: '🏚️',
    description: '几十间窝棚挤在山坡，半地下地窨子',
    background: '🏚️',
    atmosphere: '孩子哭声、咸菜味、从门缝灌进来的风',
    tags: ['住所', '枢纽', '情报'],
  },
  mine: {
    id: 'mine',
    name: '老金沟矿区',
    icon: '⛏️',
    description: '冲刷出的河谷，矿工蹲在浑浊水里转淘金盆',
    background: '⛏️',
    atmosphere: '铁腥味、汗味、冻土开裂的闷响',
    tags: ['劳动', '日常', '线索'],
  },
  boss: {
    id: 'boss',
    name: '金把头大院',
    icon: '🏛️',
    description: '矿区唯一石砌建筑，院墙铺碎玻璃',
    background: '🏛️',
    atmosphere: '旱烟味，水缸水滴滴答，权力的压迫感',
    tags: ['权力', '账本', '潜入'],
  },
  deep: {
    id: 'deep',
    name: '深矿禁区',
    icon: '🕳️',
    description: '天然溶洞，封禁碑矗立中央',
    background: '🕳️',
    atmosphere: '水滴声像心跳，背后还有人在呼吸',
    tags: ['禁区', '封禁碑', '埋尸'],
    unlockCondition: { event: 'guansheng_intel' },
  },
  forest: {
    id: 'forest',
    name: '林海边缘',
    icon: '🌲',
    description: '红松落叶松白桦密到阳光只漏碎片',
    background: '🌲',
    atmosphere: '零下四十度鼻毛结冰，松脂味冷冽如巴掌',
    tags: ['自然', '额尔敦', '自由与死亡'],
  },
  bandit: {
    id: 'bandit',
    name: '胡子山寨',
    icon: '🏴',
    description: '背风山坳木屋围半圆，聚义厅永远有酒和刀',
    background: '🏴',
    atmosphere: '马嘶声、练拳呼喝、炖肉酒味',
    tags: ['江湖', '关胜', '情报'],
    unlockCondition: { event: 'guansheng_contact' },
  },
  study: {
    id: 'study',
    name: '赵秀才书房',
    icon: '📜',
    description: '矿区最文明的空间，笔墨纸砚格格不入',
    background: '📜',
    atmosphere: '墨汁味在铁腥味统治的矿区是奢侈品',
    tags: ['文书', '翻译', '秘密'],
  },
}

// ── 道具定义 ──────────────────────────────────────────

export const ITEMS: Record<string, GameItem> = {
  ledger: {
    id: 'ledger',
    name: '账本页',
    icon: '📄',
    type: 'evidence',
    description: '刘金爷善后账本的一页，左列名字日期金重',
  },
  rubbing: {
    id: 'rubbing',
    name: '拓布',
    icon: '🧾',
    type: 'evidence',
    description: '封禁碑满文拓印，清廷龙脉封禁令',
  },
  rubbing2: {
    id: 'rubbing2',
    name: '第二份拓布',
    icon: '🧾',
    type: 'evidence',
    description: '二次拓印的封禁碑满文',
  },
  shoes: {
    id: 'shoes',
    name: '靰鞡鞋',
    icon: '👢',
    type: 'evidence',
    description: '鞋口朝外左右对齐，乌拉草是新塞的',
  },
  pan: {
    id: 'pan',
    name: '淘金盆',
    icon: '🥘',
    type: 'evidence',
    description: '孙铁匠用了多年的淘金盆，磨得发亮',
  },
  carving: {
    id: 'carving',
    name: '门框刻痕',
    icon: '🔲',
    type: 'environment',
    description: '一横加一个圈——陈大哥的记号',
  },
  pipe: {
    id: 'pipe',
    name: '旱烟袋',
    icon: '🪈',
    type: 'hidden',
    description: '陈大哥的竹制旱烟袋，巧珍持有',
  },
  letter: {
    id: 'letter',
    name: '陈大哥的信',
    icon: '✉️',
    type: 'memory',
    description: '承义兄弟，这里有活路。带嫂子来。',
  },
  redCord: {
    id: 'redCord',
    name: '红绳',
    icon: '🔴',
    type: 'evidence',
    description: '陈大哥临别系在左手腕，到了关外认亲用',
  },
  stele: {
    id: 'stele',
    name: '封禁碑',
    icon: '🪨',
    type: 'environment',
    description: '半人高石碑满文密刻，清廷龙脉封禁令',
  },
}

// ── 章节 ──────────────────────────────────────────────

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: '应许之地',
    dayRange: [1, 5],
    description: '适应矿区，与孙铁匠建立搭档关系，经历失踪',
    objectives: ['熟悉矿区环境', '与孙铁匠搭伙淘金', '认识矿区各色人等'],
    atmosphere: '苦难中看到希望，然后希望被打碎',
  },
  {
    id: 2,
    name: '铁证如山',
    dayRange: [6, 15],
    description: '收集线索，形成对刘金爷的完整指控',
    objectives: ['收集至少8条线索', '打开五把锁', '小心警觉度'],
    atmosphere: '侦探式紧张，越查越确信，义愤填膺',
  },
  {
    id: 3,
    name: '深渊',
    dayRange: [16, 18],
    description: '与刘金爷对峙，第一层坍塌，第二层降临',
    objectives: ['揭示真相', '面对抉择', '承受代价'],
    atmosphere: '正义凛然→地板坍塌→灰色绝望',
  },
  {
    id: 4,
    name: '种子',
    dayRange: [19, 20],
    description: '离开金沟——告诉额尔敦、缝拓布、刻门框',
    objectives: ['做出最后的选择', '离开'],
    atmosphere: '沉默的重量',
  },
]

// ── 强制事件 ──────────────────────────────────────────

export const FORCED_EVENTS: ForcedEvent[] = [
  {
    id: 'sun_missing',
    name: '孙铁匠失踪',
    triggerDay: 5,
    triggerPeriod: 0,
    description: '铺位空了，冻粥留着，靰鞡鞋摆得整整齐齐',
  },
  {
    id: 'qiaozhen_intel',
    name: '巧珍第一条情报',
    triggerDay: 6,
    triggerPeriod: 2,
    description: '失踪者都见过金把头最后一面',
  },
  {
    id: 'shack_searched',
    name: '窝棚被翻',
    triggerDay: 0,
    description: '铺盖掀开锅碗散落，拓布失踪',
  },
  {
    id: 'liu_warning',
    name: '刘金爷正面警告',
    triggerDay: 0,
    description: '你一家老小都指着你呢',
  },
  {
    id: 'guan_death',
    name: '关胜之死',
    triggerDay: 0,
    description: '官兵围剿，除非玩家提前警告',
  },
]

// ── 结局 ──────────────────────────────────────────────

export const ENDINGS: Ending[] = [
  {
    id: 'te-bone',
    name: '骨下之骨',
    type: 'TE',
    description: '搭档杀了恩人。窝棚、矿段、来金沟的理由——全建在死人上。',
    condition: '选"告诉我"+翻账本右列看到"孙铁匠"',
  },
  {
    id: 'be-eighth',
    name: '第八个失踪者',
    type: 'BE',
    description: '深夜被击晕。刘金爷："好人在金沟活不长。"',
    condition: '线索<8 或 警觉度=100',
  },
  {
    id: 'he-righteous',
    name: '义人',
    type: 'HE',
    description: '关胜远遁。刘金爷谎言体系出现裂缝。灰暗中的一丝暖。',
    condition: '警告关胜+成功抵达+关胜存活',
  },
  {
    id: 'ne-silent',
    name: '沉默者',
    type: 'NE',
    description: '全家南下哈尔滨，沉默一路。',
    condition: '默认结局',
  },
  {
    id: 'ne-forget',
    name: '遗忘者',
    type: 'NE',
    description: '拓布在火中扭曲消失。巧珍全文唯一一句劝慰："走吧。"',
    condition: '烧掉拓布',
  },
]

// ── 故事信息 ──────────────────────────────────────────

export const STORY_INFO = {
  title: '金沟',
  subtitle: '白山黑水 · 卷一',
  description: '光绪三十二年。漠河老金沟。你的搭档失踪了。靰鞡鞋整整齐齐摆在门口。零下四十度，没有人光脚出门。',
  objective: '追查搭档失踪真相',
  era: '清光绪三十二年至宣统二年',
}

// ── 快捷操作 ──────────────────────────────────────────

export const QUICK_ACTIONS: string[] = [
  '打听消息',
  '四处观察',
  '安静等待',
  '自由行动',
]

// ── 工具函数 ──────────────────────────────────────────

export function getStatLevel(value: number) {
  if (value >= 80) return { level: 4, name: '极度危险', color: '#dc2626' }
  if (value >= 60) return { level: 3, name: '高度警惕', color: '#f59e0b' }
  if (value >= 30) return { level: 2, name: '有所察觉', color: '#3b82f6' }
  return { level: 1, name: '风平浪静', color: '#94a3b8' }
}

export function getAvailableCharacters(
  day: number,
  characters: Record<string, Character>
): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(characters).filter(([, char]) => char.joinDay <= day)
  )
}

export function getCurrentChapter(day: number): Chapter {
  return CHAPTERS.find((ch) => day >= ch.dayRange[0] && day <= ch.dayRange[1])
    ?? CHAPTERS[0]
}

export function getDayEvents(
  day: number,
  triggeredEvents: string[]
): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerDay === day && !triggeredEvents.includes(e.id)
  )
}
