<template>
  <ToolPage
    title="医院有无授权&植入原因分析"
    description="解析Excel文件，按销售经理维度分析医院授权与植入情况"
  >
    <template #actions>
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
          <div class="el-upload__tip">请选择包含医院授权和植入数据的Excel文件</div>
        </template>
      </el-upload>
      <el-button type="success" :disabled="!selectedFile" @click="processFile">
        处理文件
      </el-button>
      <el-button type="info" :disabled="!selectedSalesManager" @click="exportToImage">
        导出为图片
      </el-button>
      <el-button type="warning" :disabled="salesManagers.length === 0" @click="exportAllToImage">
        批量导出所有销售经理图片
      </el-button>
      <el-select
        v-if="salesManagers.length > 0"
        v-model="selectedSalesManager"
        placeholder="请选择销售经理"
        clearable
        class="manager-select"
        @change="handleSalesManagerChange"
      >
        <el-option
          v-for="manager in salesManagers"
          :key="manager"
          :label="manager"
          :value="manager"
        />
      </el-select>
    </template>

    <template #result v-if="selectedSalesManager">
    <div class="analysis-result">
      <div class="national-label">{{ selectedSalesManager }}</div>

      <div class="total-stat auth-no-implant">
        有授权无植入医院数量：{{
          analysisData[selectedSalesManager]?.authorizedNoImplant?.total || 0
        }}家
        <span
          v-if="analysisData[selectedSalesManager]?.authorizedNoImplant?.change"
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

      <div class="flow-scroll">
        <div class="flow-chart blue-flow">
          <div class="flow-arrow">
            <div class="arrow-line blue"></div>
          </div>
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
      </div>

      <div class="flow-scroll">
        <div class="flow-chart orange-flow">
          <div class="flow-arrow flow-arrow--orange">
            <div class="arrow-line orange"></div>
          </div>
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
                    v-if="reason.change"
                    :class="reason.change > 0 ? 'increase' : 'decrease'"
                    >{{ reason.change > 0 ? "↑" : "↓"
                    }}{{ Math.abs(reason.change || 0) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="total-stat implant-no-auth">
        有植入无授权医院数量：{{
          analysisData[selectedSalesManager]?.implantNoAuthorized?.total || 0
        }}家
        <span
          v-if="analysisData[selectedSalesManager]?.implantNoAuthorized?.change"
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
    </template>
  </ToolPage>
</template>

<script>
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import ToolPage from "../components/ToolPage.vue";

export default {
  name: "HospitalAuthAnalysis",
  components: { ToolPage },
  data() {
    return {
      selectedFile: null,
      analysisData: null,
      salesManagers: [],
      selectedSalesManager: "",
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
        if (!Array.isArray(row) || row.length === 0) continue;
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
      // 返回最终分析结果
      return data;
    },

    // 导出为图片
    async exportToImage() {
      if (!this.selectedSalesManager) {
        this.$message.error("请先选择销售经理");
        return;
      }

      this.$message.info("正在生成图片...");

      try {
        // 获取要截图的元素
        const element = document.querySelector(".analysis-result");
        if (!element) {
          throw new Error("未找到要截图的元素");
        }

        // 配置html2canvas选项
        const options = {
          scale: 2, // 提高清晰度
          useCORS: true,
          backgroundColor: "#ffffff",
          allowTaint: false,
          logging: false,
          windowWidth: element.scrollWidth + 30, // 向左扩展30px
          windowHeight: element.scrollHeight,
          x: -30, // 向左偏移30px开始截图
          y: 0,
          width: element.offsetWidth + 30, // 增加30px宽度包含向左扩展区域
          height: element.offsetHeight,
        };

        // 生成canvas
        const canvas = await html2canvas(element, options);

        // 转换为图片并下载
        const link = document.createElement("a");
        link.download = `${this.selectedSalesManager}_医院分析报告_${new Date()
          .toLocaleDateString("zh-CN")
          .replace(/\//g, "-")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        this.$message.success("图片导出成功！");
      } catch (error) {
        console.error("导出图片失败:", error);
        this.$message.error("图片导出失败，请重试！");
      }
    },

    // 批量导出所有销售经理图片
    async exportAllToImage() {
      if (this.salesManagers.length === 0) {
        this.$message.error("暂无销售经理数据");
        return;
      }

      this.$message.info(
        `开始批量导出${this.salesManagers.length}个销售经理的数据...`
      );
      const originalSelectedManager = this.selectedSalesManager;
      let successCount = 0;
      let failCount = 0;

      try {
        for (const manager of this.salesManagers) {
          // 选择当前销售经理
          this.selectedSalesManager = manager;
          // 等待DOM更新
          await this.$nextTick();

          // 获取要截图的元素
          const element = document.querySelector(".analysis-result");
          if (!element) {
            failCount++;
            continue;
          }

          // 配置html2canvas选项
          const options = {
            scale: 2, // 提高清晰度
            useCORS: true,
            backgroundColor: "#ffffff",
            allowTaint: false,
            logging: false,
            windowWidth: element.scrollWidth + 30, // 向左扩展30px
            windowHeight: element.scrollHeight,
            x: -30, // 向左偏移30px开始截图
            y: 0,
            width: element.offsetWidth + 30, // 增加30px宽度包含向左扩展区域
            height: element.offsetHeight,
          };

          // 生成canvas
          const canvas = await html2canvas(element, options);

          // 转换为图片并下载
          const link = document.createElement("a");
          link.download = `${manager}_医院分析报告_${new Date()
            .toLocaleDateString("zh-CN")
            .replace(/\//g, "-")}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();

          successCount++;
          // 短暂延迟，避免浏览器下载请求过于频繁
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        this.$message.success(
          `批量导出完成！成功：${successCount}个，失败：${failCount}个`
        );
      } catch (error) {
        console.error("批量导出图片失败:", error);
        this.$message.error(
          `批量导出失败，已成功导出${successCount}个销售经理的数据`
        );
      } finally {
        // 恢复原始选择的销售经理
        this.selectedSalesManager = originalSelectedManager;
      }
    },
  },
};
</script>

<style scoped>
.manager-select {
  width: 200px;
}

.analysis-result {
  margin-top: 8px;
}

.national-label {
  display: block;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  background-color: #fff;
  border: 2px solid var(--app-border, #dcdfe6);
  border-radius: 6px;
  padding: 12px 40px;
  width: fit-content;
  margin: 0 auto 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.total-stat {
  font-size: 18px;
  width: 380px;
  max-width: 100%;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: block;
  box-sizing: border-box;
}

.auth-no-implant {
  border: 3px solid #409eff;
  color: #303133;
}

.implant-no-auth {
  border: 3px solid #e6a23c;
  color: #303133;
}

.flow-scroll {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 24px;
  padding-bottom: 8px;
}

.flow-chart {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 900px;
  gap: 8px;
}

.flow-item {
  z-index: 2;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 140px;
}

.reason-box {
  width: 140px;
  height: 200px;
  background-color: #fff;
  border: 3px solid #dcdfe6;
  border-radius: 18px;
  font-weight: 800;
  font-size: 18px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  box-sizing: border-box;
}

.reason-box.highlight {
  background-color: #fdf6ec;
  border-color: #e6a23c;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
}

.reason-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 5px;
  color: #303133;
}

.reason-change {
  font-size: 16px;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
}

.flow-arrow {
  position: absolute;
  top: 100px;
  left: 0;
  right: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.flow-arrow--orange {
  top: 70px;
}

.arrow-line {
  height: 24px;
  width: 100%;
  position: relative;
  border-radius: 3px;
}

.arrow-line.blue {
  background-color: #409eff;
}

.arrow-line.orange {
  background-color: #e6a23c;
}

.arrow-line::after {
  content: "";
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 24px solid;
  border-top: 24px solid transparent;
  border-bottom: 24px solid transparent;
}

.arrow-line.blue::after {
  border-left-color: #409eff;
}

.arrow-line.orange::after {
  border-left-color: #e6a23c;
}

.increase {
  color: #409eff;
  font-weight: 700;
}

.decrease {
  color: #f56c6c;
  font-weight: 700;
}
</style>
