<template>
  <div class="ai-settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>🤖 AI 自动回复设置</span>
        </div>
      </template>

      <el-form label-width="140px">
        <el-form-item label="AI 自动回复">
          <el-switch v-model="config.aiReplyEnabled" @change="handleToggle" :loading="loading"
            active-text="开启" inactive-text="关闭" />
        </el-form-item>

        <el-form-item>
          <el-alert title="功能说明" type="info" :closable="false" show-icon>
            <template #default>
              <p>开启后，用户在随笔页面发表评论时，AI 助手会自动生成并发布回复。</p>
              <p style="margin-top: 8px; color: #909399;">使用通义千问 (Qwen) 大语言模型</p>
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { http } from '@/utils/request'

export default {
  name: 'AiSettings',
  data() {
    return {
      config: {
        aiReplyEnabled: false
      },
      loading: false
    }
  },
  created() {
    this.loadConfig()
  },
  methods: {
    async loadConfig() {
      try {
        const res = await http.get('/api/admin/ai/config')
        if (res.data) {
          this.config.aiReplyEnabled = res.data.aiReplyEnabled || false
        }
      } catch (error) {
        console.error('加载 AI 配置失败:', error)
        this.$message.error('加载 AI 配置失败')
      }
    },
    async handleToggle(value) {
      this.loading = true
      try {
        await http.put('/api/admin/ai/config', {
          aiReplyEnabled: value
        })
        this.$message.success(value ? 'AI 自动回复已开启' : 'AI 自动回复已关闭')
      } catch (error) {
        console.error('更新 AI 配置失败:', error)
        this.$message.error('更新失败')
        // 回滚状态
        this.config.aiReplyEnabled = !value
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.ai-settings {
  padding: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 500;
}
</style>
