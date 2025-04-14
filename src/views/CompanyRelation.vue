<template>
  <div class="company-relation">
    <div class="header text-center">
      <h1>公司关联关系处理工具</h1>
      <p class="lead">上传Excel文件，自动处理授权公司与订货公司的关联关系</p>
    </div>

    <div class="upload-container bg-white p-4 rounded shadow-sm">
      <div class="instructions bg-light p-3 rounded mb-3">
        <h4>使用说明：</h4>
        <p>请上传包含以下三个工作表的Excel文件：</p>
        <ol>
          <li><strong>授权公司</strong> - 第一个工作表，包含授权公司列</li>
          <li><strong>订货公司</strong> - 第二个工作表，包含订货公司列</li>
          <li><strong>关联关系</strong> - 第三个工作表，包含经销商名称和关联编号列（关联编号一致的表示为关联公司）</li>
        </ol>
        <p>处理规则：</p>
        <ul>
          <li>如果授权公司A有关联公司BCD，但只有C订货，那么关联公司只写C</li>
          <li>如果授权公司A有关联公司BCD，BC都有订货，就写B/C</li>
          <li>如果授权公司A有关联公司BCD，但都没有订货，就写无</li>
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
              <th>授权公司</th>
              <th>关联公司</th>
              <th>授权公司是否订货</th>
              <th>关联公司是否订货</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in resultData" :key="index">
              <td>{{ row['授权公司'] }}</td>
              <td>{{ row['关联公司'] }}</td>
              <td>{{ row['授权公司是否订货'] }}</td>
              <td>{{ row['关联公司是否订货'] }}</td>
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
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 确保有三个工作表
          if (workbook.SheetNames.length < 3) {
            throw new Error('Excel文件必须包含至少三个工作表');
          }
          
          // 读取三个工作表
          const authSheet = workbook.Sheets[workbook.SheetNames[0]];
          const orderSheet = workbook.Sheets[workbook.SheetNames[1]];
          const relationSheet = workbook.Sheets[workbook.SheetNames[2]];
          
          // 转换为JSON
          const authCompanies = XLSX.utils.sheet_to_json(authSheet);
          const orderCompanies = XLSX.utils.sheet_to_json(orderSheet);
          const relations = XLSX.utils.sheet_to_json(relationSheet);
          
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
          this.processData(authCompanies, orderCompanies, relations);
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
    processData(authCompanies, orderCompanies, relations) {
      try {
        // 找到实际的列名（可能有前缀或后缀）
        const authCompanyKey = this.findKey(authCompanies[0], '授权公司');
        const orderCompanyKey = this.findKey(orderCompanies[0], '订货公司');
        const dealerNameKey = this.findKey(relations[0], '经销商名称');
        const relationIdKey = this.findKey(relations[0], '关联编号');
        
        // 获取所有授权公司
        const authCompanyList = [...new Set(authCompanies.map(item => item[authCompanyKey]))];
        
        // 获取所有订货公司
        const orderCompanyList = [...new Set(orderCompanies.map(item => item[orderCompanyKey]))];
        
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
        
        // 处理每个授权公司
        for (const authCompany of authCompanyList) {
          // 查找该授权公司的所有关联公司
          let relatedCompanies = [];
          
          // 从关联关系表中查找关联公司
          for (const [relationId, companies] of relationMap.entries()) {
            if (companies.includes(authCompany)) {
              // 添加同一关联编号下的其他公司
              relatedCompanies = relatedCompanies.concat(
                companies.filter(c => c !== authCompany)
              );
            }
          }
          
          // 去重
          relatedCompanies = [...new Set(relatedCompanies)];
          
          // 找出关联公司中有订货的公司
          const orderingRelatedCompanies = relatedCompanies.filter(company => 
            orderCompanyList.includes(company)
          );
          
          // 根据规则确定订货关联公司字段
          let orderingRelatedCompanyStr;
          if (orderingRelatedCompanies.length === 0) {
            orderingRelatedCompanyStr = "否";
          } else {
            orderingRelatedCompanyStr = orderingRelatedCompanies.join('/');
          }
          
          // 判断授权公司是否订货
          const isAuthOrdering = orderCompanyList.includes(authCompany) ? "是" : "否";
          
          // 关联公司列表字符串
          const relatedCompaniesStr = relatedCompanies.length > 0 ? relatedCompanies.join('/') : "无";
          
          // 添加到结果中
          this.resultData.push({
            '授权公司': authCompany,
            '关联公司': relatedCompaniesStr,
            '授权公司是否订货': isAuthOrdering,
            '关联公司是否订货': orderingRelatedCompanyStr
          });
        }
        
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