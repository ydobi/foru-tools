<template>
  <div class="app-container">
    <el-container class="app-layout" :class="{ 'app-layout--login': isLoginPage }">
      <!-- 侧边栏：登录页隐藏 -->
      <el-aside
        v-if="!isLoginPage"
        :width="asideWidth"
        class="app-aside"
      >
        <div class="aside-brand">
          <router-link to="/" class="aside-brand-link">
            <el-icon class="logo-icon"><DataAnalysis /></el-icon>
            <span v-show="!isCollapsed" class="logo-text">数据处理工具集</span>
          </router-link>
        </div>

        <el-menu
          :default-active="activeIndex"
          :collapse="isCollapsed"
          router
          class="aside-menu"
          background-color="#ffffff"
          text-color="#606266"
          active-text-color="#409eff"
        >
          <el-menu-item
            v-for="menu in menus"
            :key="menu.path"
            :index="menu.path"
            :title="menu.label"
          >
            <el-icon v-if="menu.icon">
              <component :is="menu.icon" />
            </el-icon>
            <template #title>
              <span class="menu-label">{{ menu.label }}</span>
            </template>
          </el-menu-item>
        </el-menu>

        <div class="aside-footer">
          <el-button
            class="collapse-btn"
            text
            @click="isCollapsed = !isCollapsed"
          >
            <el-icon>
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
        </div>
      </el-aside>

      <el-container class="app-right">
        <el-header v-if="!isLoginPage" class="app-header" height="56px">
          <div class="header-container">
            <div class="header-title">{{ currentPageTitle }}</div>
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
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  User,
  UserFilled,
  ArrowDown,
  SwitchButton,
  DataAnalysis,
  Fold,
  Expand,
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
  components: {
    Fold,
    Expand,
  },
  setup() {
    const route = useRoute();
    const activeIndex = computed(() => route.path);
    const isLoginPage = computed(() => route.path === "/login");
    const isCollapsed = ref(false);
    const asideWidth = computed(() => (isCollapsed.value ? "64px" : "220px"));

    return {
      activeIndex,
      isLoginPage,
      isCollapsed,
      asideWidth,
      User,
      UserFilled,
      ArrowDown,
      SwitchButton,
      DataAnalysis,
      Fold,
      Expand,
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
  computed: {
    currentPageTitle() {
      const current = this.menus.find((m) => m.path === this.$route.path);
      return current ? current.label : "数据处理工具集";
    },
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
  --app-header-height: 56px;
  --app-aside-bg: #ffffff;
  --app-aside-border: #ebeef5;
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

.app-aside {
  background-color: var(--app-aside-bg);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: width 0.2s ease;
  overflow: hidden;
  border-right: 1px solid var(--app-aside-border);
}

.aside-brand {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--app-aside-border);
  flex-shrink: 0;
}

.aside-brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  overflow: hidden;
}

.logo-icon {
  font-size: 22px;
  color: #409eff;
  flex-shrink: 0;
}

.logo-text {
  color: #303133;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.aside-menu {
  border-right: none !important;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.aside-menu:not(.el-menu--collapse) {
  width: 220px;
}

.aside-menu .el-menu-item {
  height: auto;
  min-height: 48px;
  line-height: 1.4;
  padding: 12px 20px !important;
  white-space: normal;
  margin: 2px 8px;
  border-radius: 6px;
}

.aside-menu .el-menu-item:hover {
  background-color: #f5f7fa !important;
}

.aside-menu .el-menu-item.is-active {
  background-color: #ecf5ff !important;
  color: #409eff !important;
}

.menu-label {
  display: inline-block;
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

.aside-footer {
  padding: 8px;
  border-top: 1px solid var(--app-aside-border);
  flex-shrink: 0;
}

.collapse-btn {
  width: 100%;
  color: #909399 !important;
}

.collapse-btn:hover {
  color: #409eff !important;
  background-color: #f5f7fa !important;
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

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text);
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
