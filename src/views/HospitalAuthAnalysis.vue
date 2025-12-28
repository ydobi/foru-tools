<template>
  <div class="hospital-auth-analysis">
    <h1>医院有无授权&植入原因分析</h1>

    <!-- 文件上传区域 -->
    <div class="upload-section">
      <el-upload
        ref="upload"
        action="#"
        accept=".xlsx,.xls"
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="true"
      >
        <el-button type="primary">选择Excel文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            请选择包含医院授权和植入数据的Excel文件
          </div>
        </template>
      </el-upload>
      <el-button
        type="success"
        :disabled="!selectedFile"
        @click="processFile"
        style="margin-left: 10px"
      >
        处理文件
      </el-button>
    </div>

    <!-- 销售经理选择器 -->
    <div class="filter-section" v-if="salesManagers.length > 0">
      <el-select
        v-model="selectedSalesManager"
        placeholder="请选择销售经理"
        clearable
        style="width: 200px"
        @change="handleSalesManagerChange"
      >
        <el-option label="全国" value="全国"></el-option>
        <el-option
          v-for="manager in salesManagers"
          :key="manager"
          :label="manager"
          :value="manager"
        >
        </el-option>
      </el-select>
    </div>

    <!-- 数据分析结果 -->
    <div class="analysis-result" v-if="analysisData">
      <!-- 全国标签 -->
      <div class="national-label">全国</div>

      <!-- 有授权无植入统计 -->
      <div class="total-stat auth-no-implant">
        有授权无植入医院数量：{{ analysisData.authorizedNoImplant.total }}家，
        <span
          :class="
            analysisData.authorizedNoImplant.change > 0
              ? 'increase'
              : 'decrease'
          "
        >
          {{ analysisData.authorizedNoImplant.change > 0 ? "↑" : "↓"
          }}{{ Math.abs(analysisData.authorizedNoImplant.change) }}
        </span>
      </div>

      <!-- 有授权无植入原因流程图 -->
      <div class="flow-chart blue-flow">
        <div
          v-for="(reason, index) in analysisData.authorizedNoImplant.reasons"
          :key="index"
          class="flow-item"
        >
          <div class="reason-box" :class="reason.highlight ? 'highlight' : ''">
            <div class="reason-count">{{ reason.count }}家</div>
            <div
              class="reason-change"
              :class="reason.change > 0 ? 'increase' : 'decrease'"
            >
              {{ reason.change > 0 ? "↑" : "↓" }}{{ Math.abs(reason.change) }}
            </div>
            <div class="reason-desc">{{ reason.description }}</div>
          </div>
          <div
            class="flow-arrow"
            v-if="index < analysisData.authorizedNoImplant.reasons.length - 1"
          >
            <div class="arrow-line blue"></div>
          </div>
        </div>
      </div>

      <!-- 有植入无授权统计 -->
      <div class="total-stat implant-no-auth">
        有植入无授权医院数量：{{ analysisData.implantNoAuthorized.total }}家，
        <span
          :class="
            analysisData.implantNoAuthorized.change > 0
              ? 'increase'
              : 'decrease'
          "
        >
          {{ analysisData.implantNoAuthorized.change > 0 ? "↑" : "↓"
          }}{{ Math.abs(analysisData.implantNoAuthorized.change) }}
        </span>
      </div>

      <!-- 有植入无授权原因流程图 -->
      <div class="flow-chart orange-flow">
        <div
          v-for="(reason, index) in analysisData.implantNoAuthorized.reasons"
          :key="index"
          class="flow-item"
        >
          <div class="reason-box" :class="reason.highlight ? 'highlight' : ''">
            <div class="reason-count">{{ reason.count }}家</div>
            <div
              class="reason-change"
              :class="reason.change > 0 ? 'increase' : 'decrease'"
            >
              {{ reason.change > 0 ? "↑" : "↓" }}{{ Math.abs(reason.change) }}
            </div>
            <div class="reason-desc">{{ reason.description }}</div>
          </div>
          <div
            class="flow-arrow"
            v-if="index < analysisData.implantNoAuthorized.reasons.length - 1"
          >
            <div class="arrow-line orange"></div>
          </div>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="remarks">
        <h3>备注：</h3>
        <ol>
          <li>截止到11月5日FY50期授权；</li>
          <li>FY50 7月-10月植入；</li>
          <li>授权与植入医院匹配时不分品类。</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";

