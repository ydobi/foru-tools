<template>
  <div class="order-achievement-analysis">
    <h1>订货达成率异常分析</h1>

    <!-- 顶部区域：文件上传和筛选器 -->
    <div class="header-section">
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
              请选择包含订货达成率异常原因分析数据的Excel文件
            </div>
          </template>
        </el-upload>
        <el-button
          type="success"
          :disabled="!selectedFile"
          @click="processFile"
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
          <el-option
            v-for="manager in salesManagers"
            :key="manager"
            :label="manager"
            :value="manager"
          >
          </el-option>
        </el-select>
        <el-button
          type="info"
          :disabled="!selectedSalesManager"
          @click="exportToImage"
        >
          导出为图片
        </el-button>
        <el-button
          type="warning"
          :disabled="salesManagers.length === 0"
          @click="exportAllToImage"
        >
          批量导出所有销售经理图片
        </el-button>
      </div>
    </div>

    <!-- 选中的销售经理名称 -->
    <div class="selected-manager" v-if="selectedSalesManager">
      <h3>{{ selectedSalesManager }}</h3>
    </div>
    <div class="analysis-result-container">
      <!-- 数据分析结果 -->
      <div
        class="analysis-result"
        v-if="selectedSalesManager && chartsData.length > 0"
      >
        <!-- 每个产品一个图表，横向排列 -->
        <div
          v-for="(chart, index) in chartsData"
          :key="index"
          class="chart-wrapper"
        >
          <div class="css-chart-container">
            <h2 class="product-title">
              {{ chart.productName }}
              合计{{ chart.total || 0 }}家
              <span
                v-if="chart.change"
                :class="chart.change > 0 ? '' : 'decrease'"
              >
                {{ chart.change > 0 ? "↑" : "↓"
                }}{{ Math.abs(chart.change || 0) }}
              </span>
            </h2>

            <!-- CSS 柱状图 -->
            <div
              class="css-chart"
              :style="{
                backgroundColor: chart.bgColor, // 背景色
                height: `${chart.containerHeight}px`, // 比例计算高度，基于total最大值
              }"
            >
              <!-- 柱子容器 -->
              <div class="chart-bars">
                <div
                  v-for="(reason, reasonIndex) in chart.reasons"
                  :key="reasonIndex"
                  class="bar-item"
                >
                  <!-- 柱子 -->
                  <div class="bar-wrapper">
                    <div
                      class="bar"
                      :style="{
                        height: `${reason.height}px`, // 比例计算高度，最大值不超过200px
                        backgroundColor: chart.color,
                        opacity: 1 - reasonIndex * 0.1, // 透明度渐变
                      }"
                    >
                      <div
                        class="bar-value"
                        :style="{
                          marginTop:
                            chart.containerHeight === reason.height
                              ? '30px'
                              : '2px',
                        }"
                      >
                        {{ reason.value }}
                      </div>
                    </div>
                  </div>
                  <!-- 原因标签 -->
                  <div class="bar-label">
                    {{ reason.reasonName }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

export default {
  name: "OrderAchievementAnalysis",
  data() {
    return {
      selectedFile: null,
      analysisData: [],
      salesManagers: [],
      selectedSalesManager: "",
      rawData: {},
      chartsData: [],
      chartHeight: 150,
    };
  },
  methods: {
    // 处理文件选择
    handleFileChange(file) {
      this.selectedFile = file.raw;
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

    // 解析透视表数据
    processPivotTable(sheet) {
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      return jsonData;
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

        // 获取所有工作表
        const sheetNames = workbook.SheetNames;
        console.log("工作表名称:", sheetNames);

        // 解析三个透视表
        const data1 = this.processPivotTable(workbook.Sheets[sheetNames[0]]);
        const data2 = this.processPivotTable(workbook.Sheets[sheetNames[1]]);

        // 保存原始数据:data1为第一个透视表数据，data2为上个月对比数据
        this.rawData = {
          pivotData: data1,
          orderData: data2,
        };

        // 数据处理，构造表格数据
        this.processData();

        // 提取销售经理列表
        this.extractSalesManagers(this.rawData.pivotData);

        //

        // 初始化图表数据
        this.$message.success("文件解析完成！");
      } catch (error) {
        console.error("文件解析错误:", error);
        this.$message.error("文件解析失败，请检查文件格式！");
      }
    },

    // 数据处理，构造表格数据
    processData() {
      // 从rawData中获取数据
      const pivotData = this.rawData.pivotData || [];
      const orderData = this.rawData.orderData || [];

      // 按销售经理分组
      const managerMap = new Map();

      // 处理pivotData - 销售经理姓名、产品名称、原因、数量
      for (let i = 1; i < pivotData.length; i++) {
        const row = pivotData[i];
        if (!row || row.length < 4) continue;

        const managerName = row[0];
        const productName = row[1];
        const reasonName = row[2];
        const value = parseInt(row[3]) || 0;

        // 初始化销售经理数据
        if (!managerMap.has(managerName)) {
          managerMap.set(managerName, {
            name: managerName,
            data: [],
          });
        }
        const manager = managerMap.get(managerName);

        // 查找或创建产品数据
        let product = manager.data.find((p) => p.productName === productName);
        if (!product) {
          product = {
            productName: productName,
            reasons: [],
          };
          manager.data.push(product);
        }

        // 添加原因数据
        product.reasons.push({
          reasonName: reasonName,
          value: value,
          change: 0, // 初始化为0，后续从orderData中更新
        });

        // 计算产品合计数量
        product.total = (product.total || 0) + value;
      }

      // 处理orderData - 销售经理姓名、产品名称、产品数量、对比上月变化
      for (let i = 1; i < orderData.length; i++) {
        const row = orderData[i];
        if (!row || row.length < 4) continue;

        const managerName = row[0];
        const productName = row[1];
        const change = parseInt(row[3]) || 0;

        // 查找销售经理
        const manager = managerMap.get(managerName);
        if (!manager) continue;

        // 查找产品
        const product = manager.data.find((p) => p.productName === productName);
        if (!product) continue;

        // 更新产品下所有原因的change值
        product.reasons.forEach((reason) => {
          reason.change = change;
        });
      }

      // 转换为数组
      this.analysisData = managerMap;
      console.log("构造的数据结构:", this.analysisData);
    },

    // 提取销售经理列表
    extractSalesManagers(pivotData) {
      // 从透视表中提取销售经理，这里需要根据实际Excel结构调整
      // 假设销售经理在第一列，从第二行开始
      const managers = new Set();

      // 从透视表中提取销售经理
      if (pivotData && pivotData.length > 1) {
        // 从第二行开始遍历第一列
        for (let i = 1; i < pivotData.length; i++) {
          const manager = pivotData[i][0];
          if (manager && typeof manager === "string" && manager.trim() !== "") {
            managers.add(manager);
          }
        }
      }

      this.salesManagers = Array.from(managers).sort();
      console.log("销售经理列表:", this.salesManagers);
    },

    // 销售经理选择变化
    handleSalesManagerChange() {
      if (this.selectedSalesManager) {
        this.generateChartsData();
      }
    },

    // 生成图表数据
    generateChartsData() {
      // 清空之前的图表数据
      this.chartsData = [];

      console.log("当前analysisData:", this.analysisData);
      console.log("当前选中的销售经理:", this.selectedSalesManager);

      // 从analysisData中获取当前销售经理的数据
      const managerData = this.analysisData.get(this.selectedSalesManager);

      console.log("找到的销售经理数据:", managerData);

      if (managerData) {
        // 交替使用蓝色和橙色主题色
        const themeColors = [
          "#2C4D76", // 蓝色
          "#B86029", // 橙色
        ];

        // 交替使用背景色
        const backgroundColors = [
          "rgb(165, 194, 227)", // 浅蓝色背景
          "rgb(241, 205, 177)", // 浅橙色背景
        ];

        // 先收集所有产品的所有原因值和total值，计算全局最大值
        let allValues = [];
        let allTotals = [];
        managerData.data.forEach((product) => {
          const values = product.reasons.map((r) => r.value);
          allValues = [...allValues, ...values];
          allTotals.push(product.total || 0);
        });
        // 计算全局最大值，确保至少为1
        const globalMaxValue = Math.max(...allValues, 1);
        // 计算total最大值，确保至少为1
        const totalMaxValue = Math.max(...allTotals, 1);

        // 遍历每个产品
        managerData.data.forEach((product, index) => {
          console.log("处理产品:", product);

          // 使用主题色
          const color = themeColors[index % themeColors.length];
          // 使用背景色
          const bgColor = backgroundColors[index % backgroundColors.length];

          // 获取产品合计数量和变化
          const total = product.total || 0;
          // 取第一个原因的change作为产品的增减变化（假设所有原因的change相同）
          const change =
            product.reasons.length > 0 ? product.reasons[0].change : 0;

          console.log("产品原因:", product.reasons);
          console.log("产品合计:", total);
          console.log("产品变化:", change);
          console.log("全局最大值:", globalMaxValue);

          // 创建图表数据，使用全局最大值
          const chartData = {
            productName: product.productName,
            reasons: product.reasons.map((reason) => ({
              ...reason,
              height: (reason.value / globalMaxValue) * this.chartHeight,
            })), // 直接使用原因对象数组
            total: total,
            change: change,
            color: color, // 添加主题色
            bgColor: bgColor, // 添加背景色
            maxValue: globalMaxValue, // 使用全局最大值
            totalMax: totalMaxValue, // 添加total最大值
            containerHeight: (total / globalMaxValue) * this.chartHeight,
          };

          this.chartsData.push(chartData);
        });
      } else {
        console.log("未找到销售经理数据");
      }

      console.log("最终图表数据:", this.chartsData);
    },

    // 导出为图片 - 参考HospitalAuthAnalysis.vue实现
    async exportToImage() {
      if (!this.selectedSalesManager) {
        this.$message.error("请先选择销售经理");
        return;
      }

      this.$message.info("正在生成图片...");

      try {
        // 获取要截图的元素
        const element = document.querySelector(".analysis-result-container");
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
          windowHeight: element.scrollHeight + 90, // 向下扩展90px
          x: -30, // 向左偏移30px开始截图
          y: 0,
          width: element.offsetWidth + 30, // 增加30px宽度包含向左扩展区域
          height: element.offsetHeight + 90, // 向下扩展90px
        };

        // 生成canvas
        const canvas = await html2canvas(element, options);

        // 转换为图片并下载
        const link = document.createElement("a");
        link.download = `${
          this.selectedSalesManager
        }_订货达成率分析_${new Date()
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

    // 批量导出所有销售经理图片 - 参考HospitalAuthAnalysis.vue实现
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
          // 生成图表数据
          this.generateChartsData();
          // 等待图表数据生成和DOM更新
          await this.$nextTick();

          // 获取要截图的元素
          const element = document.querySelector(".analysis-result-container");
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
            windowHeight: element.scrollHeight + 90, // 向下扩展90px
            x: -30, // 向左偏移30px开始截图
            y: 0,
            width: element.offsetWidth + 30, // 增加30px宽度包含向左扩展区域
            height: element.offsetHeight + 90, // 向下扩展90px
          };

          // 生成canvas
          const canvas = await html2canvas(element, options);

          // 转换为图片并下载
          const link = document.createElement("a");
          link.download = `${manager}_订货达成率分析_${new Date()
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
        // 重新生成原始销售经理的图表数据
        this.generateChartsData();
      }
    },
  },
};
</script>

<style scoped>
.order-achievement-analysis {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.upload-section {
  margin-bottom: 0;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-section {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-manager {
  text-align: center;
  margin-bottom: 30px;
}

.selected-manager h3 {
  color: #333;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 8px;
  display: inline-block;
}

.analysis-result {
  margin-top: 20px;
  white-space: nowrap;
  padding-bottom: 20px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  justify-content: center;
  padding: 0 10px;
}

.chart-wrapper {
  display: inline-block;
  vertical-align: bottom;
  margin-right: 10px;
  width: auto;
}

.css-chart-container {
  margin-bottom: 30px;
  padding: 10px;
  background-color: transparent;
  border-radius: 8px;
  width: auto; /* 根据内容自适应宽度 */
  min-width: 120px; /* 设置最小宽度 */
  text-align: center;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.product-title {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
  font-weight: bold;
  white-space: normal;
  line-height: 1.2;
}

.chart-header {
  position: relative;
  margin-bottom: 10px;
  height: 40px;
}

.export-btn {
  position: absolute;
  top: 0;
  right: 10px;
  z-index: 2;
  font-size: 12px;
  padding: 4px 8px;
}

.css-chart {
  /* width: 100%; */
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  padding: 0 5px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 5px; /* 更小的间距 */
  height: auto;
  /* min-height: 180px; */
  position: relative;
  transform: translateY(90px);
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 40px;
}

.bar-wrapper {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
  position: relative;
}

.bar {
  width: 40px; /* 调整柱子宽度 */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.bar-value {
  color: #333;
  font-size: 12px;
  font-weight: bold;
  margin-top: -5px;
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
}

.bar-label {
  color: #666;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  line-height: 14px; /* 调整行高 */
  writing-mode: vertical-rl; /* 从上往下书写 */
  text-orientation: upright; /* 文字直立 */
  width: auto;
  height: 80px;
  white-space: nowrap;
  margin-top: 5px;
  display: flex;
}

/* 增减变化样式 */
.increase {
  color: #52c41a; /* 绿色表示增加 */
  font-weight: bold;
}

.decrease {
  color: #f5222d; /* 红色表示减少 */
  font-weight: bold;
}
.analysis-result-container {
  width: 100%;
  height: 100%;
  padding: 10px;
  /* height: 100vh; */
}
</style>
