<template>
  <div class="login-container">
    <el-card class="login-card">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="true"
        @close="error = null"
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
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.isLoading = true;
          this.error = null;
          
          // 模拟登录请求
          setTimeout(() => {
            // 简单的用户验证逻辑
            const users = [
              { username: 'admin', password: 'admin123', role: 'admin' },
              { username: 'user', password: 'user123', role: 'user' }
            ];
            
            const user = users.find(u => 
              u.username === this.loginForm.username && u.password === this.loginForm.password
            );
            
            if (user) {
              // 存储用户信息到 localStorage
              localStorage.setItem('user', JSON.stringify({
                username: user.username,
                role: user.role
              }));
              
              // 显示登录成功消息
              ElMessage({
                message: '登录成功！',
                type: 'success',
                duration: 2000
              });
              
              // 重定向到首页
              this.$router.push('/');
            } else {
              this.error = '用户名或密码错误';
            }
            
            this.isLoading = false;
          }, 1000);
        } else {
          return false;
        }
      });
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  background: linear-gradient(135deg, #409EFF, #2c6dd5);
  color: white;
  position: relative;
  overflow: hidden;
}

.card-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  z-index: 1;
}

.header-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 70px;
  background-color: white;
  border-radius: 50%;
  margin-bottom: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logo-icon {
  font-size: 40px;
  color: #409EFF;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 5px 0;
  z-index: 2;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  z-index: 2;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  border-radius: 4px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 4px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

:deep(.el-card__body) {
  padding: 30px;
}

:deep(.el-alert) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>