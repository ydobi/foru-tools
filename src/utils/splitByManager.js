// 按 A 列（销售经理）拆分工作表：保留原表，再按首次出现顺序为每位经理生成一个 sheet
const INVALID = /[\\/?*[\]:]/g

export function sanitizeSheetName(name, used) {
  let base = String(name).replace(INVALID, '_').replace(/^'+|'+$/g, '').trim() || '空白'
  base = base.slice(0, 31)
  let n = base, i = 2
  while (used.has(n.toLowerCase())) { const s = `(${i++})`; n = base.slice(0, 31 - s.length) + s }
  used.add(n.toLowerCase())
  return n
}

// 平移公式中未锁定行号的单元格引用
function shiftFormula(f, delta) {
  if (!delta) return f
  return f.replace(/("[^"]*")|(\$?[A-Z]{1,3})(\$?)(\d+)(?![\d(A-Za-z_])/g, (m, str, col, abs, row) => {
    if (str) return str
    if (abs) return m
    return col + String(Math.max(1, Number(row) + delta))
  })
}

function copyCell(src, dst, delta) {
  const v = src.value
  if (v && typeof v === 'object' && (v.formula || v.sharedFormula)) {
    const f = src.formula
    dst.value = f ? { formula: shiftFormula(f, delta) } : (v.result ?? null)
  } else {
    dst.value = v
  }
  if (src.style) dst.style = JSON.parse(JSON.stringify(src.style))
}

const cellText = (c) => {
  const v = c.value
  if (v == null) return ''
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map(t => t.text).join('')
    if ('result' in v) return String(v.result ?? '')
    if (v.text) return String(v.text)
  }
  return String(v)
}

/**
 * @param ExcelJS  exceljs 模块
 * @param wb       已加载的 Workbook
 * @param opts     { headerRows=1, keyCol=1, blankName='未填写' }
 * @returns { workbook, groups: [{name, sheetName, count}] }
 */
export function splitByManager(ExcelJS, wb, opts = {}) {
  const { headerRows = 1, keyCol = 1, blankName = '未填写' } = opts
  const src = wb.worksheets.find(w => w.state !== 'hidden' && w.actualRowCount > 0) || wb.worksheets[0]
  if (!src) throw new Error('文件中没有工作表')

  // 按首次出现顺序分组
  const groups = new Map()
  const last = src.actualRowCount ? src.rowCount : 0
  for (let r = headerRows + 1; r <= last; r++) {
    const row = src.getRow(r)
    if (!row.hasValues) continue
    const key = cellText(row.getCell(keyCol)).trim() || blankName
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }
  if (!groups.size) throw new Error('没有找到数据行')

  const used = new Set(wb.worksheets.map(w => w.name.toLowerCase()))
  const colCount = src.columnCount
  const result = []
  for (const [name, rows] of groups) {
    const sheetName = sanitizeSheetName(name, used)
    const ws = wb.addWorksheet(sheetName, {
      views: [{ state: 'frozen', xSplit: 0, ySplit: headerRows, topLeftCell: `A${headerRows + 1}` }]
    })
    for (let c = 1; c <= colCount; c++) {
      const sc = src.getColumn(c), dc = ws.getColumn(c)
      if (sc.width) dc.width = sc.width
      if (sc.hidden) dc.hidden = true
    }
    const copyRow = (sr, dr) => {
      const s = src.getRow(sr), d = ws.getRow(dr)
      if (s.height) d.height = s.height
      for (let c = 1; c <= colCount; c++) copyCell(s.getCell(c), d.getCell(c), dr - sr)
    }
    for (let h = 1; h <= headerRows; h++) copyRow(h, h)
    rows.forEach((sr, i) => copyRow(sr, headerRows + 1 + i))
    // 表头合并单元格
    for (const m of (src.model.merges || [])) {
      const mm = /^[A-Z]+(\d+):[A-Z]+(\d+)$/.exec(m)
      if (mm && Number(mm[2]) <= headerRows) { try { ws.mergeCells(m) } catch (e) { /* ignore */ } }
    }
    result.push({ name, sheetName, count: rows.length })
  }
  wb.calcProperties = { ...(wb.calcProperties || {}), fullCalcOnLoad: true }
  return { workbook: wb, groups: result }
}
