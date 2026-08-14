<template>
  <ToolPage
    title="公司关联关系处理工具"
    description="上传Excel文件，自动处理授权公司与订货公司的关联关系"
  >
    <el-collapse class="instructions-collapse">
      <el-collapse-item title="使用说明" name="1">
        <p>请上传包含以下三个工作表的Excel文件：</p>
        <ol>
          <li><strong>授权公司</strong> - 第一个工作表，包含授权公司列</li>
          <li><strong>订货公司</strong> - 第二个工作表，包含订货公司列</li>
          <li><strong>关联关系</strong> - 第三个工作表，包含经销商名称和关联编号列</li>
        </ol>
        <p>处理规则：</p>
        <ul>
          <li>如果授权公司A有关联公司BCD，但只有C订货，那么关联公司只写C</li>
          <li>如果授权公司A有关联公司BCD，BC都有订货，就写B/C</li>
          <li>如果授权公司A有关联公司BCD，但都没有订货，就写无</li>
        </ul>
      </el-collapse-item>
    </el-collapse>

    <div class="upload-row">
      <el-upload
        ref="upload"
        action="#"
        accept=".xls,.xlsx"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :show-file-list="true"
      >
        <el-button type="primary">选择Excel文件</el-button>
        <template #tip>
          <div class="el-upload__tip">支持 .xls 和 .xlsx 格式</div>
        </template>
      </el-upload>
      <el-button
        type="success"
        :disabled="!selectedFile"
        :loading="loading"
        @click="processFile"
      >
        处理文件
      </el-button>
    </div>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="true"
      @close="errorMessage = ''"
      class="error-alert"
    />

    <template #result v-if="resultData.length > 0">
      <div class="result-header">
        <h3>处理结果</h3>
        <el-button type="success" @click="downloadExcel">下载Excel结果</el-button>
      </div>
      <el-table :data="resultData" border stripe max-height="500" style="width: 100%">
        <el-table-column prop="授权公司" label="授权公司" min-width="160" />
        <el-table-column prop="关联公司" label="关联公司" min-width="200" />
        <el-table-column prop="授权公司是否订货" label="授权公司是否订货" width="140" />
        <el-table-column prop="关联公司是否订货" label="关联公司是否订货" min-width="160" />
      </el-table>
    </template>
  </ToolPage>
</template>

<script>
import * as XLSX from 'xlsx'
import ToolPage from '../components/ToolPage.vue'

