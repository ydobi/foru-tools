<template>
  <div class="app-container">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">数据处理工具集</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- 动态菜单 -->
          <ul class="navbar-nav me-auto">
            <li v-for="menu in menus" :key="menu.path" class="nav-item">
              <router-link class="nav-link" :to="menu.path">{{ menu.label }}</router-link>
            </li>
          </ul>
          
          <!-- 用户信息和登录/注销 -->
          <ul class="navbar-nav">
            <li v-if="!isLoggedIn" class="nav-item">
              <router-link class="nav-link" to="/login">登录</router-link>
            </li>
            <li v-if="isLoggedIn" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {{ currentUser ? currentUser.username : '用户' }}
                <span v-if="isAdmin" class="badge bg-danger ms-1">管理员</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">注销</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="container mt-4">
      <router-view></router-view>
    </div>
    
    <footer class="footer mt-5 py-3 bg-light">
      <div class="container text-center">
        <span class="text-muted">© 2023 数据处理工具集</span>
      </div>
    </footer>
  </div>
</template>

<script>
import { getUser, isLoggedIn, isAdmin, getMenusByRole, logout } from './utils/auth';

export default {
  name: 'App',
  data() {
    return {
      menus: [],
      currentUser: null,
      isLoggedIn: false,
      isAdmin: false
    }
  },
  created() {
    // 初始化用户状态
    this.updateUserState();
    
    // 监听路由变化，更新用户状态
    this.$router.beforeEach((to, from, next) => {
      this.updateUserState();
      next();
    });
  },
  methods: {
    updateUserState() {
      this.currentUser = getUser();
      this.isLoggedIn = isLoggedIn();
      this.isAdmin = isAdmin();
      this.menus = getMenusByRole();
    },
    handleLogout() {
      logout();
      this.updateUserState();
      this.$router.push('/login');
    }
  }
}
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  flex: 1;
}

.footer {
  margin-top: auto;
}
</style>