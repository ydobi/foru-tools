// 绕口令公司：按销售经理 / TL / 大区汇总植入、授权、订货结果

export const SALES_MANAGERS = [
  '高哲', '赵恺健', '王艳辉', '董蓓', '管银宙', '王娇', '陈治中', '冯英',
  '周立新（山东）', '林潇', '李程', '李志强', '时间', '王坚', '张惠立（江西）',
  '张春婷', '杨娇娇', '陈春宇', '赵旭', '李振华', '妩涵', '张有萍', '李凤'
]

export const TLS = ['黄攀', '周立新', '陈珍玉', '何绍良', '黎霞', '冯玥', '张惠立']

export const REGIONS = ['侯磊', '宋建']

export const ORDERED_NAMES = [...SALES_MANAGERS, ...TLS, ...REGIONS]

const NAME_SOURCE_COL = Object.create(null)
for (const n of SALES_MANAGERS) NAME_SOURCE_COL[n] = '销售经理'
for (const n of TLS) NAME_SOURCE_COL[n] = 'TL'
for (const n of REGIONS) NAME_SOURCE_COL[n] = '大区'

/** 输出 sheet 规格：优先选用的输入 sheet 名、主列、缺失列、输出表头、下载 sheet 名 */
export const SHEET_SPECS = [
  {
    candidates: ['植入结果'],
    primaryCol: '植入公司',
    missACol: '授权公司',
    missBCol: '订货公司',
    outHeaders: ['销售经理', '植入公司数量', '有植入无授权公司数量', '有植入无订货公司数量'],
    outSheetName: '植入结果'
  },
  {
    candidates: ['授权结果'],
    primaryCol: '授权公司',
    missACol: '植入公司',
    missBCol: '订货公司',
    outHeaders: ['销售经理', '授权公司数量', '有授权无植入公司数量', '有授权无订货公司数量'],
    outSheetName: '授权结果'
  },
  {
    // 同时存在时优先「订货结果-剔除关户」
    candidates: ['订货结果-剔除关户', '订货结果'],
    primaryCol: '订货公司',
    missACol: '植入公司',
    missBCol: '授权公司',
    outHeaders: ['销售经理', '订货公司数量', '有订货无植入公司数量', '有订货无授权公司数量'],
    outSheetName: '订货结果-剔除关户'
  }
]

export function splitNames(val) {
  if (val == null) return []
  const s = String(val).trim()
  if (!s || s === '#N/A' || s === '-') return []
  const parts = []
  for (const chunk of s.replace(/、/g, '/').split('/')) {
    const p = chunk.trim()
    if (p && p !== '-' && p !== '#N/A') parts.push(p)
  }
  return parts
}

export function isNaValue(val) {
  if (val == null) return false
  return String(val).trim() === '#N/A'
}

function cellText(val) {
  if (val == null) return ''
  if (typeof val === 'object') {
    if (val.richText) return val.richText.map((t) => t.text).join('')
    if ('result' in val) return String(val.result ?? '')
    if (val.text != null) return String(val.text)
  }
  return String(val)
}

/**
 * 从 ExcelJS worksheet 读成 { headers, rows: [{colName: text}] }
 */
export function worksheetToRows(ws) {
  const headerRow = ws.getRow(1)
  const headers = []
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = cellText(cell.value).trim()
  })
  // fill sparse
  const maxCol = Math.max(0, ...Object.keys(headers).map(Number), ws.columnCount || 0)
  const headerList = []
  for (let c = 1; c <= maxCol; c++) {
    headerList.push(headers[c] || '')
  }
  const rows = []
  const last = ws.actualRowCount || ws.rowCount || 0
  for (let r = 2; r <= last; r++) {
    const row = ws.getRow(r)
    if (!row.hasValues) continue
    const obj = {}
    let any = false
    for (let c = 1; c <= headerList.length; c++) {
      const h = headerList[c - 1]
      if (!h) continue
      const t = cellText(row.getCell(c).value).trim()
      obj[h] = t
      if (t) any = true
    }
    if (any) rows.push(obj)
  }
  return { headers: headerList.filter(Boolean), rows }
}

