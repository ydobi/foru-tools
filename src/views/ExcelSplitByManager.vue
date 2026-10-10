<template>
  <ToolPage
    title="按销售经理拆分Excel"
    description="上传 Excel，按 A 列「销售经理」拆分为多个工作表；保留原表，样式、列宽、公式一并保留。全部在浏览器本地处理。"
  >
    <template #actions>
      <el-upload
        action="#"
        accept=".xlsx,.xlsm,.xls"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <el-button type="primary">选择Excel文件</el-button>
      </el-upload>
      <el-button type="success" :disabled="!file || processing" :loading="processing" @click="process">
        拆分并下载
      </el-button>
    </template>

    <div class="section-label">已选文件</div>
    <el-empty v-if="!file" description="尚未选择文件（支持 .xlsx / .xlsm / .xls）" :image-size="80" />
    <p v-else>{{ file.name }}（{{ (file.size / 1024).toFixed(1) }} KB）</p>

    <template v-if="groups.length">
      <el-divider />
      <div class="section-label">拆分结果：{{ groups.length }} 位销售经理，共 {{ total }} 行</div>
      <el-table :data="groups" border size="small" max-height="400" style="width: 100%">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="name" label="销售经理" />
        <el-table-column prop="sheetName" label="工作表名" />
        <el-table-column prop="count" label="行数" width="100" />
      </el-table>
    </template>
  </ToolPage>
</template>

<script>
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import ToolPage from '../components/ToolPage.vue'
import { splitByManager } from '../utils/splitByManager'

export default {
  name: 'ExcelSplitByManager',
  components: { ToolPage },
  data() {
    return { file: null, processing: false, groups: [] }
  },
  computed: {
    total() { return this.groups.reduce((s, g) => s + g.count, 0) }
  },
  methods: {
    handleFileChange(f) {
      this.file = f.raw
      this.groups = []
    },
    async process() {
      this.processing = true
      try {
        let buf = await this.file.arrayBuffer()
        if (/\.xls$/i.test(this.file.name)) {
          // 旧版 .xls 先转换为 xlsx（样式无法保留）
          const wb = XLSX.read(buf, { type: 'array', cellFormula: true })
          buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
        }
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(buf)
        const { groups } = splitByManager(ExcelJS, wb)
        this.groups = groups
        const out = await wb.xlsx.writeBuffer()
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = this.file.name.replace(/\.(xlsx|xlsm|xls)$/i, '') + '_按销售经理拆分.xlsx'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        ElMessage.success(`已拆分为 ${groups.length} 个工作表`)
      } catch (e) {
        console.error(e)
        ElMessage.error('处理失败：' + (e.message || e))
      } finally {
        this.processing = false
      }
    }
  }
}
</script>

<style scoped>
.section-label { font-weight: 600; margin-bottom: 8px; }
</style>
