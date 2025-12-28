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
        <el-option label="全国" value="总计"></el-option>
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
      <!-- title -->
      <div class="national-label">{{ selectedSalesManager }}</div>

      <!-- 有授权无植入统计 -->
      <div class="total-stat auth-no-implant">
        有授权无植入医院数量：{{
          analysisData[selectedSalesManager]?.authorizedNoImplant?.total || 0
        }}家，
        <span
          :class="
            analysisData[selectedSalesManager]?.authorizedNoImplant?.change > 0
              ? 'increase'
              : 'decrease'
          "
        >
          {{
            analysisData[selectedSalesManager]?.authorizedNoImplant?.change > 0
              ? "↑"
              : "↓"
          }}{{
            Math.abs(
              analysisData[selectedSalesManager]?.authorizedNoImplant?.change ||
                0
            )
          }}
        </span>
      </div>

      <!-- 有授权无植入原因流程图 -->
      <div class="flow-chart blue-flow">
        <div
          v-for="(item, index) in analysisData[selectedSalesManager]
            ?.authorizedNoImplant?.data || []"
          :key="index"
          class="flow-item"
        >
          <div>
            <div class="reason-count">
              <span
                >{{ item.count || 0 }}家
                <span
                  v-if="item.change"
                  class="reason-change"
                  :class="item.change > 0 ? 'increase' : 'decrease'"
                  >{{ item.change > 0 ? "↑" : "↓"
                  }}{{ Math.abs(item.change || 0) }}
                </span>
              </span>
            </div>
            <div class="reason-box" :class="item.change < 0 ? 'highlight' : ''">
              {{ item.reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- 有植入无授权原因流程图 -->
      <div class="flow-chart orange-flow">
        <div
          v-for="(reason, index) in analysisData[selectedSalesManager]
            ?.implantNoAuthorized?.data || []"
          :key="index"
          class="flow-item"
        >
          <div>
            <div
              class="reason-box"
              :class="reason.change < 0 ? 'highlight' : ''"
            >
              {{ reason.reason }}
            </div>
            <div class="reason-count">
              <span
                >{{ reason.count || 0 }}家
                <span
                  class="reason-change"
                  :class="reason.change > 0 ? 'increase' : 'decrease'"
                  >{{ reason.change > 0 ? "↑" : "↓"
                  }}{{ Math.abs(reason.change || 0) }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 有植入无授权统计 -->
      <div class="total-stat implant-no-auth">
        有植入无授权医院数量：{{
          analysisData[selectedSalesManager]?.implantNoAuthorized?.total || 0
        }}家，
        <span
          :class="
            analysisData[selectedSalesManager]?.implantNoAuthorized?.change > 0
              ? 'increase'
              : 'decrease'
          "
        >
          {{
            analysisData[selectedSalesManager]?.implantNoAuthorized?.change > 0
              ? "↑"
              : "↓"
          }}{{
            Math.abs(
              analysisData[selectedSalesManager]?.implantNoAuthorized?.change ||
                0
            )
          }}
        </span>
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
      selectedSalesManager: "总计",
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
      const data = {};

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
        let cell = {
          name: row[0],
          data: [],
          total: 0,
          change: 0,
        };
        for (let j = 1; j < row.length; j = j + 2) {
          cell.data.push({
            reason: firstRow[j],
            count: row[j],
            change: row[j + 1],
          });
        }
        const lastData = cell.data.pop();
        cell.total = lastData.count;
        cell.change = lastData.change;
        data[cell.name] = cell;
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
        this.analysisData = this.analyzeData(summary1Data, summary2Data);
        console.log(this.analysisData, "analysisData");

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
    extractSalesManagers(summary1Data, summary2Data) {
      // 从两个工作表中提取销售经理
      const managers1 = Object.keys(summary1Data);
      const managers2 = Object.keys(summary2Data);
      // 合并销售经理列表，去重
      this.salesManagers = [...new Set([...managers1, ...managers2])];
      console.log(this.salesManagers);
    },

    // 分析数据
    analyzeData(summary1Data, summary2Data) {
      const data = {};
      for (let saleManager of this.salesManagers) {
        data[saleManager] = {
          authorizedNoImplant: summary1Data[saleManager],
          implantNoAuthorized: summary2Data[saleManager],
        };
      }
      debugger;
      // 返回最终分析结果
      return data;
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

.national-label {
  display: block;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  background-color: white;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px 40px;
  margin-left: 50%;
  transform: translateX(-50%);
  margin-bottom: 20px;
}

/* 总统计信息 */
.total-stat {
  width: inherit;
  font-size: 18px;
  width: 350px;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: block;
}

.auth-no-implant {
  border: 2px solid rgb(79, 113, 190);
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
  width: 130px;
  height: 160px;
  background-color: white;
  border: 3px solid;
  border-radius: 18px;
  border-color: rgba(217, 217, 217);
  font-weight: bold;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

/* 高亮项样式 - 调整为更亮的黄色背景 */
.reason-box.highlight {
  background-color: rgba(255, 255, 84);
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 原因数量 - 调整字体大小和位置 */
.reason-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

/* 变化量 - 调整字体大小和显示位置 */
.reason-change {
  font-size: 16px;
  margin-bottom: 10px;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
}

/* 箭头样式 - 重新设计为更圆润的样式 */
.flow-arrow {
  display: flex;
  align-items: center;
  margin: 0 10px;
  flex-shrink: 0;
}

.arrow-line {
  height: 6px;
  width: 40px;
  position: relative;
  border-radius: 3px;
}

/* 蓝色箭头 */
.arrow-line.blue {
  background-color: #409eff;
}

/* 橙色箭头 */
.arrow-line.orange {
  background-color: #e6a23c;
}

/* 箭头头部 - 调整为更圆润的样式 */
.arrow-line::after {
  content: "";
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

.arrow-line.blue::after {
  border-left-color: #409eff;
}

.arrow-line.orange::after {
  border-left-color: #e6a23c;
}

.implant-no-auth {
  border: 2px solid #e6a23c;
  background-color: #fff7e6;
  color: #333;
}

/* 增减样式 - 调整颜色和粗细 */
.increase {
  color: rgb(79, 113, 190);
  font-weight: bold;
}

.decrease {
  color: #f56c6c;
  font-weight: bold;
}

/* 全国标签 - 调整样式 */
.national-label {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  background-color: white;
  border: 3px solid #dcdfe6;
  border-radius: 6px;
  padding: 12px 50px;
  display: inline-block;
  margin-left: 50%;
  transform: translateX(-50%);
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
