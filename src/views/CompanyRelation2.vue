<!--
 * @Description: 
 * @Author: hongkai05
 * @Date: 2025-04-27 15:52:12
 * @LastEditors: hongkai05
 * @LastEditTime: 2025-04-27 22:18:54
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
          <li><strong>授权公司</strong> - 第二个工作表，必须包含“授权公司”列，可包含“平台”列。</li>
          <li><strong>订货公司</strong> - 第三个工作表，必须包含“订货公司”列和“平台”列。</li>
          <li><strong>关联关系</strong> - 第四个工作表，必须包含“经销商名称”和“关联编号”列，关联编号一致的表示为关联公司。</li>
        </ol>
        <p>处理规则：</p>
        <ul>
          <li>分别以植入公司、授权公司和订货公司作为数据源，基于关联关系工作表构建新的关联数据。</li>
          <li>查找每个公司对应的关联编号，获取关联公司列表。</li>
          <li>根据关联公司列表，筛选出关联的授权公司和订货公司。</li>
          <li>将关联的平台、植入公司、授权公司和订货公司信息合并，相同信息用斜杠分隔，若无则显示#N/A。</li>
          <li>处理过程中会对重复公司进行去重，避免结果重复。</li>
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

    <div class="result-container bg-white p-4 rounded shadow-sm mt-4" v-if="resultData1.length > 0 || resultData2.length > 0 || resultData3.length > 0">
      <div class="nav nav-tabs">
        <button class="nav-link" :class="{ active: activeTab === 1 }" @click="activeTab = 1">植入结果</button>
        <button class="nav-link" :class="{ active: activeTab === 2 }" @click="activeTab = 2">授权结果</button>
        <button class="nav-link" :class="{ active: activeTab === 3 }" @click="activeTab = 3">订货结果</button>
      </div>
      <div class="tab-content mt-3">
        <div class="tab-pane fade show" :class="{ active: activeTab === 1 }" v-if="resultData1.length > 0">
          <h3>植入结果</h3>
          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-success" @click="downloadExcel(resultData1, '植入')">下载Excel结果</button>
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
                <tr v-for="(row, index) in resultData1" :key="index">
                  <td>{{ row['平台'] }}</td>
                  <td>{{ row['植入公司'] }}</td>
                  <td>{{ row['授权公司'] }}</td>
                  <td>{{ row['订货公司'] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="tab-pane fade show" :class="{ active: activeTab === 2 }" v-if="resultData2.length > 0">
          <h3>授权结果</h3>
          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-success" @click="downloadExcel(resultData2, '授权')">下载Excel结果</button>
          </div>
          <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
            <table class="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>平台</th>
                  <th>授权公司</th>
                  <th>植入公司</th>
                  <th>订货公司</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in resultData2" :key="index">
                  <td>{{ row['平台'] }}</td>
                  <td>{{ row['授权公司'] }}</td>
                  <td>{{ row['植入公司'] }}</td>
                  <td>{{ row['订货公司'] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="tab-pane fade show" :class="{ active: activeTab === 3 }" v-if="resultData3.length > 0">
          <h3>订货结果</h3>
          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-success" @click="downloadExcel(resultData3, '订货')">下载Excel结果</button>
          </div>
          <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
            <table class="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>平台</th>
                  <th>订货公司</th>
                  <th>植入公司</th>
                  <th>授权公司</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in resultData3" :key="index">
                  <td>{{ row['平台'] }}</td>
                  <td>{{ row['订货公司'] }}</td>
                  <td>{{ row['植入公司'] }}</td>
                  <td>{{ row['授权公司'] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
      resultData1: [],
      resultData2: [],
      resultData3: [],
      activeTab: 1 // 新增 activeTab 状态
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
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
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
        const authChannelKey = this.findKey(authCompanies[0], '平台');
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
        const resultData1 = [];
        const processedCompanies1 = new Set();

        // 以植入公司作为数据源，构造新的关联关系数据
        for (const implant of implantCompanies) {
          const implantCompany = implant[implantCompanyKey];
          if( processedCompanies1.has(implantCompany)) continue;
          let relationId = null;
          let relatedCompanies = [];
        
          // 查找关联编号和关联公司
          for (const [id, companies] of relationMap.entries()) {
            if (companies.includes(implantCompany)) {
              relationId = id;
              relatedCompanies = companies;
              break;
            }
          }
          if(!relatedCompanies.includes(implantCompany)){
            relatedCompanies.push(implantCompany);
          }

          // 查找关联的授权公司和订货公司
          let relatedAuthCompanies = authCompanies.filter(auth => relatedCompanies.includes(auth[authCompanyKey])).map(auth => auth[authCompanyKey]);
          let relatedOrderingCompanies = relatedCompanies.filter(c => orderCompanies.some(order => order[orderCompanyKey] === c));

          // 过滤relatedCompanies中不在implantCompanies中的公司
          relatedCompanies = relatedCompanies.filter(c => implantCompanies.some(implant => implant[implantCompanyKey] === c));

          // 合并relatedCompanies中的平台
          let relatedPlatforms = relatedCompanies.map(c => implantCompanies.find(implant => implant[implantCompanyKey] === c)[implantPlatformKey]);

          // 去重relatedAuthCompanies、relatedOrderingCompanies、relatedCompanies、relatedPlatforms
          relatedAuthCompanies = [...new Set(relatedAuthCompanies)];
          relatedOrderingCompanies = [...new Set(relatedOrderingCompanies)];
          relatedCompanies = [...new Set(relatedCompanies)];
          relatedPlatforms = [...new Set(relatedPlatforms)];
          
          // 构建结果行
          const resultRow = {
            '平台': relatedPlatforms.length > 0 ? relatedPlatforms.join('/') : '#N/A',
            '植入公司': relatedCompanies.length > 0 ? relatedCompanies.join('/') : '#N/A',
            '授权公司': relatedAuthCompanies.length > 0 ? relatedAuthCompanies.join('/') : '#N/A',
            '订货公司': relatedOrderingCompanies.length > 0 ? relatedOrderingCompanies.join('/') : '#N/A',
            '关联编号': relationId || '#N/A'
          };

          resultData1.push(resultRow);
          for( const relatedCompany of relatedCompanies){
            processedCompanies1.add(relatedCompany);
          }
          
        }
         
        const resultData2 = [];
        const processedCompanies2 = new Set();

        // 以授权公司作为数据源，构造新的关联关系数据
        for (const auth of authCompanies) {
          const authCompany = auth[authCompanyKey];
          if( processedCompanies2.has(authCompany)) continue;
          let relationId = null;
          let relatedCompanies = [];

          // 查找关联编号和关联公司
          for (const [id, companies] of relationMap.entries()) {
            if (companies.includes(authCompany)) {
              relationId = id;
              relatedCompanies = companies;
              break;
            }
          }
          if(!relatedCompanies.includes(authCompany)){
            relatedCompanies.push(authCompany);
          }

          // 查找关联的植入公司和订货公司
          let relatedImplantCompanies = implantCompanies.filter(implant => relatedCompanies.includes(implant[implantCompanyKey])).map(implant => implant[implantCompanyKey]);
          let relatedOrderingCompanies = relatedCompanies.filter(c => orderCompanies.some(order => order[orderCompanyKey] === c));

          // 过滤relatedCompanies中不在authCompanies中的公司
          relatedCompanies = relatedCompanies.filter(c => authCompanies.some(auth => auth[authCompanyKey] === c));

          // 合并relatedCompanies中的平台
          let relatedPlatforms = relatedCompanies.map(c => authCompanies.find(auth => auth[authCompanyKey] === c)[authChannelKey]);

          // 去重relatedAuthCompanies、relatedOrderingCompanies、relatedCompanies、relatedPlatforms
          relatedImplantCompanies = [...new Set(relatedImplantCompanies)];
          relatedOrderingCompanies = [...new Set(relatedOrderingCompanies)];
          relatedCompanies = [...new Set(relatedCompanies)];
          relatedPlatforms = [...new Set(relatedPlatforms)];

          // 构建结果行
          const resultRow = {
            '平台': relatedPlatforms.length > 0 ? relatedPlatforms.join('/') : '#N/A',
            '授权公司': relatedCompanies.length > 0 ? relatedCompanies.join('/') : '#N/A',
            '植入公司': relatedImplantCompanies.length > 0 ? relatedImplantCompanies.join('/') : '#N/A',
            '订货公司': relatedOrderingCompanies.length > 0 ? relatedOrderingCompanies.join('/') : '#N/A',
            '关联编号': relationId || '#N/A'
          };

          resultData2.push(resultRow);
          for( const relatedCompany of relatedCompanies){
            processedCompanies2.add(relatedCompany);
          }
        }


        const resultData3 = [];
        const processedCompanies3 = new Set();

        // 以订货公司作为数据源，构造新的关联关系数据
        for (const order of orderCompanies) {
          const orderCompany = order[orderCompanyKey];
          if( processedCompanies3.has(orderCompany)) continue;
          let relationId = null;
          let relatedCompanies = [];

          // 查找关联编号和关联公司
          for (const [id, companies] of relationMap.entries()) {
            if (companies.includes(orderCompany)) {
              relationId = id;
              relatedCompanies = companies;
              break;
            }
          }
          if(!relatedCompanies.includes(orderCompany)){
            relatedCompanies.push(orderCompany);
          }

          // 查找关联的授权公司和植入公司
          let relatedAuthCompanies = authCompanies.filter(auth => relatedCompanies.includes(auth[authCompanyKey])).map(auth => auth[authCompanyKey]);
          let relatedImplantCompanies = relatedCompanies.filter(c => implantCompanies.some(implant => implant[implantCompanyKey] === c));

          // 过滤relatedCompanies中不在orderCompany中的公司
          relatedCompanies = relatedCompanies.filter(c => orderCompanies.some(order => order[orderCompanyKey] === c));
          // 合并relatedCompanies中的平台
          let relatedPlatforms = relatedCompanies.map(c => orderCompanies.find(order => order[orderCompanyKey] === c)[orderPlatformKey]);

          // 去重relatedAuthCompanies、relatedOrderingCompanies、relatedCompanies、relatedPlatforms
          relatedAuthCompanies = [...new Set(relatedAuthCompanies)];
          relatedImplantCompanies = [...new Set(relatedImplantCompanies)];
          relatedCompanies = [...new Set(relatedCompanies)];
          relatedPlatforms = [...new Set(relatedPlatforms)];

          // 构建结果行
          const resultRow = {
            '平台': relatedPlatforms.length > 0 ? relatedPlatforms.join('/') : '#N/A',
            '订货公司': relatedCompanies.length > 0 ? relatedCompanies.join('/') : '#N/A',
            '植入公司': relatedImplantCompanies.length > 0 ? relatedImplantCompanies.join('/') : '#N/A',
            '授权公司': relatedAuthCompanies.length > 0 ? relatedAuthCompanies.join('/') : '#N/A',
            '关联编号': relationId || '#N/A'
          };

          resultData3.push(resultRow);
          for( const relatedCompany of relatedCompanies){ processedCompanies3.add(relatedCompany); }
        }

        this.resultData1 = resultData1.filter(row => !(row['植入公司'] === '#N/A' && row['授权公司'] === '#N/A' && row['订货公司'] === '#N/A'));
        this.resultData2 = resultData2.filter(row => !(row['平台'] === '#N/A' && row['植入公司'] === '#N/A' && row['授权公司'] === '#N/A' && row['订货公司'] === '#N/A'));
        this.resultData3 = resultData3.filter(row => !(row['平台'] === '#N/A' && row['植入公司'] === '#N/A' && row['授权公司'] === '#N/A' && row['订货公司'] === '#N/A'));

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

    downloadExcel(resultData, name) {
      if (resultData.length === 0) {
        return;
      }
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(resultData);
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "处理结果");
      
      // 生成Excel文件并下载
      XLSX.writeFile(wb, `${name}.xlsx`);
    },
    /**
     * 全部下载
     */
    downloadAll() {
      if (this.resultData1.length > 0) {
        this.downloadExcel(this.resultData1, '植入');
      }
      if (this.resultData2.length > 0) {
        this.downloadExcel(this.resultData2, '授权');
      }
      if (this.resultData3.length > 0) {
        this.downloadExcel(this.resultData3, '订货');
      }
    }
  }
}
</script>

<style scoped>
.company-relation {
  margin-bottom: 2rem;
}
</style>
