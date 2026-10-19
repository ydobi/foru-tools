<template>
  <ToolPage
    title="绕口令公司-按照销售经理汇总"
    description="上传含「植入结果 / 授权结果 / 订货结果」的 Excel，按固定销售经理、TL、大区名单汇总公司数量及缺失项，下载一个含三个工作表的结果文件。全部在浏览器本地处理。"
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
        汇总并下载
      </el-button>
    </template>

    <div class="section-label">已选文件</div>
    <el-empty v-if="!file" description="尚未选择文件（支持 .xlsx / .xlsm / .xls）" :image-size="80" />
    <p v-else>{{ file.name }}（{{ (file.size / 1024).toFixed(1) }} KB）</p>

    <template v-if="previewSheets.length">
      <el-divider />
      <div class="section-label">汇总预览</div>
      <el-tabs v-model="activeTab">
        <el-tab-pane
          v-for="s in previewSheets"
          :key="s.outSheetName"
          :label="s.outSheetName"
          :name="s.outSheetName"
        >
          <p class="source-hint">来源工作表：{{ s.sourceSheet }}</p>
          <el-table :data="s.rows" border size="small" max-height="480" style="width: 100%">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column
              v-for="(h, i) in s.outHeaders"
              :key="h"
              :prop="i === 0 ? 'name' : `c${i - 1}`"
              :label="h"
              :min-width="i === 0 ? 140 : 120"
            />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </ToolPage>
</template>

<script>
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import ToolPage from '../components/ToolPage.vue'
import { summarizeWorkbook, buildSummaryWorkbook } from '../utils/managerSummary'

export default {
  name: 'ManagerSummary',
  components: { ToolPage },
  data() {
    return {
      file: null,
      processing: false,
      previewSheets: [],
      activeTab: ''
    }
  },
  methods: {
    handleFileChange(f) {
      this.file = f.raw
      this.previewSheets = []
      this.activeTab = ''
    },
    async process() {
      this.processing = true
      try {
        let buf = await this.file.arrayBuffer()
        if (/\.xls$/i.test(this.file.name) && !/\.xlsx$/i.test(this.file.name) && !/\.xlsm$/i.test(this.file.name)) {
          const wbX = XLSX.read(buf, { type: 'array' })
          buf = XLSX.write(wbX, { type: 'array', bookType: 'xlsx' })
        }
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(buf)
        const summary = summarizeWorkbook(wb)
        this.previewSheets = summary.sheets
        this.activeTab = summary.sheets[0]?.outSheetName || ''

        const outWb = buildSummaryWorkbook(ExcelJS, summary)
        const out = await outWb.xlsx.writeBuffer()
        const blob = new Blob([out], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = this.file.name.replace(/\.(xlsx|xlsm|xls)$/i, '') + '_按销售经理汇总.xlsx'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        ElMessage.success('汇总完成，已开始下载')
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
.section-label {
  font-weight: 600;
  margin-bottom: 8px;
}
.source-hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: #909399;
}
</style>