export default {
  name: "HospitalAuthAnalysis",
  data() {
    return {
      selectedFile: null,
      analysisData: null,
      salesManagers: [],
      selectedSalesManager: "全国",
      rawData: [],
    };
  },
  methods: {
    // 处理文件选择
    handleFileChange(file) {
      this.selectedFile = file.raw;
    },

    // 解析
    processSummaryData(summarySheet) {
      const data = [];

      // 取summarySheet第一行数据
      const firstRow = XLSX.utils.sheet_to_json(summarySheet, {
        header: 1,
      })[0];
      // 获取取summarySheet行数
      const jsonData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
      const rowCount = jsonData.length;
      // 遍历取summarySheet第二行到最后一行数据
      for (let i = 1; i < rowCount; i++) {
        const row = XLSX.utils.sheet_to_json(summarySheet, {
          header: 1,
        })[i];
        console.log(row);
        let cell = {
          name: row[0],
          data: [],
        };
        for (let j = 1; j < row.length; j = j + 2) {
          cell.data.push({
            reason: firstRow[j],
            count: row[j],
            change: row[j + 1],
          });
        }
        data.push(cell);
      }
      return data;
    },

    // 处理文件解析
    async processFile() {
      if (!this.selectedFile) return;

      this.$message.info("正在解析文件...");

      try {
        // 读取文件
        const data = await this.readFile(this.selectedFile);
        // 解析Excel
        const workbook = XLSX.read(data, { type: "binary" });
        // 读取汇总1和汇总2的数据

        // 尝试查找汇总1和汇总2工作表，支持不同的命名方式
        let summary1Sheet = null;
        let summary2Sheet = null;

        for (const sheetName of workbook.SheetNames) {
          const lowerSheetName = sheetName.toLowerCase();
          if (
            lowerSheetName.includes("summary1") ||
            lowerSheetName.includes("汇总1")
          ) {
            summary1Sheet = workbook.Sheets[sheetName];
          } else if (
            lowerSheetName.includes("summary2") ||
            lowerSheetName.includes("汇总2")
          ) {
            summary2Sheet = workbook.Sheets[sheetName];
          }
        }

        if (!summary1Sheet || !summary2Sheet) {
          throw new Error("未找到汇总1和汇总2工作表，请检查文件格式！");
        }

        // 解析两个工作表的数据
        const summary1Data = this.processSummaryData(summary1Sheet);
        const summary2Data = this.processSummaryData(summary2Sheet);

        // 保存原始数据
        this.rawData = { summary1: summary1Data, summary2: summary2Data };
        // 提取销售经理列表
        this.extractSalesManagers(summary1Data, summary2Data);
        // 分析数据
        this.analysisData = this.analyzeData(
          summary1Data,
          summary2Data,
          this.selectedSalesManager
        );

        this.$message.success("文件解析完成！");
      } catch (error) {
        console.error("文件解析错误:", error);
        this.$message.error("文件解析失败，请检查文件格式！");
      }
    },

    // 读取文件
    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsBinaryString(file);
      });
    },

    // 提取销售经理列表
    extractSalesManagers(summary1Data, summary2Data) {},

    // 销售经理选择变化
    handleSalesManagerChange() {
      const { summary1, summary2 } = this.rawData;
      this.analysisData = this.analyzeData(
        summary1,
        summary2,
        this.selectedSalesManager
      );
    },

    // 分析数据
    analyzeData(summary1Data, summary2Data, salesManager) {
      // 返回最终分析结果
      return {
        authorizedNoImplant: null,
        implantNoAuthorized: null,
      };
    },
  },
};
</script>

<style scoped>
.hospital-auth-analysis {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.upload-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.filter-section {
  margin-bottom: 30px;
}

.analysis-result {
  margin-top: 20px;
}

/* 全国标签 */
.national-label {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  background-color: white;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px 40px;
  display: inline-block;
  margin-left: 50%;
  transform: translateX(-50%);
  margin-bottom: 20px;
}

/* 总统计信息 */
.total-stat {
  font-size: 18px;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: inline-block;
}

.auth-no-implant {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
  color: #333;
}

.implant-no-auth {
  background-color: #fff7e6;
  border: 1px solid #fff0cc;
  color: #333;
}

/* 流程图表 */
.flow-chart {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
  flex-wrap: wrap;
  position: relative;
}

/* 流程项 */
.flow-item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 150px;
}

/* 原因盒子 */
.reason-box {
  background-color: white;
  border: 2px solid;
  border-radius: 8px;
  padding: 15px;
  width: 100%;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 蓝色流程样式 */
.blue-flow .reason-box {
  border-color: #409eff;
}

/* 橙色流程样式 */
.orange-flow .reason-box {
  border-color: #e6a23c;
}

/* 高亮项样式 */
.reason-box.highlight {
  background-color: #fff3cd;
  border-color: #ffeeba;
  font-weight: bold;
}

/* 原因数量 */
.reason-count {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

/* 变化量 */
.reason-change {
  font-size: 14px;
  margin-bottom: 10px;
}

/* 原因描述 */
.reason-desc {
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  word-break: break-word;
}

/* 箭头样式 */
.flow-arrow {
  display: flex;
  align-items: center;
  margin: 0 10px;
  flex-shrink: 0;
}

.arrow-line {
  height: 4px;
  width: 40px;
  position: relative;
}

/* 蓝色箭头 */
.arrow-line.blue {
  background-color: #409eff;
}

/* 橙色箭头 */
.arrow-line.orange {
  background-color: #e6a23c;
}

/* 箭头头部 */
.arrow-line::after {
  content: "";
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.arrow-line.blue::after {
  border-left-color: #409eff;
}

.arrow-line.orange::after {
  border-left-color: #e6a23c;
}

/* 增减样式 */
.increase {
  color: #67c23a;
}

.decrease {
  color: #f56c6c;
}

/* 备注信息 */
.remarks {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
  font-size: 14px;
}

.remarks h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
}

.remarks ol {
  padding-left: 20px;
  color: #606266;
}

.remarks li {
  margin-bottom: 5px;
}
</style>
