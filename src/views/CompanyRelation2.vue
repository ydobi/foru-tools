<template>
  <ToolPage
    title="公司关联关系处理工具"
    description="上传Excel文件，自动处理授权公司与订货公司的关联关系，以植入公司作为基础列合并数据。"
  >
    <el-collapse class="instructions-collapse">
      <el-collapse-item title="使用说明" name="1">
        <p>请上传包含以下四个工作表的Excel文件：</p>
        <ol>
          <li><strong>植入公司</strong> - 第一个工作表，必须包含“植入公司”列和“平台”列。</li>
          <li><strong>授权公司</strong> - 第二个工作表，必须包含“授权公司”列，可包含“平台”列。</li>
          <li><strong>订货公司</strong> - 第三个工作表，必须包含“订货公司”列和“平台”列。</li>
          <li><strong>关联关系</strong> - 第四个工作表，必须包含“经销商名称”和“关联编号”列。</li>
        </ol>
        <p>处理规则：</p>
        <ul>
          <li>分别以植入公司、授权公司和订货公司作为数据源，基于关联关系工作表构建新的关联数据。</li>
          <li>查找每个公司对应的关联编号，获取关联公司列表。</li>
          <li>根据关联公司列表，筛选出关联的授权公司和订货公司。</li>
          <li>将关联的平台、植入公司、授权公司和订货公司信息合并，相同信息用斜杠分隔，若无则显示#N/A。</li>
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

    <template #result v-if="resultData1.length > 0 || resultData2.length > 0 || resultData3.length > 0">
      <el-tabs v-model="activeTab">
        <el-tab-pane v-if="resultData1.length > 0" label="植入结果" name="1">
          <div class="result-header">
            <h3>植入结果</h3>
            <el-button type="success" @click="downloadExcel(resultData1, '植入')">下载Excel结果</el-button>
          </div>
          <el-table :data="resultData1" border stripe max-height="500" style="width: 100%">
            <el-table-column prop="平台" label="平台" min-width="120" />
            <el-table-column prop="植入公司" label="植入公司" min-width="160" />
            <el-table-column prop="授权公司" label="授权公司" min-width="160" />
            <el-table-column prop="订货公司" label="订货公司" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane v-if="resultData2.length > 0" label="授权结果" name="2">
          <div class="result-header">
            <h3>授权结果</h3>
            <el-button type="success" @click="downloadExcel(resultData2, '授权')">下载Excel结果</el-button>
          </div>
          <el-table :data="resultData2" border stripe max-height="500" style="width: 100%">
            <el-table-column prop="平台" label="平台" min-width="120" />
            <el-table-column prop="授权公司" label="授权公司" min-width="160" />
            <el-table-column prop="植入公司" label="植入公司" min-width="160" />
            <el-table-column prop="订货公司" label="订货公司" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane v-if="resultData3.length > 0" label="订货结果" name="3">
          <div class="result-header">
            <h3>订货结果</h3>
            <el-button type="success" @click="downloadExcel(resultData3, '订货')">下载Excel结果</el-button>
          </div>
          <el-table :data="resultData3" border stripe max-height="500" style="width: 100%">
            <el-table-column prop="平台" label="平台" min-width="120" />
            <el-table-column prop="订货公司" label="订货公司" min-width="160" />
            <el-table-column prop="植入公司" label="植入公司" min-width="160" />
            <el-table-column prop="授权公司" label="授权公司" min-width="160" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </ToolPage>
</template>

<script>
import * as XLSX from 'xlsx'
import ToolPage from '../components/ToolPage.vue'

