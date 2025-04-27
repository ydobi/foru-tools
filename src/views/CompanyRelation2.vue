<!--
 * @Description: 
 * @Author: hongkai05
 * @Date: 2025-04-27 15:52:12
 * @LastEditors: hongkai05
 * @LastEditTime: 2025-04-27 15:58:55
 * @FilePath: \foru-tools\src\views\CompanyRelation2.vue
-->
<template>
  <div class="company-relation">
    <div class="header text-center">
      <h1>公司关联关系处理工具</h1>
      <p class="lead">上传Excel文件，自动处理授权公司与订货公司的关联关系，以植入公司作为基础列合并数据。</p>
    </div>

    <div class="upload-container bg-white p-4 rounded shadow-sm">
      <div class="instructions bg-light p-3 rounded mb-3">
        <h4>使用说明：</h4>
        <p>请上传包含以下四个工作表的Excel文件：</p>
        <ol>
          <li><strong>植入公司</strong> - 第一个工作表，必须包含“植入公司”列和“平台”列。</li>
          <li><strong>授权公司</strong> - 第二个工作表，必须包含“授权公司”列，可包含“渠道”列。</li>
          <li><strong>订货公司</strong> - 第三个工作表，必须包含“订货公司”列和“平台”列。</li>
          <li><strong>关联关系</strong> - 第四个工作表，必须包含“经销商名称”和“关联编号”列，关联编号一致的表示为关联公司。</li>
        </ol>
        <p>处理规则：</p>
        <ul>
          <li>以植入公司作为基础列，查找其关联的授权公司和订货公司。</li>
          <li>如果授权公司A有关联公司BCD，但只有C订货，那么关联订货公司只写C。</li>
          <li>如果授权公司A有关联公司BCD，BC都有订货，关联订货公司写B/C。</li>
          <li>如果授权公司A有关联公司BCD，但都没有订货，关联订货公司写N/A。</li>
          <li>关联授权公司列表中，若存在关联授权公司则用斜杠分隔，若无则写N/A。</li>
        </ul>
      </div>

      <div class="mb-3">
        <label for="file" class="form-label">选择Excel文件</label>
        <div class="input-group">
          <input type="file" class="form-control" id="file" ref="fileInput" accept=".xls,.xlsx" @change="handleFileChange">
          <button class="btn btn-primary" type="button" @click="processFile" :disabled="!selectedFile">处理文件</button>
        </div>
        <div class="form-text">支持.xls和.xlsx格式</div>
      </div>
      
      <div class="alert alert-danger" v-if="errorMessage">{{ errorMessage }}</div>
      
      <div class="text-center my-4" v-if="loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">处理中...</span>
        </div>
        <p class="mt-2">正在处理数据，请稍候...</p>
      </div>
    </div>

    <div class="result-container bg-white p-4 rounded shadow-sm mt-4" v-if="resultData.length > 0">
      <h3>处理结果</h3>
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-success" @click="downloadExcel">下载Excel结果</button>
      </div>
      <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
        <table class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>平台</th>
              <th>植入公司</th>
              <th>授权公司</th>
              <th>订货公司</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in resultData" :key="index">
              <td>{{ row['平台'] }}</td>
              <td>{{ row['植入公司'] }}</td>
              <td>{{ row['授权公司'] }}</td>
              <td>{{ row['订货公司'] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompanyRelation',
  data() {
    return {
      selectedFile: null,
      loading: false,
      errorMessage: '',
      resultData: []
    }
  },
  methods: {
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
      this.errorMessage = '';
    },
    processFile() {
      if (!this.selectedFile) {
        this.errorMessage = '请选择一个文件';
        return;
      }
      
      if (!this.selectedFile.name.endsWith('.xls') && !this.selectedFile.name.endsWith('.xlsx')) {
        this.errorMessage = '请上传Excel文件 (.xls 或 .xlsx)';
        return;
      }
      
      this.loading = true;
      this.errorMessage = '';
      this.resultData = [];
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          debugger;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 确保有四个工作表
          if (workbook.SheetNames.length < 4) {
            throw new Error('Excel文件必须包含至少四个工作表');
          }
          
          // 读取四个工作表
          const implantSheet = workbook.Sheets[workbook.SheetNames[0]];
          const authSheet = workbook.Sheets[workbook.SheetNames[1]];
          const orderSheet = workbook.Sheets[workbook.SheetNames[2]];
          const relationSheet = workbook.Sheets[workbook.SheetNames[3]];
          
          // 转换为JSON
          const implantCompanies = XLSX.utils.sheet_to_json(implantSheet);
          const authCompanies = XLSX.utils.sheet_to_json(authSheet);
          const orderCompanies = XLSX.utils.sheet_to_json(orderSheet);
          const relations = XLSX.utils.sheet_to_json(relationSheet);
          
          // 检查植入公司表格必要的列
          if (!implantCompanies.length) {
            throw new Error('植入公司工作表为空');
          }
          
          const implantKeys = Object.keys(implantCompanies[0]);
          if (!implantKeys.some(k => k.includes('植入公司'))) {
            throw new Error('植入公司工作表缺少"植入公司"列');
          }
          
          // 检查必要的列是否存在
          if (!authCompanies.length) {
            throw new Error('授权公司工作表为空');
          }
          
          // 检查授权公司表格必要的列 - 只检查授权公司列
          const authKeys = Object.keys(authCompanies[0]);
          if (!authKeys.some(k => k.includes('授权公司'))) {
            throw new Error('授权公司工作表缺少"授权公司"列');
          }
          
          // 检查订货公司表格必要的列
          if (!orderCompanies.length) {
            throw new Error('订货公司工作表为空');
          }
          
          const orderKeys = Object.keys(orderCompanies[0]);
          if (!orderKeys.some(k => k.includes('订货公司'))) {
            throw new Error('订货公司工作表缺少"订货公司"列');
          }
          
          // 检查关联关系表格必要的列
          if (!relations.length) {
            throw new Error('关联关系工作表为空');
          }
          
          const relationKeys = Object.keys(relations[0]);
          const requiredRelationKeys = ['经销商名称', '关联编号'];
          const missingRelationKeys = requiredRelationKeys.filter(key => !relationKeys.some(k => k.includes(key)));
          
          if (missingRelationKeys.length > 0) {
            throw new Error('关联关系工作表缺少必要的列: ' + missingRelationKeys.join(', '));
          }
          
          // 处理数据
          this.processData(authCompanies, orderCompanies, relations, implantCompanies);
        } catch (error) {
          this.loading = false;
          this.errorMessage = '处理Excel文件时出错: ' + error.message;
        }
      };
      
      reader.onerror = () => {
        this.loading = false;
        this.errorMessage = '读取文件时出错';
      };
      
      reader.readAsArrayBuffer(this.selectedFile);
    },
    processData(authCompanies, orderCompanies, relations, implantCompanies) {
      try {
        // 找到实际的列名（可能有前缀或后缀）
        const implantPlatformKey = this.findKey(implantCompanies[0], '平台');
        const implantCompanyKey = this.findKey(implantCompanies[0], '植入公司');
        const authChannelKey = this.findKey(authCompanies[0], '渠道');
        const authCompanyKey = this.findKey(authCompanies[0], '授权公司');
        const orderPlatformKey = this.findKey(orderCompanies[0], '平台');
        const orderCompanyKey = this.findKey(orderCompanies[0], '订货公司');
        const dealerNameKey = this.findKey(relations[0], '经销商名称');
        const relationIdKey = this.findKey(relations[0], '关联编号');

        // 创建关联公司映射表 (关联编号 -> 公司列表)
        const relationMap = new Map();
        for (const relation of relations) {
          const dealerName = relation[dealerNameKey];
          const relationId = relation[relationIdKey];

          if (!relationId) continue;

          if (!relationMap.has(relationId)) {
            relationMap.set(relationId, []);
          }

          relationMap.get(relationId).push(dealerName);
        }

        // 创建结果数组
        this.resultData = [];

        // 创建平台和订货公司映射
        const orderMap = new Map();
        for (const order of orderCompanies) {
          orderMap.set(order[orderCompanyKey], order[orderPlatformKey]);
        }

        // 创建关联编号到平台集合的映射
        const relationIdToPlatforms = new Map();

        // 创建植入公司到关联编号的映射
        const implantToRelationId = new Map();
        for (const [relationId, companies] of relationMap.entries()) {
          for (const company of companies) {
            if (implantCompanies.some(implant => implant[implantCompanyKey] === company)) {
              implantToRelationId.set(company, relationId);
            }
            if (orderMap.has(company)) {
              if (!relationIdToPlatforms.has(relationId)) {
                relationIdToPlatforms.set(relationId, new Set());
              }
              relationIdToPlatforms.get(relationId).add(orderMap.get(company));
            }
          }
        }

        // 创建关联编号到结果行的映射
        const resultMap = new Map();
        for (const implant of implantCompanies) {
          const implantCompany = implant[implantCompanyKey];
          const relationId = implantToRelationId.get(implantCompany);
          if (!relationId) continue;

          // 获取该关联编号对应的所有平台
          const platforms = relationIdToPlatforms.get(relationId) || new Set([implant[implantPlatformKey]]);
          const combinedPlatforms = Array.from(platforms).join('/');

          if (!resultMap.has(relationId)) {
            resultMap.set(relationId, {
              '平台': combinedPlatforms,
              '植入公司': [],
              '授权公司': [],
              '订货公司': []
            });
          }

          const resultRow = resultMap.get(relationId);
          resultRow['植入公司'].push(implantCompany);

          // 查找关联的授权公司和订货公司
          const relatedCompanies = relationMap.get(relationId);
          // 找到关联的授权公司
          const relatedAuthCompanies = authCompanies.filter(auth => relatedCompanies.includes(auth[authCompanyKey])).map(auth => auth[authCompanyKey]);
          resultRow['授权公司'] = [...new Set([...resultRow['授权公司'], ...relatedAuthCompanies])];

          // 找到关联的订货公司
          const relatedOrderingCompanies = relatedCompanies.filter(c => orderMap.has(c));
          resultRow['订货公司'] = [...new Set([...resultRow['订货公司'], ...relatedOrderingCompanies])];
        }

        // 处理结果映射为最终结果数据
        this.resultData = Array.from(resultMap.values()).map(row => {
          // 对每个公司名称数组去重
          row['植入公司'] = [...new Set(row['植入公司'])];
          row['授权公司'] = [...new Set(row['授权公司'])];
          row['订货公司'] = [...new Set(row['订货公司'])];
          return {
            '平台': row['平台'],
            '植入公司': row['植入公司'].join('/'),
            '授权公司': row['授权公司'].length > 0 ? row['授权公司'].join('/') : 'N/A',
            '订货公司': row['订货公司'].length > 0 ? row['订货公司'].join('/') : 'N/A'
          }
        });

        this.loading = false;
      } catch (error) {
        this.loading = false;
        this.errorMessage = '处理数据时出错: ' + error.message;
      }
    },
    findKey(obj, keyword) {
      const keys = Object.keys(obj);
      const key = keys.find(k => k.includes(keyword));
      if (!key) {
        throw new Error(`找不到包含"${keyword}"的列`);
      }
      return key;
    },
    downloadExcel() {
      if (this.resultData.length === 0) {
        return;
      }
      
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(this.resultData);
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "处理结果");
      
      // 生成Excel文件并下载
      XLSX.writeFile(wb, "公司关联关系处理结果.xlsx");
    }
  }
}
</script>

<style scoped>
.company-relation {
  margin-bottom: 2rem;
}
</style>