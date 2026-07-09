<template>
  <div class="app-container">
    <el-container>
      <!-- 头部导航：登录页隐藏 -->
      <el-header v-if="!isLoginPage" class="app-header" height="60px">
        <div class="header-container">
          <div class="logo-container">
            <router-link to="/">
              <el-icon class="logo-icon"><DataAnalysis /></el-icon>
              <h2 class="logo">数据处理工具集</h2>
            </router-link>
          </div>

          <el-menu
            :default-active="activeIndex"
            mode="horizontal"
            router
            background-color="transparent"
            text-color="#fff"
            active-text-color="#ffd04b"
            class="nav-menu"
          >
            <el-menu-item
              v-for="menu in menus"
              :key="menu.path"
              :index="menu.path"
            >
              {{ menu.label }}
            </el-menu-item>
          </el-menu>

          <div class="user-info">
            <el-button
              v-if="!isLoggedIn"
              type="primary"
              plain
              @click="$router.push('/login')"
            >
              <el-icon><User /></el-icon> 登录
            </el-button>

            <el-dropdown v-if="isLoggedIn" @command="handleCommand">
              <span class="el-dropdown-link">
                <el-avatar :size="32" :icon="UserFilled" />
                {{ currentUser ? currentUser.username : "用户" }}
                <el-tag
                  v-if="isAdmin"
                  type="danger"
                  size="small"
                  effect="dark"
                  class="admin-tag"
                  >管理员</el-tag
                >
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon> 注销
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main :class="['app-main', { 'app-main--login': isLoginPage }]">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  User,
  UserFilled,
  ArrowDown,
  SwitchButton,
  DataAnalysis,
} from "@element-plus/icons-vue";
import {
  getUser,
  isLoggedIn,
  isAdmin,
  getMenusByRole,
  logout,
} from "./utils/auth";

export default {
  name: "App",
  setup() {
    const route = useRoute();
    const activeIndex = computed(() => route.path);
    const isLoginPage = computed(() => route.path === "/login");

    return {
      activeIndex,
      isLoginPage,
      User,
      UserFilled,
      ArrowDown,
      SwitchButton,
      DataAnalysis,
    };
  },
  data() {
    return {
      menus: [],
      currentUser: null,
      isLoggedIn: false,
      isAdmin: false,
    };
  },
  created() {
    this.updateUserState();
  },
  mounted() {
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
    handleCommand(command) {
      if (command === "logout") {
        this.handleLogout();
      }
    },
    handleLogout() {
      logout();
      this.updateUserState();
      this.$router.push("/login");
    },
  },
};
</script>

<style>
:root {
  --app-primary: #409eff;
  --app-primary-dark: #2c6dd5;
  --app-bg: #f5f7fa;
  --app-text: #303133;
  --app-text-secondary: #606266;
  --app-border: #dcdfe6;
  --app-header-height: 60px;
}

body {
  margin: 0;
  padding: 0;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", Arial, sans-serif;
  background-color: var(--app-bg);
  color: var(--app-text);
}

.app-container {
  min-height: 100vh;
}

.app-header {
  padding: 0;
  background: linear-gradient(135deg, var(--app-primary), var(--app-primary-dark));
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  z-index: 1;
}

.header-container {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}

.logo-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-container a {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-icon {
  font-size: 24px;
  color: #fff;
  margin-right: 10px;
}

.logo {
  color: #fff;
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  white-space: nowrap;
}

.nav-menu {
  border-bottom: none;
  flex: 1;
  margin-left: 24px;
  background-color: transparent !important;
  overflow-x: auto;
}

.nav-menu :deep(.el-menu-item) {
  height: var(--app-header-height);
  line-height: var(--app-header-height);
  font-size: 14px;
  border-bottom: none !important;
  padding: 0 14px;
}

.nav-menu :deep(.el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-bottom: 3px solid #ffd04b !important;
}

.nav-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.user-info {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.user-info .el-button--primary.is-plain {
  background-color: transparent;
  border-color: rgba(255, 255, 255, 0.7);
  color: #fff;
}

.user-info .el-button--primary.is-plain:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  color: #fff;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
  gap: 6px;
}

.el-dropdown-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.admin-tag {
  margin-left: 4px;
}

.app-main {
  min-height: calc(100vh - var(--app-header-height));
  padding: 24px 20px;
  background-color: var(--app-bg);
}

.app-main--login {
  min-height: 100vh;
  padding: 0;
  display: flex;
  align-items: stretch;
}

a {
  text-decoration: none;
}
</style>
