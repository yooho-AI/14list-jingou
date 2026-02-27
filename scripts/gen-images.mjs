/**
 * 金沟 — 图片素材批量生成脚本
 * 调用火山方舟 SeeDream API 生成 9:16 竖版图片
 * 用法: node scripts/gen-images.mjs
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'
const ARK_API_KEY = '8821c4b7-6a64-44b9-a9d7-de1ffc36ff41'
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ARK_API_KEY}`,
}

// ── 6 角色立绘 ───────────────────────────────────────────
const CHARACTERS = [
  {
    file: 'liujinye.jpg',
    prompt: '清末东北矿区金把头，55岁威严老者，虎背熊腰络腮胡须花白，穿厚棉袍外罩貂皮马褂，手持铜烟袋锅，眼神锐利如鹰隼，背景为冰天雪地矿区，暖色调油灯映照，写实中国古装人物画风格，全身竖版构图',
  },
  {
    file: 'guansheng.jpg',
    prompt: '清末东北马匪胡子头目，40岁彪悍男子，刀疤横贯左颊，穿旧皮袄腰系红腰带，双目精光四射嘴角含讽笑，背景为雪夜松林，月光冷蓝调，写实中国古装人物画风格，全身竖版构图',
  },
  {
    file: 'qiaozhen.jpg',
    prompt: '清末东北农妇，28岁怀孕妇人，面容清瘦但眼神坚韧温柔，穿蓝花棉袄围旧围巾，双手红肿粗糙紧握搓衣板，背景为矿区棚户窝棚内景，昏暗油灯暖光，写实中国古装人物画风格，全身竖版构图',
  },
  {
    file: 'zhaoxiucai.jpg',
    prompt: '清末落第秀才，45岁消瘦文人，面色苍白眼圈发青，穿洗旧长衫戴瓜皮帽，手持毛笔案头堆满发黄账册，背景为昏暗书房烛火摇曳，写实中国古装人物画风格，全身竖版构图',
  },
  {
    file: 'eerdun.jpg',
    prompt: '清末鄂伦春族老猎人萨满，60岁古铜肤色满脸皱纹如树皮，穿兽皮袍挂骨饰项链，手持萨满鼓，背景为白桦林雪地，晨雾弥漫神秘氛围，写实少数民族人物画风格，全身竖版构图',
  },
  {
    file: 'kuanggong.jpg',
    prompt: '清末东北金矿矿工群像，五六个衣衫褴褛面目模糊的苦力，佝偻身躯背负矿筐，背景为黝黑矿洞口，火把照亮疲惫面庞，写实中国劳动人民群像画风格，全身竖版构图',
  },
]

// ── 7 场景背景 ───────────────────────────────────────────
const SCENES = [
  {
    file: 'mine.jpg',
    prompt: '清末东北漠河金矿全景，冰天雪地中大片矿坑沟壑纵横，远处低矮工棚冒着炊烟，矿工如蚂蚁般散布其间，灰蒙蒙天空飘着雪粒，苍茫萧瑟氛围，写实中国北方冬季风景画风格，竖版构图',
  },
  {
    file: 'camp.jpg',
    prompt: '清末东北矿区棚户区街景，歪歪斜斜木板房密集排列，冰柱悬挂屋檐积雪覆顶，泥泞小道上几个裹紧棉衣的身影匆匆走过，远处炊烟袅袅，傍晚昏黄调，写实中国北方冬季场景画风格，竖版构图',
  },
  {
    file: 'boss.jpg',
    prompt: '清末东北大户宅院夜景，高墙大院朱红门楣挂灯笼，院内青砖铺地假山盆景，正堂灯火辉煌透出暖光，门外站着持枪护院，富贵与压迫并存的氛围，写实中国古建筑场景画风格，竖版构图',
  },
  {
    file: 'deep.jpg',
    prompt: '清末金矿深处禁区，幽深矿洞向下延伸漆黑一片，石壁上残留火把痕迹，地面散落锈蚀铁链和碎骨，洞顶滴水形成钟乳，恐怖压抑氛围，写实矿洞场景画风格，竖版构图',
  },
  {
    file: 'forest.jpg',
    prompt: '清末东北原始森林冬季，参天红松白桦树密布银装素裹，雪地上动物脚印交错，远处雾气缥缈若隐若现，阳光从树冠间洒下金色光柱，静谧神秘氛围，写实中国北方冬季森林画风格，竖版构图',
  },
  {
    file: 'bandit.jpg',
    prompt: '清末东北土匪山寨，半山腰木栅寨门插着破旗，寨内几间木屋冒着炊烟，周围设有拒马鹿砦，远眺可见山下河谷，苍松翠柏积雪覆盖，粗犷蛮荒氛围，写实中国北方山寨场景画风格，竖版构图',
  },
  {
    file: 'study.jpg',
    prompt: '清末东北矿区破旧书房内景，木桌上堆满发黄线装书和账册，墙上挂着褪色对联和地图，角落放着煤油灯和砚台毛笔，窗外透进微弱天光，书卷气与穷困交织，写实中国古代书房内景画风格，竖版构图',
  },
]

// ── 生成 + 下载 ──────────────────────────────────────────

async function generateImage(prompt) {
  const res = await fetch(`${ARK_BASE}/images/generations`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: 'doubao-seedream-4-5-251128',
      prompt,
      response_format: 'url',
      size: '1440x2560',
      seed: -1,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('未返回图片 URL')
  return url
}

async function downloadImage(url, path) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载失败: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(path, buf)
  console.log(`  ✓ 已保存 ${path} (${(buf.length / 1024).toFixed(0)}KB)`)
}

async function processItem(item, dir) {
  const path = `${dir}/${item.file}`
  if (existsSync(path)) {
    console.log(`  ⏭ 已存在 ${path}，跳过`)
    return
  }

  console.log(`  ⏳ 生成中: ${item.file}`)
  try {
    const url = await generateImage(item.prompt)
    await downloadImage(url, path)
  } catch (e) {
    console.error(`  ✗ ${item.file} 失败: ${e.message}`)
  }
}

// ── 主流程（串行避免速率限制）─────────────────────────────

async function main() {
  const charDir = 'public/characters'
  const sceneDir = 'public/scenes'

  if (!existsSync(charDir)) await mkdir(charDir, { recursive: true })
  if (!existsSync(sceneDir)) await mkdir(sceneDir, { recursive: true })

  console.log('\n=== 生成 6 张角色立绘 ===\n')
  for (const item of CHARACTERS) {
    await processItem(item, charDir)
  }

  console.log('\n=== 生成 7 张场景背景 ===\n')
  for (const item of SCENES) {
    await processItem(item, sceneDir)
  }

  console.log('\n=== 全部完成 ===\n')
}

main().catch(console.error)
