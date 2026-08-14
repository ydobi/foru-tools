<template>
  <ToolPage
    title="Excel文件合并工具"
    description="合并多个Excel文件，支持垂直合并、水平合并和分表合并"
  >
    <template #actions>
      <el-upload
        ref="upload"
        action="#"
        accept=".xlsx,.xls"
        :auto-upload="false"
        :multiple="true"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <el-button type="primary">选择Excel文件</el-button>
      </el-upload>
      <el-button type="success" :disabled="selectedFiles.length < 2" @click="mergeExcel">
        合并Excel
      </el-button>
      <el-button :disabled="selectedFiles.length === 0" @click="clearFiles">
        清除所有文件
      </el-button>
    </template>

    <div class="file-section">
      <div class="section-label">已选文件</div>
      <el-empty v-if="selectedFiles.length === 0" description="尚未选择文件" :image-size="80" />
      <el-table v-else :data="selectedFiles" border size="small" max-height="280" style="width: 100%">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="name" label="文件名" min-width="220" />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeFile($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-divider />

    <div class="options-section">
      <div class="section-label">合并选项</div>
      <el-form label-position="top">
        <el-form-item>
          <el-checkbox v-model="useHeaderFromFirstFile">
            第一个文件的表头作为合并后的表头
          </el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="useFilenameAsSheetName">
            使用文件名作为工作表名
          </el-checkbox>
        </el-form-item>
        <el-form-item label="合并方式">
          <el-select v-model="mergeType" style="width: 320px">
            <el-option label="垂直合并（上下合并）" value="vertical" />
            <el-option label="水平合并（左右合并）" value="horizontal" />
            <el-option label="分表合并（每个文件作为单独的工作表）" value="sheets" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <el-progress
      v-if="showProgress"
      :percentage="progressPercent"
      :stroke-width="10"
      class="merge-progress"
    />

    <el-alert
      v-if="statusMessage"
      :title="statusMessage"
      :type="statusType"
      show-icon
      :closable="false"
      class="status-alert"
    />
  </ToolPage>
</template>

<script>
import * as XLSX from 'xlsx'
import ToolPage from '../components/ToolPage.vue'

export default {
  name: 'ExcelMerge',
  components: { ToolPage },
  data() {
    return {
      selectedFiles: [],
      useHeaderFromFirstFile: true,
      useFilenameAsSheetName: true,
      mergeType: 'vertical',
      showProgress: false,
      progressPercent: 0,
      statusMessage: '',
      statusType: 'info'
    }
  },
  methods: {
    handleFileChange(uploadFile) {
      const file = uploadFile.raw
      if (!file) return

      if (!this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        this.selectedFiles.push(file)
      }
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },
    clearFiles() {
      this.selectedFiles = []
      this.statusMessage = ''
      this.showProgress = false
      this.progressPercent = 0
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    setStatus(message, type = 'info') {
      this.statusMessage = message
      this.statusType = type
    },
    updateProgress(percent) {
      this.showProgress = true
      this.progressPercent = Math.min(100, Math.round(percent))

      if (percent >= 100) {
        setTimeout(() => {
          this.showProgress = false
          this.progressPercent = 0
        }, 1000)
      }
    },
    async mergeExcel() {
      if (this.selectedFiles.length < 2) {
        this.setStatus('请至少选择两个Excel文件进行合并', 'warning')
        return
      }

      this.setStatus('正在处理文件...', 'info')
      this.updateProgress(10)

      try {
        const workbooks = []
        const totalFiles = this.selectedFiles.length

        for (let i = 0; i < totalFiles; i++) {
          const file = this.selectedFiles[i]
          const data = await this.readFileAsArrayBuffer(file)
          const workbook = XLSX.read(data, { type: 'array' })
          workbooks.push({
            name: file.name,
            workbook: workbook
          })

          this.updateProgress(10 + (i + 1) / totalFiles * 40)
        }

        this.updateProgress(50)
        this.setStatus('正在合并文件...', 'info')

        const mergedWorkbook = XLSX.utils.book_new()

        if (this.mergeType === 'sheets') {
          workbooks.forEach((wb, index) => {
            const sheetName = wb.workbook.SheetNames[0]
            const worksheet = wb.workbook.Sheets[sheetName]
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            jsonData = jsonData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
            jsonData = jsonData.map(row => row.map(cell => cell === null || cell === undefined ? '' : cell))

            const cleanedWorksheet = XLSX.utils.aoa_to_sheet(jsonData)

            let newSheetName = this.useFilenameAsSheetName
              ? wb.name.replace(/\.[^/.]+$/, '')
              : `Sheet${index + 1}`

            if (newSheetName.length > 31) {
              newSheetName = newSheetName.substring(0, 28) + '...'
            }

            XLSX.utils.book_append_sheet(mergedWorkbook, cleanedWorksheet, newSheetName)
            this.updateProgress(50 + (index + 1) / totalFiles * 30)
          })
        } else {
          let mergedData = []
          let headers = []

          workbooks.forEach((wb, index) => {
            const sheetName = wb.workbook.SheetNames[0]
            const worksheet = wb.workbook.Sheets[sheetName]
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            jsonData = jsonData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
            jsonData = jsonData.map(row => row.map(cell => cell === null || cell === undefined ? '' : cell))

            if (jsonData.length === 0) return

            if (index === 0 || !this.useHeaderFromFirstFile) {
              if (this.mergeType === 'vertical') {
                mergedData = mergedData.concat(jsonData)
              } else {
                mergedData = jsonData.map(row => [...row])
                headers = jsonData[0] || []
              }
            } else {
              if (this.mergeType === 'vertical') {
                const dataWithoutHeader = this.useHeaderFromFirstFile ? jsonData.slice(1) : jsonData
                mergedData = mergedData.concat(dataWithoutHeader)
              } else {
                const dataRows = this.useHeaderFromFirstFile ? jsonData.slice(1) : jsonData
                const currentHeaders = this.useHeaderFromFirstFile ? jsonData[0] : []

                if (currentHeaders && currentHeaders.length > 0) {
                  headers = [...headers, ...currentHeaders]
                  if (mergedData[0]) {
                    mergedData[0] = [...mergedData[0], ...currentHeaders]
                  }
                }

                dataRows.forEach((row, rowIndex) => {
                  const targetRowIndex = this.useHeaderFromFirstFile ? rowIndex + 1 : rowIndex

                  if (!mergedData[targetRowIndex]) {
                    const emptyRow = Array(mergedData[0] ? mergedData[0].length - row.length : 0).fill('')
                    mergedData[targetRowIndex] = [...emptyRow, ...row]
                  } else {
                    mergedData[targetRowIndex] = [...mergedData[targetRowIndex], ...row]
                  }
                })
              }
            }

            this.updateProgress(50 + (index + 1) / totalFiles * 30)
          })

          mergedData = mergedData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))

          const worksheet = XLSX.utils.aoa_to_sheet(mergedData)
          XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, '合并数据')
        }

        this.updateProgress(90)
        this.setStatus('正在生成合并后的Excel文件...', 'info')

        const excelBuffer = XLSX.write(mergedWorkbook, { bookType: 'xlsx', type: 'array' })
        this.saveAsExcelFile(excelBuffer, '合并后的Excel文件.xlsx')

        this.updateProgress(100)
        this.setStatus('合并完成！文件已下载。', 'success')
      } catch (error) {
        console.error('合并过程中出错:', error)
        this.setStatus('合并过程中出错: ' + error.message, 'error')
        this.updateProgress(0)
      }
    },
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e.target.error)
        reader.readAsArrayBuffer(file)
      })
    },
    saveAsExcelFile(buffer, fileName) {
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.file-section {
  margin-bottom: 8px;
}

.options-section :deep(.el-form-item) {
  margin-bottom: 12px;
}

.merge-progress {
  margin-top: 16px;
}

.status-alert {
  margin-top: 16px;
}
</style>
