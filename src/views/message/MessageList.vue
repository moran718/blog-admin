<template>
  <div class="message-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchForm.keyword" placeholder="搜索内容" style="width: 200px" clearable
          @keyup.enter.native="handleSearch" />
        <el-select v-model="searchForm.type" placeholder="数据类型" clearable style="width: 140px">
          <el-option label="全部类型" :value="null" />
          <el-option label="弹幕" :value="0" />
          <el-option label="留言" :value="1" />
        </el-select>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="messageList" v-loading="loading" style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="150">
          <template slot-scope="scope">
            <div class="user-info">
              <el-avatar :size="30" :src="getAvatarUrl(scope.row)" />
              <span class="username">{{ scope.row.username || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === 0 ? 'warning' : 'success'" size="small">
              {{ scope.row.type === 0 ? '弹幕' : '留言' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="250">
          <template slot-scope="scope">
            <div class="message-content">
              <div v-if="scope.row.content" class="content-text">{{ scope.row.content }}</div>
              <span v-else-if="!scope.row.imageList || scope.row.imageList.length === 0" class="text-muted">-</span>
              <!-- 图片预览（仅留言有图片） -->
              <div v-if="scope.row.imageList && scope.row.imageList.length > 0" class="image-preview">
                <el-image v-for="(img, index) in scope.row.imageList" :key="index" :src="getImageUrl(img)"
                  :preview-src-list="getImageListUrls(scope.row.imageList)" fit="cover" class="preview-img" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="点赞/回复" width="100">
          <template slot-scope="scope">
            <span v-if="scope.row.type === 0">👍 {{ scope.row.likes || 0 }}</span>
            <span v-else>💬 {{ scope.row.replyCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination style="margin-top: 20px; text-align: right" :current-page="pagination.page"
        :page-size="pagination.size" :total="pagination.total" layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange" />
    </el-card>
  </div>
</template>

<script>
import { http, getResourceUrl } from '@/utils/request'

export default {
  name: 'MessageList',
  data() {
    return {
      loading: false,
      messageList: [],
      searchForm: {
        keyword: '',
        type: null
      },
      pagination: {
        page: 1,
        size: 10,
        total: 0
      }
    }
  },
  created() {
    this.loadMessages()
  },
  methods: {
    getAvatarUrl(row) {
      const avatar = row.avatar
      if (!avatar) {
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + row.userId
      }
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar
      }
      return getResourceUrl(avatar)
    },
    getImageUrl(img) {
      if (!img) return ''
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img
      }
      return getResourceUrl(img)
    },
    getImageListUrls(imageList) {
      if (!imageList) return []
      return imageList.map(img => this.getImageUrl(img))
    },
    async loadMessages() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          size: this.pagination.size
        }
        if (this.searchForm.keyword) {
          params.keyword = this.searchForm.keyword
        }
        if (this.searchForm.type !== null) {
          params.type = this.searchForm.type
        }
        const res = await http.get('/api/message/admin/list', params)
        this.messageList = res.data.list || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadMessages()
    },
    handleReset() {
      this.searchForm.keyword = ''
      this.searchForm.type = null
      this.pagination.page = 1
      this.loadMessages()
    },
    async handleDelete(row) {
      const typeName = row.type === 0 ? '弹幕' : '留言'
      try {
        await this.$confirm(`确定要删除该${typeName}吗？${row.type === 1 ? '同时会删除其所有回复！' : ''}`, '提示', { type: 'warning' })
        await http.delete('/api/message/admin/delete', { id: row.id })
        this.$message.success('删除成功')
        this.loadMessages()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadMessages()
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }
  }
}
</script>

<style lang="less" scoped>
.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .username {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.message-content {
  .content-text {
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .text-muted {
    color: #999;
  }

  .image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .preview-img {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}
</style>
