'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const esbuild = require('esbuild')
const ExcelJS = require('exceljs')

const srcPath = path.join(__dirname, 'splitByManager.js')
const { code } = esbuild.transformSync(fs.readFileSync(srcPath, 'utf8'), {
  format: 'cjs',
  loader: 'js',
})
const mod = { exports: {} }
new Function('module', 'exports', 'require', '__filename', '__dirname', code)(
  mod,
  mod.exports,
  require,
  srcPath,
  __dirname
)
const { splitByManager, sanitizeSheetName, sanitizeTableName } = mod.exports

function tableModel(ws) {
  const tables = typeof ws.getTables === 'function' ? ws.getTables() : Object.values(ws.tables || {})
  const item = tables[0] && (Array.isArray(tables[0]) ? tables[0][0] : tables[0])
  return item && (item.model || item)
}

function dataBar(ws) {
  const cfs = ws.conditionalFormattings || []
  for (const cf of cfs) {
    const rule = (cf.rules || []).find((r) => r.type === 'dataBar')
    if (rule) return { ref: cf.ref, rule }
  }
  return null
}

async function reload(wb) {
  const buf = await wb.xlsx.writeBuffer()
  const next = new ExcelJS.Workbook()
  await next.xlsx.load(buf)
  return next
}

async function buildSource() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('源表')
  ws.columns = [{ width: 12 }, { width: 14 }, { width: 10 }, { width: 10 }]
  ws.getRow(1).values = [undefined, '销售经理', '客户', '金额', '系数']
  const rows = [
    ['张三', 'A医院', 10, 2],
    ['李四', 'B医院', 20, 3],
    ['张三', 'C医院', 80, 2],
    ['李四', 'D医院', 5, 4],
    ['张三', 'E医院', 40, 1],
  ]
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2' }]
  ws.addTable({
    name: '销售表',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium9',
      showRowStripes: true,
      showColumnStripes: false,
      showFirstColumn: false,
      showLastColumn: true,
    },
    columns: [
      { name: '销售经理', filterButton: true },
      { name: '客户', filterButton: true },
      { name: '金额', filterButton: true },
      { name: '系数', filterButton: false },
    ],
    rows,
  })
  rows.forEach((_, i) => {
    ws.getRow(i + 2).getCell(4).value = { formula: `C${i + 2}*2` }
  })
  ws.addConditionalFormatting({
    ref: 'C2:C6',
    rules: [{
      type: 'dataBar',
      priority: 1,
      gradient: true,
      cfvo: [{ type: 'min' }, { type: 'max' }],
      color: { argb: 'FF638EC6' },
    }],
  })
  return wb
}

async function run() {
  assert.equal(sanitizeSheetName('a/b', new Set()), 'a_b')
  const usedTables = new Set()
  const t1 = sanitizeTableName('销售表_张三', usedTables)
  const t2 = sanitizeTableName('销售表_张三', usedTables)
  assert.equal(t1, '销售表_张三')
  assert.equal(t2, '销售表_张三_2')
  assert.ok(sanitizeTableName('C', new Set()).startsWith('T_'))

  const srcWb = await buildSource()
  const { groups } = splitByManager(ExcelJS, srcWb)
  assert.deepEqual(groups.map((g) => g.name), ['张三', '李四'])
  assert.equal(groups[0].count, 3)
  assert.equal(groups[1].count, 2)
  assert.equal(srcWb.worksheets[0].name, '源表')

  const out = await reload(srcWb)
  assert.equal(out.worksheets.length, 3)
  assert.equal(out.worksheets[0].name, '源表')

  const srcTable = tableModel(out.worksheets[0])
  assert.ok(srcTable, '原表应保留 Table')
  assert.equal(srcTable.name, '销售表')
  assert.equal(srcTable.style.showRowStripes, true)

  const zhang = out.worksheets.find((w) => w.name === '张三')
  const li = out.worksheets.find((w) => w.name === '李四')
  assert.ok(zhang && li)

  const zt = tableModel(zhang)
  const lt = tableModel(li)
  assert.ok(zt, '张三 sheet 应有 Table')
  assert.ok(lt, '李四 sheet 应有 Table')
  assert.equal(zt.style.theme, 'TableStyleMedium9')
  assert.equal(zt.style.showRowStripes, true)
  assert.equal(zt.style.showLastColumn, true)
  assert.equal(lt.style.showRowStripes, true)
  assert.equal(zt.tableRef, 'A1:D4')
  assert.equal(lt.tableRef, 'A1:D3')
  assert.notEqual(zt.name, lt.name)
  assert.notEqual(zt.name, '销售表')
  assert.equal(new Set([srcTable.name, zt.name, lt.name]).size, 3)

  assert.equal(zhang.getCell('A2').value, '张三')
  assert.equal(zhang.getCell('A3').value, '张三')
  assert.equal(zhang.getCell('A4').value, '张三')
  assert.equal(li.getCell('A2').value, '李四')
  assert.equal(zhang.getCell('D3').formula, 'C3*2')

  const zb = dataBar(zhang)
  const lb = dataBar(li)
  assert.ok(zb, '张三 sheet 应有数据条')
  assert.ok(lb, '李四 sheet 应有数据条')
  assert.equal(zb.ref, 'C2:C4')
  assert.equal(lb.ref, 'C2:C3')
  assert.equal(zb.rule.color && zb.rule.color.argb, 'FF638EC6')
  assert.equal(zhang.views[0].state, 'frozen')
  assert.equal(zhang.views[0].ySplit, 1)

  const srcBar = dataBar(out.worksheets[0])
  assert.ok(srcBar)
  assert.equal(srcBar.ref, 'C2:C6')

  // 模拟真实文件：先 round-trip 再拆分（Table 只有 tableRef，dataBar 无 gradient）
  const loaded = await reload(await buildSource())
  const before = loaded.worksheets[0]
  assert.equal(tableModel(before).ref, undefined)
  assert.ok(tableModel(before).tableRef)
  const { groups: loadedGroups } = splitByManager(ExcelJS, loaded)
  assert.equal(loadedGroups.length, 2)
  const reloaded = await reload(loaded)
  const z2 = reloaded.worksheets.find((w) => w.name === '张三')
  const t2m = tableModel(z2)
  assert.equal(t2m.style.showRowStripes, true)
  assert.equal(t2m.tableRef, 'A1:D4')
  const b2 = dataBar(z2)
  assert.ok(b2)
  assert.equal(b2.ref, 'C2:C4')
  assert.equal(z2.getCell('B3').value, 'C医院')
  assert.equal(z2.getCell('D2').formula, 'C2*2')

  console.log('splitByManager tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
