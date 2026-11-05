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

function cloneVal(v) {
  if (v == null || typeof v !== 'object') return v
  if (typeof structuredClone === 'function') return structuredClone(v)
  return JSON.parse(JSON.stringify(v))
}

function colName(n) {
  let s = ''
  let x = n
  while (x > 0) {
    const m = (x - 1) % 26
    s = String.fromCharCode(65 + m) + s
    x = Math.floor((x - 1) / 26)
  }
  return s
}

function colNum(s) {
  let n = 0
  for (const ch of String(s).toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}

function looksLikeCellRef(n) {
  return /^[A-Z]{1,3}\d+$/i.test(n) || /^[RC]$/i.test(n) || /^R\d+C\d+$/i.test(n)
}

export function sanitizeTableName(name, used) {
  let base = String(name || 'Table').replace(/[^\p{L}\p{N}_]/gu, '_')
  base = base.replace(/_+/g, '_').replace(/^_|_$/g, '')
  if (!base || !/^[\p{L}_]/u.test(base) || looksLikeCellRef(base)) base = `T_${base || 'Table'}`
  base = base.slice(0, 200)
  let n = base
  let i = 2
  while (used.has(n.toLowerCase())) {
    const s = `_${i++}`
    n = base.slice(0, 255 - s.length) + s
  }
  used.add(n.toLowerCase())
  return n
}

function parseSqrefPart(part) {
  const p = String(part || '').replace(/\$/g, '').trim()
  if (!p) return null
  let m = /^([A-Z]+):([A-Z]+)$/i.exec(p)
  if (m) {
    const left = colNum(m[1])
    const right = colNum(m[2])
    return { top: 1, bottom: Number.POSITIVE_INFINITY, left: Math.min(left, right), right: Math.max(left, right), wholeCol: true }
  }
  m = /^(\d+):(\d+)$/.exec(p)
  if (m) {
    const top = Number(m[1])
    const bottom = Number(m[2])
    return { top: Math.min(top, bottom), bottom: Math.max(top, bottom), left: 1, right: Number.POSITIVE_INFINITY, wholeRow: true }
  }
  m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i.exec(p)
  if (!m) return null
  const left = colNum(m[1])
  const top = Number(m[2])
  const right = m[3] ? colNum(m[3]) : left
  const bottom = m[4] ? Number(m[4]) : top
  return {
    top: Math.min(top, bottom),
    bottom: Math.max(top, bottom),
    left: Math.min(left, right),
    right: Math.max(left, right),
  }
}

function encodeRange(r) {
  if (r.wholeCol) return `${colName(r.left)}:${colName(r.right)}`
  if (r.wholeRow) return `${r.top}:${r.bottom}`
  const a = `${colName(r.left)}${r.top}`
  if (r.left === r.right && r.top === r.bottom) return a
  return `${a}:${colName(r.right)}${r.bottom}`
}

function compressRows(rows) {
  if (!rows.length) return []
  const sorted = [...new Set(rows)].sort((a, b) => a - b)
  const runs = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i]
    if (cur === prev + 1) {
      prev = cur
      continue
    }
    runs.push([start, prev])
    start = prev = cur
  }
  return runs
}

function remapRange(range, srcToDst) {
  if (range.wholeCol) {
    return [{ ...range }]
  }
  const destRows = []
  if (range.bottom === Number.POSITIVE_INFINITY) {
    for (const [sr, dr] of srcToDst) {
      if (sr >= range.top) destRows.push(dr)
    }
  } else {
    for (let r = range.top; r <= range.bottom; r++) {
      if (srcToDst.has(r)) destRows.push(srcToDst.get(r))
    }
  }
  if (!destRows.length) return []
  const left = range.left === Number.POSITIVE_INFINITY ? 1 : range.left
  const right = range.right === Number.POSITIVE_INFINITY ? 1 : range.right
  return compressRows(destRows).map(([top, bottom]) => ({
    top,
    bottom,
    left,
    right,
    wholeRow: range.wholeRow,
  }))
}

