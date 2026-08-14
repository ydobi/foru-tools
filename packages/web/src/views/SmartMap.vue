<template>
  <ToolPage
    title="智能地图工具"
    description="上传Excel数据，生成中国地图销量标注，支持自定义分段配置"
  >
    <el-row :gutter="20">
      <el-col :xs="24" :md="10">
        <div class="panel">
          <h3 class="panel-title">上传数据</h3>
          <el-upload
            ref="upload"
            action="#"
            accept=".xls,.xlsx"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileUpload"
            :show-file-list="true"
          >
            <el-button type="primary">选择Excel文件</el-button>
            <template #tip>
              <div class="el-upload__tip">需包含「省份」「销量」列</div>
            </template>
          </el-upload>
          <div class="panel-actions">
            <el-button type="primary" @click="exportImage">导出为图片</el-button>
            <el-button @click="rerenderMap">重新渲染</el-button>
          </div>
        </div>

        <div class="panel">
          <h3 class="panel-title">自定义分段配置</h3>
          <el-table :data="pieces" border size="small" style="width: 100%">
            <el-table-column label="最小值" min-width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.min" :controls="false" placeholder="min" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="最大值" min-width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.max" :controls="false" placeholder="max" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="颜色" width="90">
              <template #default="{ row }">
                <el-color-picker v-model="row.color" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link @click="deletePiece($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="panel-actions">
            <el-button @click="addPiece">增加行</el-button>
            <el-button type="success" @click="updatePieces">更新分段配置</el-button>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="14">
        <div class="map-panel">
          <div ref="chartContainer" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </ToolPage>
</template>

<script>
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import ToolPage from '../components/ToolPage.vue'

export default {
  name: 'SmartMap',
  components: { ToolPage },
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
    this.initChart()
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer)

      const option = {
        title: {
          text: '中国地图销量标注',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            var value = params.value || 0
            return `${params.name}<br/>销量: ${value}`
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
                  return ''
                } else {
                  return params.name + `(${params.value || 0})`
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
            data: []
          }
        ]
      }

      this.chart.setOption(option)
      window.addEventListener('resize', this.resizeChart)
    },
    resizeChart() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    handleFileUpload(uploadFile) {
      const file = uploadFile.raw
      if (!file) {
        ElMessage.warning('请选择一个 Excel 文件！')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        this.mapData = jsonData.map(function (row) {
          return {
            name: row['省份'],
            value: row['销量']
          }
        })

        this.updateChartData()
        ElMessage.success('地图数据已加载')
      }

      reader.readAsArrayBuffer(file)
    },
    updateChartData() {
      const option = this.chart.getOption()
      option.series[0].data = this.mapData
      this.chart.setOption(option)
    },
    generatePiecesForChart() {
      return this.pieces.map(piece => {
        const result = { color: piece.color }

        if (piece.min !== null && piece.min !== undefined) {
          result.min = parseFloat(piece.min)
        }

        if (piece.max !== null && piece.max !== undefined) {
          result.max = parseFloat(piece.max)
        }

        let label = ''
        if (piece.min !== null && piece.max !== null) {
          if (piece.min === piece.max) {
            label = `${piece.min}`
          } else {
            label = `${piece.min} ~ ${piece.max}`
          }
        } else if (piece.min !== null) {
          label = `≥ ${piece.min}`
        } else if (piece.max !== null) {
          label = `≤ ${piece.max}`
        }

        if (label) {
          result.label = label
        }

        return result
      })
    },
    updatePieces() {
      const option = this.chart.getOption()
      option.visualMap[0].pieces = this.generatePiecesForChart()
      this.chart.setOption(option)
      ElMessage.success('分段配置已更新')
    },
    addPiece() {
      this.pieces.push({
        min: null,
        max: null,
        color: '#63b2ee'
      })
    },
    deletePiece(index) {
      this.pieces.splice(index, 1)
    },
    exportImage() {
      const img = this.chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })

      const link = document.createElement('a')
      link.href = img
      link.download = '中国地图销量.png'
      link.click()
    },
    rerenderMap() {
      this.chart.clear()

      const option = {
        title: {
          text: '中国地图销量标注',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            var value = params.value || 0
            return `${params.name}<br/>销量: ${value}`
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
                  return ''
                } else {
                  return params.name + `(${params.value || 0})`
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
      }

      this.chart.setOption(option)
      ElMessage.success('地图已重新渲染')
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeChart)

    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.panel-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.map-panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 600px;
}
</style>
