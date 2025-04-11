<template>
  <div class="home">
    <div class="jumbotron bg-light p-5 rounded">
      <h1 class="display-4">数据处理工具集</h1>
      <p class="lead">这是一个集成了多种数据处理工具的应用，帮助您更高效地处理业务数据。</p>
      <hr class="my-4">
      <p>请从下方选择您需要使用的工具：</p>
    </div>
    
    <div class="row mt-4">
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">公司关联关系处理</h5>
            <p class="card-text">上传Excel文件，自动处理授权公司与订货公司的关联关系。</p>
            <router-link to="/company-relation" class="btn btn-primary">使用工具</router-link>
          </div>
        </div>
      </div>
      
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Excel文件合并</h5>
            <p class="card-text">合并多个Excel文件，支持垂直合并、水平合并和分表合并。</p>
            <router-link to="/excel-merge" class="btn btn-primary">使用工具</router-link>
          </div>
        </div>
      </div>
      
      <div class="col-md-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">智能地图工具</h5>
            <p class="card-text">上传Excel数据，生成中国地图销量标注，支持自定义分段配置。</p>
            <router-link to="/smart-map" class="btn btn-primary">使用工具</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>