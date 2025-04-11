<template>
  <div class="app-container">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">数据处理工具集</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/company-relation">公司关联关系处理</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/excel-merge">Excel文件合并</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/smart-map">智能地图工具</router-link>
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
export default {
  name: 'App'
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