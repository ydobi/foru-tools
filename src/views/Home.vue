<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <el-card class="welcome-card">
      <h1 class="welcome-title">数据处理工具集</h1>
      <p class="welcome-subtitle">这是一个集成了多种数据处理工具的应用，帮助您更高效地处理业务数据。</p>
      <el-divider />
      <p v-if="currentUser" class="welcome-message">
        欢迎您，<el-tag type="success">{{ currentUser.username }}</el-tag>！请从下方选择您需要使用的工具：
      </p>
      <p v-else class="welcome-message">请从下方选择您需要使用的工具：</p>
    </el-card>
    
    <!-- 工具卡片区域 -->
    <el-row :gutter="20" class="tool-cards">
      <!-- 公司关联关系处理 - 仅管理员可见 -->
      <el-col v-if="isAdmin" :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>公司关联关系处理</span>
              <el-tag type="danger" size="small" effect="dark">管理员专用</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><DocumentIcon /></el-icon>
            <p class="card-description">上传Excel文件，自动处理授权公司与订货公司的关联关系。</p>
            <el-button type="primary" @click="$router.push('/company-relation')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- Excel文件合并 - 所有登录用户可见 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>Excel文件合并</span>
              <el-tag type="success" size="small" effect="dark">所有用户</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><FilesIcon /></el-icon>
            <p class="card-description">合并多个Excel文件，支持垂直合并、水平合并和分表合并。</p>
            <el-button type="primary" @click="$router.push('/excel-merge')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- 智能地图工具 - 仅管理员可见 -->
      <el-col v-if="isAdmin" :xs="24" :sm="12" :md="8">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>智能地图工具</span>
              <el-tag type="danger" size="small" effect="dark">管理员专用</el-tag>
            </div>
          </template>
          <div class="card-content">
            <el-icon class="tool-icon"><MapLocationIcon /></el-icon>
            <p class="card-description">上传Excel数据，生成中国地图销量标注，支持自定义分段配置。</p>
            <el-button type="primary" @click="$router.push('/smart-map')">使用工具</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 如果没有可用工具，显示提示信息 -->
    <el-empty 
      v-if="!isAdmin && !hasUserTools" 
      description="您当前的权限无法访问更多工具，请联系管理员获取更多权限。"
      :image-size="200"
    >
      <el-button type="primary" @click="$router.push('/login')">重新登录</el-button>
    </el-empty>
  </div>
</template>

<script>
import { Document as DocumentIcon, Files as FilesIcon, MapLocation as MapLocationIcon } from '@element-plus/icons-vue'
import { getUser, isAdmin, hasRole } from '../utils/auth'

export default {
  name: 'Home',
  components: {
    DocumentIcon,
    FilesIcon,
    MapLocationIcon
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
  padding: 20px;
}

.welcome-card {
  margin-bottom: 30px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
}

.welcome-title {
  font-size: 2rem;
  color: #409EFF;
  margin-bottom: 10px;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: #606266;
  margin-bottom: 20px;
}

.welcome-message {
  font-size: 1.1rem;
  color: #606266;
}

.tool-cards {
  margin-top: 30px;
}

.tool-card {
  height: 100%;
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.tool-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.tool-icon {
  font-size: 3rem;
  color: #409EFF;
  margin-bottom: 15px;
}

.card-description {
  margin-bottom: 20px;
  color: #606266;
  flex-grow: 1;
}
</style>
