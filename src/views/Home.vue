<template>
  <div class="home">
    <div class="jumbotron bg-light p-5 rounded">
      <h1 class="display-4">数据处理工具集</h1>
      <p class="lead">这是一个集成了多种数据处理工具的应用，帮助您更高效地处理业务数据。</p>
      <hr class="my-4">
      <p v-if="currentUser">欢迎您，{{ currentUser.username }}！请从下方选择您需要使用的工具：</p>
      <p v-else>请从下方选择您需要使用的工具：</p>
    </div>
    
    <div class="row mt-4">
      <!-- 公司关联关系处理 - 仅管理员可见 -->
      <div v-if="isAdmin" class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">公司关联关系处理</h5>
            <p class="card-text">上传Excel文件，自动处理授权公司与订货公司的关联关系。</p>
            <router-link to="/company-relation" class="btn btn-primary">使用工具</router-link>
          </div>
        </div>
      </div>
      
      <!-- Excel文件合并 - 所有登录用户可见 -->
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Excel文件合并</h5>
            <p class="card-text">合并多个Excel文件，支持垂直合并、水平合并和分表合并。</p>
            <router-link to="/excel-merge" class="btn btn-primary">使用工具</router-link>
          </div>
        </div>
      </div>
      
      <!-- 智能地图工具 - 仅管理员可见 -->
      <div v-if="isAdmin" class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">智能地图工具</h5>
            <p class="card-text">上传Excel数据，生成中国地图销量标注，支持自定义分段配置。</p>
            <router-link to="/smart-map" class="btn btn-primary">使用工具</router-link>
          </div>
        </div>
      </div>
      
      <!-- 如果没有可用工具，显示提示信息 -->
      <div v-if="!isAdmin && !hasUserTools" class="col-12 text-center mt-4">
        <div class="alert alert-info">
          您当前的权限无法访问更多工具，请联系管理员获取更多权限。
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getUser, isAdmin, hasRole } from '../utils/auth';

export default {
  name: 'Home',
  data() {
    return {
      currentUser: null,
      isAdmin: false,
      hasUserTools: false
    }
  },
  created() {
    this.updateUserState();
  },
  methods: {
    updateUserState() {
      this.currentUser = getUser();
      this.isAdmin = isAdmin();
      this.hasUserTools = hasRole('user');
    }
  }
}
</script>