<template>
  <div class="essay-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索随笔内容" clearable @keyup.enter.native="handleSearch"
            style="width: 250px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          <el-button type="success" icon="el-icon-plus" @click="handleAdd">发布随笔</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 随笔列表 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="essayList" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
        <el-table-column label="用户" width="180">
          <template slot-scope="scope">
            <div class="user-info" v-if="scope.row.user">
              <el-avatar :size="32" :src="getFullUrl(scope.row.user.avatar)"></el-avatar>
              <span class="username">{{ scope.row.user.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="300">
          <template slot-scope="scope">
            <div class="essay-content">{{ truncate(scope.row.content, 100) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="120" align="center">
          <template slot-scope="scope">
            <div class="image-preview" v-if="scope.row.images && scope.row.images.length > 0">
              <el-image :src="getFullUrl(scope.row.images[0])"
                :preview-src-list="scope.row.images.map(img => getFullUrl(img))" fit="cover"
                style="width: 50px; height: 50px; border-radius: 4px;">
              </el-image>
              <span v-if="scope.row.images.length > 1" class="image-count">
                +{{ scope.row.images.length - 1 }}
              </span>
            </div>
            <span v-else class="no-image">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="comments" label="评论数" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.comments }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="发布时间" width="160" align="center"></el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button type="primary" size="mini" icon="el-icon-view" @click="handleView(scope.row)">
                详情
              </el-button>
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination class="pagination" background layout="total, sizes, prev, pager, next, jumper" :total="total"
        :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :current-page="currentPage"
        @size-change="handleSizeChange" @current-change="handlePageChange">
      </el-pagination>
    </el-card>

    <!-- 发布随笔弹窗 -->
    <el-dialog title="发布随笔" :visible.sync="addVisible" width="600px" @close="resetAddForm">
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="80px">
        <el-form-item label="内容" prop="content">
          <el-input v-model="addForm.content" type="textarea" :rows="6" placeholder="分享你的想法..." maxlength="1000"
            show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="图片">
          <el-upload action="#" list-type="picture-card" :auto-upload="false" :file-list="addForm.fileList"
            :on-change="handleFileChange" :on-remove="handleFileRemove" :before-upload="beforeUpload" accept="image/*"
            :limit="9">
            <i class="el-icon-plus"></i>
          </el-upload>
          <div class="upload-tip">最多上传9张图片，支持 jpg/png/gif 格式</div>
        </el-form-item>
        <el-form-item label="视频">
          <el-upload action="#" :auto-upload="false" :file-list="addForm.videoList" :on-change="handleVideoChange"
            :on-remove="handleVideoRemove" :before-upload="beforeVideoUpload" accept="video/*" :limit="3">
            <el-button size="small" type="primary" icon="el-icon-upload">上传视频</el-button>
          </el-upload>
          <div class="upload-tip">最多上传3个视频，支持 mp4/webm 格式，单个不超过100MB</div>
          <!-- 视频预览 -->
          <div class="video-preview-list" v-if="addForm.videoList && addForm.videoList.length > 0">
            <div class="video-preview-item" v-for="(video, index) in addForm.videoList" :key="index">
              <video :src="video.url" controls width="200"></video>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitEssay" :loading="submitting">发布</el-button>
      </div>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog title="随笔详情" :visible.sync="detailVisible" width="700px" top="5vh">
      <div class="essay-detail" v-if="currentEssay">
        <!-- 用户信息 -->
        <div class="detail-user">
          <el-avatar :size="48" :src="getFullUrl(currentEssay.user?.avatar)"></el-avatar>
          <div class="user-meta">
            <span class="name">{{ currentEssay.user?.name }}</span>
            <span class="date">{{ currentEssay.date }}</span>
          </div>
        </div>

        <!-- 内容 -->
        <div class="detail-content">{{ currentEssay.content }}</div>

        <!-- 图片 -->
        <div class="detail-images" v-if="currentEssay.images && currentEssay.images.length > 0">
          <el-image v-for="(img, index) in currentEssay.images" :key="index" :src="getFullUrl(img)"
            :preview-src-list="currentEssay.images.map(i => getFullUrl(i))" fit="cover" class="detail-image">
          </el-image>
        </div>

        <!-- 视频 -->
        <div class="detail-videos" v-if="currentEssay.videos && currentEssay.videos.length > 0">
          <video v-for="(video, index) in currentEssay.videos" :key="index" :src="getFullUrl(video)" controls
            class="detail-video"></video>
        </div>

        <!-- 评论列表 -->
        <div class="detail-comments">
          <div class="comments-header">
            <span>评论 ({{ currentEssay.comments }})</span>
            <el-button type="text" size="small" @click="loadComments" :loading="commentsLoading">
              刷新
            </el-button>
          </div>
          <div class="comments-list" v-loading="commentsLoading">
            <div class="comment-item" v-for="comment in commentList" :key="comment.id">
              <el-avatar :size="32" :src="getFullUrl(comment.user?.avatar)"></el-avatar>
              <div class="comment-body">
                <div class="comment-header">
                  <span class="comment-user">{{ comment.user?.name }}</span>
                  <span class="comment-date">{{ comment.date }}</span>
                  <el-button type="text" size="mini" class="delete-btn" @click="handleDeleteComment(comment)">
                    删除
                  </el-button>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <!-- 图片 -->
                <div class="comment-images" v-if="comment.images && comment.images.length > 0">
                  <el-image v-for="(img, idx) in comment.images" :key="idx" :src="getFullUrl(img)"
                    :preview-src-list="comment.images.map(i => getFullUrl(i))" fit="cover" class="comment-image">
                  </el-image>
                </div>
                <!-- 回复列表 -->
                <div class="replies" v-if="comment.replies && comment.replies.length > 0">
                  <div class="reply-item" v-for="reply in comment.replies" :key="reply.id">
                    <span class="reply-user">{{ reply.user?.name }}</span>
                    <span v-if="reply.replyTo" class="reply-to">回复 @{{ reply.replyTo }}</span>
                    <span class="reply-content">：{{ reply.content }}</span>
                    <span class="reply-date">{{ reply.date }}</span>
                    <el-button type="text" size="mini" class="delete-btn" @click="handleDeleteComment(reply)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-if="commentList.length === 0 && !commentsLoading" description="暂无评论"></el-empty>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { http, getResourceUrl } from '@/utils/request'

export default {
  name: 'EssayList',
  data() {
    return {
      loading: false,
      essayList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      searchForm: {
        keyword: ''
      },
      detailVisible: false,
      currentEssay: null,
      commentList: [],
      commentsLoading: false,
      // 发布随笔
      addVisible: false,
      submitting: false,
      addForm: {
        content: '',
        fileList: [],
        videoList: []
      },
      addRules: {
        content: [{ required: true, message: '请输入随笔内容', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.loadEssayList()
  },
  methods: {
    getFullUrl(path) {
      return getResourceUrl(path)
    },
    truncate(text, maxLength) {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },
    async loadEssayList() {
      this.loading = true
      try {
        const res = await http.get('/api/essay/admin/list', {
          page: this.currentPage,
          size: this.pageSize,
          keyword: this.searchForm.keyword || undefined
        })
        this.essayList = res.data?.list || []
        this.total = res.data?.total || 0
      } catch (error) {
        console.error('加载随笔列表失败:', error)
        this.$message.error('加载随笔列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadEssayList()
    },
    handleReset() {
      this.searchForm.keyword = ''
      this.currentPage = 1
      this.loadEssayList()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.loadEssayList()
    },
    handlePageChange(page) {
      this.currentPage = page
      this.loadEssayList()
    },
    handleView(row) {
      this.currentEssay = row
      this.detailVisible = true
      this.loadComments()
    },
    async loadComments() {
      if (!this.currentEssay) return
      this.commentsLoading = true
      try {
        const res = await http.get(`/api/essay/${this.currentEssay.id}/comments`, {
          page: 1,
          pageSize: 100
        })
        this.commentList = res.data?.list || []
      } catch (error) {
        console.error('加载评论失败:', error)
      } finally {
        this.commentsLoading = false
      }
    },
    handleDelete(row) {
      this.$confirm(`确定要删除这条随笔吗？删除后评论也会一并删除。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await http.delete(`/api/essay/admin/${row.id}`)
          this.$message.success('删除成功')
          this.loadEssayList()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => { })
    },
    handleDeleteComment(comment) {
      this.$confirm('确定要删除这条评论吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await http.delete(`/api/essay/admin/comment/${comment.id}`)
          this.$message.success('删除成功')
          this.loadComments()
          // 更新评论数
          if (this.currentEssay) {
            this.currentEssay.comments = Math.max(0, this.currentEssay.comments - 1)
          }
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => { })
    },
    // 发布随笔相关方法
    handleAdd() {
      this.addVisible = true
    },
    resetAddForm() {
      this.addForm = {
        content: '',
        fileList: [],
        videoList: []
      }
      if (this.$refs.addForm) {
        this.$refs.addForm.clearValidate()
      }
    },
    handleFileChange(file, fileList) {
      this.addForm.fileList = fileList
    },
    handleFileRemove(file, fileList) {
      this.addForm.fileList = fileList
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB!')
        return false
      }
      return true
    },
    handleVideoChange(file, fileList) {
      this.addForm.videoList = fileList
    },
    handleVideoRemove(file, fileList) {
      this.addForm.videoList = fileList
    },
    beforeVideoUpload(file) {
      const isVideo = file.type.startsWith('video/')
      const isLt100M = file.size / 1024 / 1024 < 100
      if (!isVideo) {
        this.$message.error('只能上传视频文件!')
        return false
      }
      if (!isLt100M) {
        this.$message.error('视频大小不能超过 100MB!')
        return false
      }
      return true
    },
    async handleSubmitEssay() {
      this.$refs.addForm.validate(async (valid) => {
        if (!valid) return

        this.submitting = true
        try {
          // 先上传图片
          const images = []
          for (const file of this.addForm.fileList) {
            if (file.raw) {
              const formData = new FormData()
              formData.append('file', file.raw)
              const uploadRes = await http.post('/api/essay/uploadImage', formData)
              if (uploadRes.data) {
                images.push(uploadRes.data)
              }
            }
          }

          // 上传视频
          const videos = []
          for (const file of this.addForm.videoList) {
            if (file.raw) {
              const formData = new FormData()
              formData.append('file', file.raw)
              const uploadRes = await http.post('/api/essay/uploadVideo', formData)
              if (uploadRes.data) {
                videos.push(uploadRes.data)
              }
            }
          }

          // 发布随笔
          await http.post('/api/essay/publish', {
            content: this.addForm.content,
            images: images,
            videos: videos
          })

          this.$message.success('发布成功')
          this.addVisible = false
          this.loadEssayList()
        } catch (error) {
          console.error('发布失败:', error)
          this.$message.error(error.message || '发布失败')
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style scoped>
.essay-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.table-card {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
}

.essay-content {
  line-height: 1.6;
  color: #333;
}

.image-preview {
  display: flex;
  align-items: center;
  gap: 4px;
}

.image-count {
  font-size: 12px;
  color: #999;
}

.no-image {
  color: #999;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 详情弹窗 */
.essay-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-meta .name {
  font-weight: 500;
  font-size: 16px;
}

.user-meta .date {
  font-size: 13px;
  color: #999;
}

.detail-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.detail-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
}

.detail-videos {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.video-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.video-preview-item video {
  border-radius: 8px;
  max-height: 150px;
}

.detail-comments {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-user {
  font-weight: 500;
  color: #333;
}

.comment-date {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  color: #f56c6c;
  padding: 0;
  margin-left: auto;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.comment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.comment-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  cursor: pointer;
}

.replies {
  margin-top: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
}

.reply-item {
  font-size: 13px;
  line-height: 2;
  color: #666;
}

.reply-user {
  color: #409eff;
  font-weight: 500;
}

.reply-to {
  color: #999;
  margin: 0 4px;
}

.reply-content {
  color: #333;
}

.reply-date {
  color: #999;
  margin-left: 8px;
  font-size: 12px;
}

.reply-item .delete-btn {
  margin-left: 8px;
  font-size: 12px;
}
</style>
