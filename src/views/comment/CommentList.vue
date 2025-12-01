<template>
  <div class="comment-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchForm.keyword" placeholder="搜索评论内容" style="width: 200px" clearable
          @keyup.enter.native="handleSearch" />
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="commentList" v-loading="loading" style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="150">
          <template slot-scope="scope">
            <div class="user-info">
              <el-avatar :size="30"
                :src="scope.row.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + scope.row.userId" />
              <span class="username">{{ scope.row.username || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="250">
          <template slot-scope="scope">
            <div class="comment-content">
              <!-- 回复信息 -->
              <div v-if="scope.row.replyToUsername" class="reply-info">
                <el-tag size="mini" type="warning">回复 @{{ scope.row.replyToUsername }}</el-tag>
              </div>
              <!-- 评论文字 -->
              <div v-if="scope.row.content" class="content-text">{{ scope.row.content }}</div>
              <span v-else-if="!scope.row.imageList || scope.row.imageList.length === 0" class="text-muted">-</span>
              <!-- 图片预览 -->
              <div v-if="scope.row.imageList && scope.row.imageList.length > 0" class="image-preview">
                <el-image v-for="(img, index) in scope.row.imageList" :key="index" :src="img"
                  :preview-src-list="scope.row.imageList" fit="cover" class="preview-img" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.isReply" type="info" size="small">回复</el-tag>
            <el-tag v-else type="primary" size="small">评论</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetTitle" label="所属随笔" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.targetTitle || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="评论时间" width="160">
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
import { http } from '@/utils/request'

export default {
  name: 'CommentList',
  data() {
    return {
      loading: false,
      commentList: [],
      searchForm: {
        keyword: ''
      },
      pagination: {
        page: 1,
        size: 10,
        total: 0
      }
    }
  },
  created() {
    this.loadComments()
  },
  methods: {
    async loadComments() {
      this.loading = true
      try {
        const res = await http.get('/api/comment/admin/list', {
          page: this.pagination.page,
          size: this.pagination.size,
          keyword: this.searchForm.keyword || undefined
        })
        this.commentList = res.data.list || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载评论失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadComments()
    },
    handleReset() {
      this.searchForm.keyword = ''
      this.pagination.page = 1
      this.loadComments()
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除该评论吗？删除后不可恢复！', '提示', { type: 'warning' })
        await http.delete('/api/comment/delete', { id: row.id })
        this.$message.success('删除成功')
        this.loadComments()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadComments()
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

.comment-content {
  .reply-info {
    margin-bottom: 4px;
  }

  .content-text {
    word-break: break-all;
    line-height: 1.5;
  }

  .image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;

    .preview-img {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid #eee;
    }
  }
}

.text-muted {
  color: #909399;
}
</style>
