<template>
  <div class="tool-page">
    <div class="tool-page__header">
      <h1 class="tool-page__title">{{ title }}</h1>
      <p v-if="description" class="tool-page__desc">{{ description }}</p>
    </div>

    <el-card v-if="$slots.actions || $slots.default" class="tool-page__card" shadow="never">
      <div v-if="$slots.actions" class="tool-page__actions">
        <slot name="actions" />
      </div>
      <slot />
    </el-card>

    <el-card v-if="$slots.result" class="tool-page__card tool-page__result" shadow="never">
      <slot name="result" />
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ToolPage',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.tool-page {
  max-width: 1200px;
  margin: 0 auto;
}

.tool-page__header {
  margin-bottom: 20px;
}

.tool-page__title {
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 600;
  color: #303133;
}

.tool-page__desc {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
}

.tool-page__card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.tool-page__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.tool-page__actions:last-child {
  margin-bottom: 0;
}

.tool-page__result {
  margin-bottom: 0;
}
</style>