function remapSqref(ref, srcToDst) {
  if (!ref) return ''
  const parts = String(ref).split(/\s+/).filter(Boolean)
  const out = []
  for (const part of parts) {
    const range = parseSqrefPart(part.includes('!') ? part.split('!').pop() : part)
    if (!range) continue
    for (const mapped of remapRange(range, srcToDst)) out.push(encodeRange(mapped))
  }
  return out.join(' ')
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

function remapFormula(f, srcToDst) {
  if (!f || typeof f !== 'string') return f
  return f.replace(/("[^"]*")|(\$?[A-Z]{1,3})(\$?)(\d+)(?![\d(A-Za-z_])/g, (m, str, col, abs, row) => {
    if (str) return str
    if (abs) return m
    const dst = srcToDst.get(Number(row))
    return dst == null ? m : col + String(dst)
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

function listTableModels(ws) {
  const raw = typeof ws.getTables === 'function'
    ? ws.getTables()
    : Object.values(ws.tables || {})
  const arr = Array.isArray(raw) ? raw : []
  return arr.map((item) => {
    const t = Array.isArray(item) ? item[0] : item
    if (!t) return null
    return t.model || t
  }).filter((m) => m && (m.tableRef || m.ref) && Array.isArray(m.columns) && m.columns.length)
}

function collectTableNames(wb) {
  const used = new Set()
  for (const ws of wb.worksheets) {
    for (const m of listTableModels(ws)) {
      if (m.name) used.add(String(m.name).toLowerCase())
      if (m.displayName) used.add(String(m.displayName).toLowerCase())
    }
  }
  return used
}

function snapshotRect(ws, top, left, bottom, right) {
  const rows = []
  for (let r = top; r <= bottom; r++) {
    const row = ws.getRow(r)
    const cells = []
    for (let c = left; c <= right; c++) {
      const cell = row.getCell(c)
      cells.push({
        value: cloneVal(cell.value),
        style: cell.style ? cloneVal(cell.style) : undefined,
      })
    }
    rows.push({ height: row.height, cells })
  }
  return rows
}

function restoreRect(ws, top, left, snap) {
  snap.forEach((rowSnap, i) => {
    const row = ws.getRow(top + i)
    if (rowSnap.height) row.height = rowSnap.height
    rowSnap.cells.forEach((cs, j) => {
      const cell = row.getCell(left + j)
      cell.value = cs.value
      if (cs.style) cell.style = cs.style
    })
  })
}

function uniqueColumnName(name, used) {
  let base = String(name || '').trim() || '列'
  let n = base
  let i = 2
  while (used.has(n)) n = `${base}${i++}`
  used.add(n)
  return n
}

function recreateTables(src, ws, { srcToDst, usedTableNames, sheetName }) {
  const tables = listTableModels(src)
  if (!tables.length) return
  for (const table of tables) {
    try {
      const range = parseSqrefPart(table.tableRef || table.ref)
      if (!range || range.wholeCol || range.wholeRow) continue
      const headerRow = table.headerRow !== false
      const totalsRow = !!table.totalsRow
      const srcHeader = headerRow ? range.top : null
      const dataTop = range.top + (headerRow ? 1 : 0)
      const dataBottom = range.bottom - (totalsRow ? 1 : 0)
      const destDataRows = []
      for (const [sr, dr] of srcToDst) {
        if (sr >= dataTop && sr <= dataBottom) destDataRows.push(dr)
      }
      destDataRows.sort((a, b) => a - b)
      if (!destDataRows.length) continue

      const destHeader = srcHeader != null && srcToDst.has(srcHeader) ? srcToDst.get(srcHeader) : null
      const destTop = destHeader != null ? destHeader : destDataRows[0]
      const destBottom = destDataRows[destDataRows.length - 1]
      const dataStart = destTop + (headerRow ? 1 : 0)
      if (destBottom < dataStart) continue
      const dataCount = destBottom - dataStart + 1
      if (dataCount <= 0) continue

      const nameUsed = new Set()
      const columns = table.columns.map((col, i) => ({
        name: uniqueColumnName(col.name || `列${i + 1}`, nameUsed),
        filterButton: col.filterButton !== false,
      }))
      const dummyRows = Array.from({ length: dataCount }, () => columns.map(() => null))
      const style = table.style ? { ...table.style } : undefined
      const name = sanitizeTableName(`${table.name || 'Table'}_${sheetName}`, usedTableNames)
      const snap = snapshotRect(ws, destTop, range.left, destBottom, range.right)
      ws.addTable({
        name,
        displayName: name,
        ref: `${colName(range.left)}${destTop}`,
        headerRow,
        totalsRow: false,
        style,
        columns,
        rows: dummyRows,
      })
      restoreRect(ws, destTop, range.left, snap)
    } catch (e) {
      console.warn('保留 Excel Table 失败:', e)
    }
  }
}

function remapRule(rule, srcToDst) {
  const r = cloneVal(rule) || {}
  delete r.dxfId
  delete r.x14Id
  if (Array.isArray(r.formulae)) {
    r.formulae = r.formulae.map((f) => (typeof f === 'string' ? remapFormula(f, srcToDst) : f))
  }
  if (Array.isArray(r.cfvo)) {
    r.cfvo = r.cfvo.map((v) => {
      if (!v || typeof v !== 'object') return v
      const next = { ...v }
      if (typeof next.value === 'string') next.value = remapFormula(next.value, srcToDst)
      return next
    })
  }
  if (r.type === 'dataBar' && (!Array.isArray(r.cfvo) || r.cfvo.length < 2)) {
    r.cfvo = [{ type: 'min' }, { type: 'max' }]
  }
  return r
}

function copyConditionalFormats(src, ws, srcToDst) {
  const list = src.conditionalFormattings || []
  if (!list.length) return
  for (const cf of list) {
    try {
      const ref = remapSqref(cf.ref, srcToDst)
      if (!ref) continue
      const rules = (cf.rules || []).map((rule) => remapRule(rule, srcToDst)).filter((r) => r && r.type)
      if (!rules.length) continue
      ws.addConditionalFormatting({ ref, rules })
    } catch (e) {
      console.warn('保留条件格式失败:', e)
    }
  }
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
  const usedTableNames = collectTableNames(wb)
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
    const srcToDst = new Map()
    for (let h = 1; h <= headerRows; h++) {
      copyRow(h, h)
      srcToDst.set(h, h)
    }
    rows.forEach((sr, i) => {
      const dr = headerRows + 1 + i
      copyRow(sr, dr)
      srcToDst.set(sr, dr)
    })
    recreateTables(src, ws, { srcToDst, usedTableNames, sheetName })
    copyConditionalFormats(src, ws, srcToDst)
    // 表头合并单元格（放在重建 Table 之后，避免合并区域导致 addTable 失败）
    for (const m of (src.model.merges || [])) {
      const mm = /^[A-Z]+(\d+):[A-Z]+(\d+)$/.exec(m)
      if (mm && Number(mm[2]) <= headerRows) { try { ws.mergeCells(m) } catch (e) { /* ignore */ } }
    }
    result.push({ name, sheetName, count: rows.length })
  }
  wb.calcProperties = { ...(wb.calcProperties || {}), fullCalcOnLoad: true }
  return { workbook: wb, groups: result }
}
