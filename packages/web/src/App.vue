<template>
  <div class="app-container">
    <el-container class="app-layout" :class="{ 'app-layout--login': isLoginPage }">
      <el-container class="app-right">
        <el-header v-if="!isLoginPage" class="app-header" height="56px">
          <div class="header-container">
            <router-link to="/" class="header-brand">
              <el-icon class="logo-icon"><DataAnalysis /></el-icon>
              <span class="logo-text">数据处理工具集</span>
            </router-link>
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
                  <span class="username">{{ currentUser ? currentUser.username : "用户" }}</span>
                  <el-tag
                    v-if="isAdmin"
                    type="danger"
                    size="small"
                    effect="dark"
                    class="admin-tag"
                  >管理员</el-tag>
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
  logout,
} from "./utils/auth";

export default {
  name: "App",
  setup() {
    const route = useRoute();
    const isLoginPage = computed(() => route.path === "/login");

    return {
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
  --app-header-height: 56px;
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

.app-layout {
  min-height: 100vh;
}

.app-layout--login {
  display: block;
}

.app-right {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 0;
  background: #fff;
  border-bottom: 1px solid var(--app-border);
  box-shadow: none;
}

.header-container {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-icon {
  font-size: 22px;
  color: #409eff;
  flex-shrink: 0;
}

.logo-text {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.user-info {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  color: var(--app-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
  gap: 8px;
}

.el-dropdown-link:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
}

.admin-tag {
  margin-left: 0;
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
