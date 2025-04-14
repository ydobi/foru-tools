<template>
  <div class="login-container">
    <div class="card login-card">
      <div class="card-header bg-primary text-white text-center">
        <h4>数据处理工具集 - 登录</h4>
      </div>
      <div class="card-body">
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="username" class="form-label">用户名</label>
            <input 
              type="text" 
              class="form-control" 
              id="username" 
              v-model="username" 
              required
              placeholder="请输入用户名"
            >
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">密码</label>
            <input 
              type="password" 
              class="form-control" 
              id="password" 
              v-model="password" 
              required
              placeholder="请输入密码"
            >
          </div>
          <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      error: null,
      isLoading: false
    }
  },
  methods: {
    handleLogin() {
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
          u.username === this.username && u.password === this.password
        );
        
        if (user) {
          // 存储用户信息到 localStorage
          localStorage.setItem('user', JSON.stringify({
            username: user.username,
            role: user.role
          }));
          
          // 重定向到首页
          this.$router.push('/');
        } else {
          this.error = '用户名或密码错误';
        }
        
        this.isLoading = false;
      }, 1000);
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
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>