/**
 * 在 workbook 的 sheet 名中按候选优先选一个
 */
export function pickSheetName(sheetNames, candidates) {
  for (const name of candidates) {
    if (sheetNames.includes(name)) return name
  }
  return null
}

/**
 * 汇总一个结果 sheet 的行数据
 * @returns {{ counts: Record<string,[number,number,number]>, national: [number,number,number] }}
 */
export function summarizeRows(rows, primaryCol, missACol, missBCol) {
  const counts = Object.create(null)
  for (const n of ORDERED_NAMES) counts[n] = [0, 0, 0]

  // 全国总数：大区列涉及侯磊或宋建的源行，去重计一次
  let national = [0, 0, 0]

  for (const row of rows) {
    const primary = (row[primaryCol] ?? '').trim()
    if (!primary) continue

    const missA = isNaValue(row[missACol])
    const missB = isNaValue(row[missBCol])

    const attributed = new Set()
    for (const col of ['销售经理', 'TL', '大区']) {
      for (const n of splitNames(row[col])) {
        if (NAME_SOURCE_COL[n] === col) attributed.add(n)
      }
    }

    for (const n of attributed) {
      counts[n][0] += 1
      if (missA) counts[n][1] += 1
      if (missB) counts[n][2] += 1
    }

    const regionNames = splitNames(row['大区'])
    const hitsNational = regionNames.some((n) => n === '侯磊' || n === '宋建')
    if (hitsNational) {
      national[0] += 1
      if (missA) national[1] += 1
      if (missB) national[2] += 1
    }
  }

  return { counts, national }
}

/**
 * 处理整个 Workbook，返回三个汇总结果
 * @param {import('exceljs').Workbook} workbook
 * @returns {{ sheets: Array<{ outSheetName, outHeaders, rows: Array<{name,c0,c1,c2}>, sourceSheet }> }}
 */
export function summarizeWorkbook(workbook) {
  const sheetNames = workbook.worksheets.map((w) => w.name)
  const results = []

  for (const spec of SHEET_SPECS) {
    const sourceName = pickSheetName(sheetNames, spec.candidates)
    if (!sourceName) {
      throw new Error(
        `缺少工作表「${spec.candidates.join('」或「')}」。当前文件有：${sheetNames.join('、') || '（无）'}`
      )
    }
    const ws = workbook.getWorksheet(sourceName)
    const { headers, rows } = worksheetToRows(ws)
    for (const need of ['销售经理', 'TL', '大区', spec.primaryCol, spec.missACol, spec.missBCol]) {
      if (!headers.includes(need)) {
        throw new Error(`工作表「${sourceName}」缺少列「${need}」。现有列：${headers.join('、')}`)
      }
    }
    const { counts, national } = summarizeRows(rows, spec.primaryCol, spec.missACol, spec.missBCol)
    const outRows = ORDERED_NAMES.map((name) => {
      const [c0, c1, c2] = counts[name]
      return { name, c0, c1, c2 }
    })
    outRows.push({ name: '全国总数', c0: national[0], c1: national[1], c2: national[2] })
    results.push({
      outSheetName: spec.outSheetName,
      outHeaders: spec.outHeaders,
      rows: outRows,
      sourceSheet: sourceName
    })
  }

  return { sheets: results }
}

/**
 * 用 ExcelJS 写出汇总结果 Workbook
 */
export function buildSummaryWorkbook(ExcelJS, summary) {
  const wb = new ExcelJS.Workbook()
  for (const sheet of summary.sheets) {
    const ws = wb.addWorksheet(sheet.outSheetName)
    ws.addRow(sheet.outHeaders)
    ws.getRow(1).font = { bold: true }
    for (const r of sheet.rows) {
      ws.addRow([r.name, r.c0, r.c1, r.c2])
    }
    ws.columns.forEach((col) => {
      let max = 10
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? '').length
        if (len + 4 > max) max = Math.min(len + 4, 40)
      })
      col.width = max
    })
  }
  return wb
}
