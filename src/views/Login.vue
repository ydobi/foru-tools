<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <div class="login-brand">
        <div class="brand-icon-wrap">
          <el-icon class="brand-icon"><DataAnalysis /></el-icon>
        </div>
        <h1 class="brand-title">数据处理工具集</h1>
        <p class="brand-subtitle">登录后使用业务数据处理工具</p>
      </div>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="true"
        @close="error = null"
        class="login-alert"
      />

      <el-form
        ref="loginForm"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            size="large"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="isLoading"
            class="login-button"
            size="large"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { User, Lock, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { apiFetch } from '@/utils/api'
import { setSession } from '@/utils/auth'

export default {
  name: 'LoginView',
  components: {
    User,
    Lock,
    DataAnalysis
  },
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ]
      },
      error: null,
      isLoading: false
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) return false

        this.isLoading = true
        this.error = null

        try {
          const res = await apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({
              username: this.loginForm.username,
              password: this.loginForm.password
            })
          })
          const data = await res.json().catch(() => ({}))

          if (!res.ok) {
            this.error = data.error || '用户名或密码错误'
            return
          }

          setSession(data)
          ElMessage({
            message: '登录成功！',
            type: 'success',
            duration: 2000
          })
          this.$router.push('/')
        } catch (e) {
          this.error = '无法连接登录服务'
        } finally {
          this.isLoading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(ellipse at top left, rgba(64, 158, 255, 0.18), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(44, 109, 213, 0.12), transparent 45%),
    #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  overflow: hidden;
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
}

.brand-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #409eff, #2c6dd5);
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.35);
}

.brand-icon {
  font-size: 32px;
  color: #fff;
}

.brand-title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
}

.brand-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.login-alert {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}

:deep(.el-card__body) {
  padding: 36px 32px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