export default {
  name: 'CompanyRelation2',
  components: { ToolPage },
  data() {
    return {
      selectedFile: null,
      loading: false,
      errorMessage: '',
      resultData1: [],
      resultData2: [],
      resultData3: [],
      activeTab: '1'
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

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          if (workbook.SheetNames.length < 4) {
            throw new Error('Excel文件必须包含至少四个工作表')
          }

          const implantSheet = workbook.Sheets[workbook.SheetNames[0]]
          const authSheet = workbook.Sheets[workbook.SheetNames[1]]
          const orderSheet = workbook.Sheets[workbook.SheetNames[2]]
          const relationSheet = workbook.Sheets[workbook.SheetNames[3]]

          const implantCompanies = XLSX.utils.sheet_to_json(implantSheet)
          const authCompanies = XLSX.utils.sheet_to_json(authSheet)
          const orderCompanies = XLSX.utils.sheet_to_json(orderSheet)
          const relations = XLSX.utils.sheet_to_json(relationSheet)

          if (!implantCompanies.length) {
            throw new Error('植入公司工作表为空')
          }

          const implantKeys = Object.keys(implantCompanies[0])
          if (!implantKeys.some(k => k.includes('植入公司'))) {
            throw new Error('植入公司工作表缺少"植入公司"列')
          }

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

          this.processData(authCompanies, orderCompanies, relations, implantCompanies)
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
    processData(authCompanies, orderCompanies, relations, implantCompanies) {
      try {
        const implantPlatformKey = this.findKey(implantCompanies[0], '平台')
        const implantCompanyKey = this.findKey(implantCompanies[0], '植入公司')
        const authChannelKey = this.findKey(authCompanies[0], '平台')
        const authCompanyKey = this.findKey(authCompanies[0], '授权公司')
        const orderPlatformKey = this.findKey(orderCompanies[0], '平台')
        const orderCompanyKey = this.findKey(orderCompanies[0], '订货公司')
        const dealerNameKey = this.findKey(relations[0], '经销商名称')
        const relationIdKey = this.findKey(relations[0], '关联编号')

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

        const resultData1 = []
        const processedCompanies1 = new Set()

        for (const implant of implantCompanies) {
          const implantCompany = implant[implantCompanyKey]
          if (processedCompanies1.has(implantCompany)) continue
          let relationId = null
          let relatedCompanies = []

          for (const [id, companies] of relationMap.entries()) {
            if (companies.includes(implantCompany)) {
              relationId = id
              relatedCompanies = companies
              break
            }
          }
          if (!relatedCompanies.includes(implantCompany)) {
            relatedCompanies.push(implantCompany)
          }

          let relatedAuthCompanies = authCompanies.filter(auth => relatedCompanies.includes(auth[authCompanyKey])).map(auth => auth[authCompanyKey])
          let relatedOrderingCompanies = relatedCompanies.filter(c => orderCompanies.some(order => order[orderCompanyKey] === c))

          relatedCompanies = relatedCompanies.filter(c => implantCompanies.some(implant => implant[implantCompanyKey] === c))

          let relatedPlatforms = relatedCompanies.map(c => implantCompanies.find(implant => implant[implantCompanyKey] === c)[implantPlatformKey])

          relatedAuthCompanies = [...new Set(relatedAuthCompanies)]
          relatedOrderingCompanies = [...new Set(relatedOrderingCompanies)]
          relatedCompanies = [...new Set(relatedCompanies)]
          relatedPlatforms = [...new Set(relatedPlatforms)]

          const resultRow = {
            '平台': relatedPlatforms.length > 0 ? relatedPlatforms.join('/') : '#N/A',
            '植入公司': relatedCompanies.length > 0 ? relatedCompanies.join('/') : '#N/A',
            '授权公司': relatedAuthCompanies.length > 0 ? relatedAuthCompanies.join('/') : '#N/A',
            '订货公司': relatedOrderingCompanies.length > 0 ? relatedOrderingCompanies.join('/') : '#N/A',
            '关联编号': relationId || '#N/A'
          }

          resultData1.push(resultRow)
          for (const relatedCompany of relatedCompanies) {
            processedCompanies1.add(relatedCompany)
          }
        }

        const resultData2 = []
        const processedCompanies2 = new Set()

        for (const auth of authCompanies) {
          const authCompany = auth[authCompanyKey]
          if (processedCompanies2.has(authCompany)) continue
          let relationId = null
          let relatedCompanies = []

          for (const [id, companies] of relationMap.entries()) {
            if (companies.includes(authCompany)) {
              relationId = id
              relatedCompanies = companies
              break
            }
          }
          if (!relatedCompanies.includes(authCompany)) {
            relatedCompanies.push(authCompany)
          }

          let relatedImplantCompanies = implantCompanies.filter(implant => relatedCompanies.includes(implant[implantCompanyKey])).map(implant => implant[implantCompanyKey])
          let relatedOrderingCompanies = relatedCompanies.filter(c => orderCompanies.some(order => order[orderCompanyKey] === c))

          relatedCompanies = relatedCompanies.filter(c => authCompanies.some(auth => auth[authCompanyKey] === c))

          let relatedPlatforms = relatedCompanies.map(c => authCompanies.find(auth => auth[authCompanyKey] === c)[authChannelKey])

          relatedImplantCompanies = [...new Set(relatedImplantCompanies)]
          relatedOrderingCompanies = [...new Set(relatedOrderingCompanies)]
          relatedCompanies = [...new Set(relatedCompanies)]
          relatedPlatforms = [...new Set(relatedPlatforms)]

          const resultRow = {
            '平台': relatedPlatforms.length > 0 ? relatedPlatforms.join('/') : '#N/A',
            '授权公司': relatedCompanies.length > 0 ? relatedCompanies.join('/') : '#N/A',
            '植入公司': relatedImplantCompanies.length > 0 ? relatedImplantCompanies.join('/') : '#N/A',
            '订货公司': relatedOrderingCompanies.length > 0 ? relatedOrderingCompanies.join('/') : '#N/A',
            '关联编号': relationId || '#N/A'
          }

          resultData2.push(resultRow)
          for (const relatedCompany of relatedCompanies) {
            processedCompanies2.add(relatedCompany)
          }
        }

        const resultData3 = []
        const processedCompanies3 = new Set()

        for (const order of orderCompanies) {
          const orderCompany = order[orderCompanyKey]
          if (processedCompanies3.has(orderCompany)) continue
          let relationId = null
          let relatedCompanies = []

          for (const [id, companies] of relationMap.entries()) {
            if (companies.includes(orderCompany)) {
              relationId = id
              relatedCompanies = companies
              break
            }
          }
          if (!relatedCompanies.includes(orderCompany)) {
            relatedCompanies.push(orderCompany)
          }

          let relatedAuthCompanies = authCompanies.filter(auth => relatedCompanies.includes(auth[authCompanyKey])).map(auth => auth[authCompanyKey])
          let relatedImplantCompanies = relatedCompanies.filter(c => implantCompanies.some(implant => implant[implantCompanyKey] === c))

          relatedCompanies = relatedCompanies.filter(c => orderCompanies.some(order => order[orderCompanyKey] === c))
          let relatedPlatforms = relatedCompanies.map(c => orderCompanies.find(order => order[orderCompanyKey] === c)[orderPlatformKey])

          relatedAuthCompanies = [...new Set(relatedAuthCompanies)]
          relatedImplantCompanies = [...new Set(relatedImplantCompanies)]
          relatedCompanies = [...new Set(relatedCompanies)]
          relatedPlatforms = [...new Set(relatedPlatforms)]

          const resultRow = {
            '平台': relatedPlatforms.length > 0 ? relatedPlatforms.join('/') : '#N/A',
            '订货公司': relatedCompanies.length > 0 ? relatedCompanies.join('/') : '#N/A',
            '植入公司': relatedImplantCompanies.length > 0 ? relatedImplantCompanies.join('/') : '#N/A',
            '授权公司': relatedAuthCompanies.length > 0 ? relatedAuthCompanies.join('/') : '#N/A',
            '关联编号': relationId || '#N/A'
          }

          resultData3.push(resultRow)
          for (const relatedCompany of relatedCompanies) { processedCompanies3.add(relatedCompany) }
        }

        this.resultData1 = resultData1.filter(row => !(row['植入公司'] === '#N/A' && row['授权公司'] === '#N/A' && row['订货公司'] === '#N/A'))
        this.resultData2 = resultData2.filter(row => !(row['平台'] === '#N/A' && row['植入公司'] === '#N/A' && row['授权公司'] === '#N/A' && row['订货公司'] === '#N/A'))
        this.resultData3 = resultData3.filter(row => !(row['平台'] === '#N/A' && row['植入公司'] === '#N/A' && row['授权公司'] === '#N/A' && row['订货公司'] === '#N/A'))

        this.activeTab = this.resultData1.length > 0 ? '1' : (this.resultData2.length > 0 ? '2' : '3')
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

    downloadExcel(resultData, name) {
      if (resultData.length === 0) {
        return
      }
      const ws = XLSX.utils.json_to_sheet(resultData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '处理结果')
      XLSX.writeFile(wb, `${name}.xlsx`)
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
