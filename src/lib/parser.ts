/**
 * [INPUT]: 无外部依赖（避免循环引用 data.ts）
 * [OUTPUT]: 对外提供 parseStoryParagraph 函数
 * [POS]: lib 的 AI 回复解析器，被 dialogue 组件消费。角色名/数值硬编码避免循环依赖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ── 角色名 → 主题色（不 import data.ts，手动同步） ──
const CHARACTER_COLORS: Record<string, string> = {
  '刘金爷': '#8B6914',
  '关胜':   '#7c3aed',
  '巧珍':   '#e11d48',
  '赵秀才': '#6366f1',
  '额尔敦': '#059669',
  '矿工群体': '#94a3b8',
  // 全名备选
  '刘德厚': '#8B6914',
  '赵文昌': '#6366f1',
}

// ── 数值标签 → 颜色（从 StatMeta 硬编码） ──
const STAT_COLORS: Record<string, string> = {
  '警觉':   '#dc2626', '警觉度': '#dc2626',
  '信任':   '#22c55e', '信任度': '#22c55e',
  '焦虑':   '#f59e0b', '焦虑度': '#f59e0b',
  '好感':   '#10b981', '好感度': '#10b981',
  '怀疑':   '#94a3b8', '怀疑度': '#94a3b8',
  // 关胜独立信任色
  '关胜信任': '#3b82f6',
  // 全局资源
  '线索':   '#fbbf24', '线索数': '#fbbf24',
}

const DEFAULT_COLOR = '#8B6914'

// ── 工具函数 ──────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseInlineContent(text: string): string {
  let result = escapeHtml(text)
  for (const [name, color] of Object.entries(CHARACTER_COLORS)) {
    result = result.replaceAll(
      name,
      `<span class="char-name" style="color:${color};font-weight:600">${name}</span>`,
    )
  }
  return result
}

function colorizeStats(line: string): string {
  return line.replace(/([^\s【】]+?)([+-]\d+)/g, (_, label: string, delta: string) => {
    const color = STAT_COLORS[label] || DEFAULT_COLOR
    const cls = delta.startsWith('+') ? 'stat-up' : 'stat-down'
    return `<span class="stat-change ${cls}" style="color:${color}">${label}${delta}</span>`
  })
}

// ── 主解析函数 ────────────────────────────────────────

export function parseStoryParagraph(content: string): { narrative: string; statHtml: string } {
  const lines = content.split('\n').filter(Boolean)
  const narrativeParts: string[] = []
  const statParts: string[] = []

  for (const raw of lines) {
    const line = raw.trim()

    // 纯数值变化行：【警觉+10 信任-5】
    if (/^【[^】]*[+-]\d+[^】]*】$/.test(line)) {
      statParts.push(colorizeStats(line))
      continue
    }

    // 角色对话：【刘金爷】你来了
    const charMatch = line.match(/^【([^】]+)】(.*)/)
    if (charMatch) {
      const [, charName, dialogue] = charMatch
      const color = CHARACTER_COLORS[charName] || DEFAULT_COLOR
      narrativeParts.push(
        `<p class="dialogue-line"><span class="char-name" style="color:${color}">【${charName}】</span>${parseInlineContent(dialogue)}</p>`,
      )
      continue
    }

    // 动作/旁白：（沉默半晌） 或 *环顾四周*
    const actionMatch = line.match(/^[（(]([^）)]+)[）)]/) || line.match(/^\*([^*]+)\*/)
    if (actionMatch) {
      narrativeParts.push(`<p class="action">${parseInlineContent(line)}</p>`)
      continue
    }

    // 普通叙述
    narrativeParts.push(`<p class="narration">${parseInlineContent(line)}</p>`)
  }

  return {
    narrative: narrativeParts.join(''),
    statHtml: statParts.length > 0
      ? `<div class="stat-changes">${statParts.join('')}</div>`
      : '',
  }
}
