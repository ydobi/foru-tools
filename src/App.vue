<template>
  <div class="app-container">
    <el-container class="app-layout">
      <el-container class="app-right">
        <el-header class="app-header" height="56px">
          <div class="header-container">
            <router-link to="/" class="header-brand">
              <el-icon class="logo-icon"><DataAnalysis /></el-icon>
              <span class="logo-text">数据处理工具集</span>
            </router-link>
          </div>
        </el-header>

        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { DataAnalysis } from "@element-plus/icons-vue";

export default {
  name: "App",
  components: {
    DataAnalysis,
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

.app-main {
  min-height: calc(100vh - var(--app-header-height));
  padding: 24px 20px;
  background-color: var(--app-bg);
}

a {
  text-decoration: none;
}
</style>
