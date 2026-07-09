<template>
  <div class="home">
    <el-card class="welcome-card" shadow="never">
      <p v-if="currentUser" class="welcome-message">
        欢迎您，<el-tag type="success" size="small">{{ currentUser.username }}</el-tag>
        ，请选择需要使用的工具：
      </p>
      <p v-else class="welcome-message">请从下方选择您需要使用的工具：</p>
      <p class="welcome-subtitle">集成多种数据处理能力，帮助您更高效地处理业务数据。</p>
    </el-card>

    <el-row :gutter="20" class="tool-cards">
      <el-col v-if="isAdmin" :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>公司关联关系处理</span>
              <el-tag type="danger" size="small" effect="dark">管理员</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><Connection /></el-icon>
            <p class="card-description">上传Excel文件，自动处理授权公司与订货公司的关联关系。</p>
            <el-button type="primary" @click="$router.push('/company-relation')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>公司关联关系处理2</span>
              <el-tag type="success" size="small" effect="dark">所有用户</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><Share /></el-icon>
            <p class="card-description">以植入公司为基础列合并数据，处理授权与订货关联关系。</p>
            <el-button type="primary" @click="$router.push('/company-relation2')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>Excel文件合并</span>
              <el-tag type="success" size="small" effect="dark">所有用户</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><Files /></el-icon>
            <p class="card-description">合并多个Excel文件，支持垂直、水平与分表合并。</p>
            <el-button type="primary" @click="$router.push('/excel-merge')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>医院授权&植入分析</span>
              <el-tag type="success" size="small" effect="dark">所有用户</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><FirstAidKit /></el-icon>
            <p class="card-description">按销售经理与全国维度分析医院授权与植入情况。</p>
            <el-button type="primary" @click="$router.push('/hospital-auth-analysis')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订货达成率异常分析</span>
              <el-tag type="success" size="small" effect="dark">所有用户</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><TrendCharts /></el-icon>
            <p class="card-description">按销售经理和产品维度分析订货达成率异常原因。</p>
            <el-button type="primary" @click="$router.push('/order-achievement-analysis')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col v-if="isAdmin" :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>智能地图工具</span>
              <el-tag type="danger" size="small" effect="dark">管理员</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><MapLocation /></el-icon>
            <p class="card-description">上传Excel数据，生成中国地图销量标注，支持自定义分段。</p>
            <el-button type="primary" @click="$router.push('/smart-map')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty
      v-if="!isAdmin && !hasUserTools"
      description="您当前的权限无法访问更多工具，请联系管理员获取更多权限。"
      :image-size="160"
    >
      <el-button type="primary" @click="$router.push('/login')">重新登录</el-button>
    </el-empty>
  </div>
</template>

<script>
import {
  Connection,
  Share,
  Files,
  FirstAidKit,
  TrendCharts,
  MapLocation
} from '@element-plus/icons-vue'
import { getUser, isAdmin, hasRole } from '../utils/auth'

export default {
  name: 'Home',
  components: {
    Connection,
    Share,
    Files,
    FirstAidKit,
    TrendCharts,
    MapLocation
  },
  data() {
    return {
      currentUser: null,
      isAdmin: false,
      hasUserTools: false
    }
  },
  created() {
    this.updateUserState()
  },
  methods: {
    updateUserState() {
      this.currentUser = getUser()
      this.isAdmin = isAdmin()
      this.hasUserTools = hasRole('user')
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.welcome-message {
  margin: 0 0 8px;
  font-size: 1.1rem;
  color: #303133;
}

.welcome-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.tool-cards {
  margin-top: 8px;
}

.tool-card {
  height: 100%;
  margin-bottom: 20px;
  border-radius: 8px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  gap: 8px;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 180px;
}

.tool-icon {
  font-size: 2.75rem;
  color: #409eff;
  margin-bottom: 14px;
}

.card-description {
  margin: 0 0 20px;
  color: #606266;
  flex-grow: 1;
  line-height: 1.5;
  font-size: 14px;
}
</style>