export default {
  name: 'CompanyRelation',
  components: { ToolPage },
  data() {
    return {
      selectedFile: null,
      loading: false,
      errorMessage: '',
      resultData: []
    }
  },
  methods: {
    handleFileChange(file) {
      this.selectedFile = file.raw
      this.errorMessage = ''
    },
    handleFileRemove() {
      this.selectedFile = null
    },
    processFile() {
      if (!this.selectedFile) {
        this.errorMessage = '请选择一个文件'
        return
      }

      if (!this.selectedFile.name.endsWith('.xls') && !this.selectedFile.name.endsWith('.xlsx')) {
        this.errorMessage = '请上传Excel文件 (.xls 或 .xlsx)'
        return
      }

      this.loading = true
      this.errorMessage = ''
      this.resultData = []

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          if (workbook.SheetNames.length < 3) {
            throw new Error('Excel文件必须包含至少三个工作表')
          }

          const authSheet = workbook.Sheets[workbook.SheetNames[0]]
          const orderSheet = workbook.Sheets[workbook.SheetNames[1]]
          const relationSheet = workbook.Sheets[workbook.SheetNames[2]]

          const authCompanies = XLSX.utils.sheet_to_json(authSheet)
          const orderCompanies = XLSX.utils.sheet_to_json(orderSheet)
          const relations = XLSX.utils.sheet_to_json(relationSheet)

          if (!authCompanies.length) {
            throw new Error('授权公司工作表为空')
          }

          const authKeys = Object.keys(authCompanies[0])
          if (!authKeys.some(k => k.includes('授权公司'))) {
            throw new Error('授权公司工作表缺少"授权公司"列')
          }

          if (!orderCompanies.length) {
            throw new Error('订货公司工作表为空')
          }

          const orderKeys = Object.keys(orderCompanies[0])
          if (!orderKeys.some(k => k.includes('订货公司'))) {
            throw new Error('订货公司工作表缺少"订货公司"列')
          }

          if (!relations.length) {
            throw new Error('关联关系工作表为空')
          }

          const relationKeys = Object.keys(relations[0])
          const requiredRelationKeys = ['经销商名称', '关联编号']
          const missingRelationKeys = requiredRelationKeys.filter(key => !relationKeys.some(k => k.includes(key)))

          if (missingRelationKeys.length > 0) {
            throw new Error('关联关系工作表缺少必要的列: ' + missingRelationKeys.join(', '))
          }

          this.processData(authCompanies, orderCompanies, relations)
        } catch (error) {
          this.loading = false
          this.errorMessage = '处理Excel文件时出错: ' + error.message
        }
      }

      reader.onerror = () => {
        this.loading = false
        this.errorMessage = '读取文件时出错'
      }

      reader.readAsArrayBuffer(this.selectedFile)
    },
    processData(authCompanies, orderCompanies, relations) {
      try {
        const authCompanyKey = this.findKey(authCompanies[0], '授权公司')
        const orderCompanyKey = this.findKey(orderCompanies[0], '订货公司')
        const dealerNameKey = this.findKey(relations[0], '经销商名称')
        const relationIdKey = this.findKey(relations[0], '关联编号')

        const authCompanyList = [...new Set(authCompanies.map(item => item[authCompanyKey]))]
        const orderCompanyList = [...new Set(orderCompanies.map(item => item[orderCompanyKey]))]

        const relationMap = new Map()
        for (const relation of relations) {
          const dealerName = relation[dealerNameKey]
          const relationId = relation[relationIdKey]

          if (!relationId) continue

          if (!relationMap.has(relationId)) {
            relationMap.set(relationId, [])
          }

          relationMap.get(relationId).push(dealerName)
        }

        this.resultData = []

        for (const authCompany of authCompanyList) {
          let relatedCompanies = []

          for (const [, companies] of relationMap.entries()) {
            if (companies.includes(authCompany)) {
              relatedCompanies = relatedCompanies.concat(
                companies.filter(c => c !== authCompany)
              )
            }
          }

          relatedCompanies = [...new Set(relatedCompanies)]

          const orderingRelatedCompanies = relatedCompanies.filter(company =>
            orderCompanyList.includes(company)
          )

          let orderingRelatedCompanyStr
          if (orderingRelatedCompanies.length === 0) {
            orderingRelatedCompanyStr = '否'
          } else {
            orderingRelatedCompanyStr = orderingRelatedCompanies.join('/')
          }

          const isAuthOrdering = orderCompanyList.includes(authCompany) ? '是' : '否'
          const relatedCompaniesStr = relatedCompanies.length > 0 ? relatedCompanies.join('/') : '无'

          this.resultData.push({
            '授权公司': authCompany,
            '关联公司': relatedCompaniesStr,
            '授权公司是否订货': isAuthOrdering,
            '关联公司是否订货': orderingRelatedCompanyStr
          })
        }

        this.loading = false
      } catch (error) {
        this.loading = false
        this.errorMessage = '处理数据时出错: ' + error.message
      }
    },
    findKey(obj, keyword) {
      const keys = Object.keys(obj)
      const key = keys.find(k => k.includes(keyword))
      if (!key) {
        throw new Error(`找不到包含"${keyword}"的列`)
      }
      return key
    },
    downloadExcel() {
      if (this.resultData.length === 0) {
        return
      }

      const ws = XLSX.utils.json_to_sheet(this.resultData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '处理结果')
      XLSX.writeFile(wb, '公司关联关系处理结果.xlsx')
    }
  }
}
</script>

<style scoped>
.instructions-collapse {
  margin-bottom: 20px;
}

.instructions-collapse :deep(.el-collapse-item__content) {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.error-alert {
  margin-top: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #303133;
}
</style>
