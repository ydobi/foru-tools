<template>
  <div class="order-achievement-analysis">
    <h1>订货达成率异常分析</h1>

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
    <div
      class="analysis-result"
      v-if="selectedSalesManager && chartsData.length > 0"
    >
      <!-- 每个产品一个图表 -->
      <div
        v-for="(chart, index) in chartsData"
        :key="index"
        class="chart-container"
      >
        <h2>{{ chart.productName }}</h2>
        <div
          :ref="(el) => (chartRefs[index] = el)"
          class="chart"
          :style="{ width: '100%', height: '400px' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";
// echarts 通过 CDN 引入，直接使用全局对象

export default {
  name: "OrderAchievementAnalysis",
  data() {
    return {
      selectedFile: null,
      analysisData: null,
      salesManagers: [],
      selectedSalesManager: "",
      rawData: {},
      chartsData: [],
      chartRefs: [],
      charts: [],
    };
  },
  beforeUnmount() {
    // 销毁所有图表实例
    this.charts.forEach((chart) => chart.dispose());
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
      this.analysisData = Array.from(managerMap.values());
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
      // 清空之前的图表
      this.charts.forEach((chart) => chart.dispose());
      this.charts = [];
      this.chartsData = [];

      // 从analysisData中获取当前销售经理的数据
      const managerData = this.analysisData.find(
        (item) => item.name === this.selectedSalesManager
      );

      if (managerData) {
        // 遍历每个产品
        managerData.data.forEach((product) => {
          // 提取所有原因和对应数量
          const reasons = product.reasons.map((reason) => reason.reasonName);
          const values = product.reasons.map((reason) => reason.value);

          // 创建图表数据
          const chartData = {
            productName: product.productName,
            reasons: reasons,
            values: values,
          };

          this.chartsData.push(chartData);
        });
      }

      // 等待DOM更新后初始化图表
      this.$nextTick(() => {
        this.initCharts();
      });
    },

    // 初始化图表
    initCharts() {
      this.chartsData.forEach((chartData, index) => {
        const chartDom = this.chartRefs[index];
        if (chartDom && window.echarts) {
          const chart = window.echarts.init(chartDom);
          this.charts.push(chart);

          // 配置图表
          const option = {
            tooltip: {
              trigger: "axis",
              axisPointer: {
                type: "shadow",
              },
            },
            legend: {
              data: chartData.reasons,
            },
            grid: {
              left: "3%",
              right: "4%",
              bottom: "3%",
              containLabel: true,
            },
            xAxis: {
              type: "category",
              data: ["订货达成率异常"],
            },
            yAxis: {
              type: "value",
            },
            series: chartData.reasons.map((reason, i) => {
              return {
                name: reason,
                type: "bar",
                stack: "total",
                emphasis: {
                  focus: "series",
                },
                itemStyle: {
                  opacity: 0.7 + i * 0.1, // 不同原因使用不同透明度
                },
                data: [chartData.values[i]],
              };
            }),
          };

          chart.setOption(option);
        }
      });
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

.chart-container {
  margin-bottom: 40px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.chart {
  margin: 0 auto;
}
</style>
