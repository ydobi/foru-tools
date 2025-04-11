<template>
  <div class="smart-map">
    <h1 class="text-center mb-4">智能地图工具</h1>
    
    <div class="row">
      <div class="col-md-4">
        <div class="bg-white p-4 rounded shadow-sm mb-4">
          <h3>上传 Excel 文件以加载数据</h3>
          <div class="mb-3">
            <input type="file" class="form-control" id="fileInput" ref="fileInput" @change="handleFileUpload" />
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" @click="exportImage">导出为图片</button>
            <button class="btn btn-secondary" @click="rerenderMap">重新渲染</button>
          </div>
        </div>
        
        <div class="bg-white p-4 rounded shadow-sm">
          <h3>自定义分段配置</h3>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>最小值 (min)</th>
                  <th>最大值 (max)</th>
                  <th>颜色 (color)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(piece, index) in pieces" :key="index">
                  <td>
                    <input type="number" class="form-control" v-model="piece.min" placeholder="最小值">
                  </td>
                  <td>
                    <input type="number" class="form-control" v-model="piece.max" placeholder="最大值">
                  </td>
                  <td>
                    <input type="color" class="form-control form-control-color" v-model="piece.color">
                  </td>
                  <td>
                    <button class="btn btn-danger btn-sm" @click="deletePiece(index)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-info" @click="addPiece">增加行</button>
            <button class="btn btn-success" @click="updatePieces">更新分段配置</button>
          </div>
        </div>
      </div>
      
      <div class="col-md-8">
        <div class="bg-white p-4 rounded shadow-sm">
          <div ref="chartContainer" style="width: 100%; height: 600px;"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SmartMap',
  data() {
    return {
      chart: null,
      pieces: [
        { min: 20, max: null, color: '#0097ff' },
        { min: 10, max: 19, color: '#27b2ff' },
        { min: 5, max: 9, color: '#65c8ff' },
        { min: 1, max: 4, color: '#c1e8ff' },
        { min: 0, max: 0, color: '#ffffff' }
      ],
      mapData: []
    }
  },
  mounted() {
    this.initChart();
  },
  methods: {
    initChart() {
      // 初始化 ECharts 实例
      this.chart = echarts.init(this.$refs.chartContainer);
      
      // 默认配置项
      const option = {
        title: {
          text: '中国地图销量标注示例',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            // 如果数据为空，展示 0
            var value = params.value || 0;
            return `${params.name}<br/>销量: ${value}`;
          }
        },
        visualMap: {
          pieces: this.generatePiecesForChart(),
          left: 'left',
          top: 'bottom',
          text: ['高销量', '低销量'], // 显示的文字
          calculable: false // 不需要拖动选择
        },
        series: [
          {
            name: '销量',
            type: 'map',
            map: 'china',
            roam: true,
            label: {
              show: true, // 显示省份名称
              formatter: function (params) {
                // 在地图上标注销量
                if (params.name === '香港' || params.name === '澳门' || params.name === '台湾') {
                  return '';
                } else {
                  return params.name + `(${params.value || 0})`;
                }
              },
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'Segoe UI', // 设置字体为 Segoe UI
              color: '#000'
            },
            emphasis: {
              label: {
                show: true,
                color: '#fff',
                fontWeight: 'bold',
                fontFamily: 'Segoe UI' // 高亮时也设置字体为 Segoe UI
              }
            },
            data: [] // 数据将从 Excel 文件中加载
          }
        ]
      };
      
      // 设置初始图表
      this.chart.setOption(option);
      
      // 响应窗口大小变化
      window.addEventListener('resize', this.resizeChart);
    },
    resizeChart() {
      if (this.chart) {
        this.chart.resize();
      }
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) {
        alert('请选择一个 Excel 文件！');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // 默认读取第一个工作表
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet); // 转换为 JSON 数据
        
        // 将 Excel 数据转换为 ECharts 所需格式
        this.mapData = jsonData.map(function (row) {
          return {
            name: row['省份'], // 假设 Excel 中有一列叫 "省份"
            value: row['销量'] // 假设 Excel 中有一列叫 "销量"
          };
        });
        
        // 更新图表数据
        this.updateChartData();
      };
      
      reader.readAsArrayBuffer(file);
    },
    updateChartData() {
      const option = this.chart.getOption();
      option.series[0].data = this.mapData;
      this.chart.setOption(option);
    },
    generatePiecesForChart() {
      return this.pieces.map(piece => {
        const result = { color: piece.color };
        
        if (piece.min !== null && piece.min !== undefined) {
          result.min = parseFloat(piece.min);
        }
        
        if (piece.max !== null && piece.max !== undefined) {
          result.max = parseFloat(piece.max);
        }
        
        // 自动生成标签
        let label = '';
        if (piece.min !== null && piece.max !== null) {
          if (piece.min === piece.max) {
            label = `${piece.min}`;
          } else {
            label = `${piece.min} ~ ${piece.max}`;
          }
        } else if (piece.min !== null) {
          label = `≥ ${piece.min}`;
        } else if (piece.max !== null) {
          label = `≤ ${piece.max}`;
        }
        
        if (label) {
          result.label = label;
        }
        
        return result;
      });
    },
    updatePieces() {
      const option = this.chart.getOption();
      option.visualMap.pieces = this.generatePiecesForChart();
      this.chart.setOption(option);
      alert('分段配置已更新！');
    },
    addPiece() {
      this.pieces.push({
        min: null,
        max: null,
        color: '#63b2ee'
      });
    },
    deletePiece(index) {
      this.pieces.splice(index, 1);
    },
    exportImage() {
      const img = this.chart.getDataURL({
        type: 'png', // 图片类型
        pixelRatio: 2, // 分辨率
        backgroundColor: '#fff' // 背景颜色
      });
      
      // 创建一个下载链接
      const link = document.createElement('a');
      link.href = img;
      link.download = '中国地图销量.png'; // 下载的文件名
      link.click();
    },
    rerenderMap() {
      this.chart.clear(); // 清空当前图表
      
      // 重新设置配置
      const option = {
        title: {
          text: '中国地图销量标注示例',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            var value = params.value || 0;
            return `${params.name}<br/>销量: ${value}`;
          }
        },
        visualMap: {
          pieces: this.generatePiecesForChart(),
          left: 'left',
          top: 'bottom',
          text: ['高销量', '低销量'],
          calculable: false
        },
        series: [
          {
            name: '销量',
            type: 'map',
            map: 'china',
            roam: true,
            label: {
              show: true,
              formatter: function (params) {
                if (params.name === '香港' || params.name === '澳门' || params.name === '台湾') {
                  return '';
                } else {
                  return params.name + `(${params.value || 0})`;
                }
              },
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'Segoe UI',
              color: '#000'
            },
            emphasis: {
              label: {
                show: true,
                color: '#fff',
                fontWeight: 'bold',
                fontFamily: 'Segoe UI'
              }
            },
            data: this.mapData
          }
        ]
      };
      
      this.chart.setOption(option);
      alert('地图已重新渲染！');
    }
  },
  beforeUnmount() {
    // 清除事件监听
    window.removeEventListener('resize', this.resizeChart);
    
    // 销毁图表实例
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }
}
</script>

<style scoped>
.smart-map {
  margin-bottom: 2rem;
}
</style>