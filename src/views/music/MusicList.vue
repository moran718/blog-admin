<template>
  <div class="music-list">
    <el-card>
      <div slot="header" class="header">
        <span>音乐管理</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">添加音乐</el-button>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="搜索歌曲名/歌手/专辑" clearable
            @keyup.enter.native="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <!-- 音乐列表 -->
      <el-table :data="musicList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="封面" width="80">
          <template slot-scope="scope">
            <el-image v-if="scope.row.cover" :src="getFullUrl(scope.row.cover)"
              :preview-src-list="[getFullUrl(scope.row.cover)]" style="width: 50px; height: 50px; border-radius: 50%;"
              fit="cover" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="歌曲名称" min-width="150" />
        <el-table-column prop="artist" label="歌手" width="120" />
        <el-table-column prop="album" label="专辑" width="150" />
        <el-table-column prop="duration" label="时长" width="80">
          <template slot-scope="scope">
            {{ formatDuration(scope.row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"
              @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination background layout="total, prev, pager, next" :total="pagination.total" :page-size="pagination.size"
        :current-page="pagination.page" @current-change="handlePageChange"
        style="margin-top: 20px; text-align: right" />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="歌曲名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入歌曲名称" />
        </el-form-item>
        <el-form-item label="歌手">
          <el-input v-model="form.artist" placeholder="请输入歌手名称" />
        </el-form-item>
        <el-form-item label="专辑">
          <el-input v-model="form.album" placeholder="请输入专辑名称" />
        </el-form-item>
        <el-form-item label="封面">
          <div class="upload-section">
            <el-upload class="cover-uploader" action="#" :show-file-list="false" :before-upload="beforeCoverUpload"
              :http-request="uploadCover" accept="image/*">
              <img v-if="form.cover" :src="getFullUrl(form.cover)" class="cover-preview-img" />
              <i v-else class="el-icon-plus cover-uploader-icon"></i>
            </el-upload>
            <span class="upload-tip">支持 jpg、png 格式，最大 5MB</span>
          </div>
        </el-form-item>
        <el-form-item label="音乐文件">
          <div class="upload-section">
            <el-upload class="audio-uploader" action="#" :show-file-list="false" :before-upload="beforeAudioUpload"
              :http-request="uploadAudio" accept="audio/*">
              <el-button size="small" type="primary" icon="el-icon-upload">
                {{ form.url ? '重新上传' : '上传音乐' }}
              </el-button>
            </el-upload>
            <span v-if="form.url" class="audio-info">
              <i class="el-icon-video-play"></i> 已上传音乐文件
              <audio :src="getFullUrl(form.url)" controls style="height: 30px; margin-left: 10px;"></audio>
            </span>
            <span class="upload-tip">支持 mp3、wav、flac 格式，最大 20MB</span>
          </div>
        </el-form-item>
        <el-form-item label="时长(秒)">
          <el-input-number v-model="form.duration" :min="0" placeholder="时长" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { http, getResourceUrl } from '@/utils/request'

export default {
  name: 'MusicList',
  data() {
    return {
      loading: false,
      submitting: false,
      musicList: [],
      searchForm: {
        keyword: ''
      },
      pagination: {
        page: 1,
        size: 10,
        total: 0
      },
      dialogVisible: false,
      dialogTitle: '',
      form: {
        id: null,
        name: '',
        artist: '',
        album: '',
        cover: '',
        url: '',
        duration: 0,
        sortOrder: 0,
        status: 1
      },
      rules: {
        name: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.loadMusic()
  },
  methods: {
    async loadMusic() {
      this.loading = true
      try {
        const res = await http.get('/api/music/admin/list', {
          page: this.pagination.page,
          size: this.pagination.size,
          keyword: this.searchForm.keyword || undefined
        })
        this.musicList = res.data.list || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载音乐列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadMusic()
    },
    handleAdd() {
      this.dialogTitle = '添加音乐'
      this.form = {
        id: null,
        name: '',
        artist: '',
        album: '',
        cover: '',
        url: '',
        duration: 0,
        sortOrder: 0,
        status: 1
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogTitle = '编辑音乐'
      this.form = {
        id: row.id,
        name: row.name,
        artist: row.artist || '',
        album: row.album || '',
        cover: row.cover || '',
        url: row.url || '',
        duration: row.duration || 0,
        sortOrder: row.sortOrder || 0,
        status: row.status
      }
      this.dialogVisible = true
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除该音乐吗？删除后不可恢复！', '提示', { type: 'warning' })
        await http.delete(`/api/music/delete/${row.id}`)
        this.$message.success('删除成功')
        this.loadMusic()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    },
    async handleStatusChange(row) {
      try {
        await http.put(`/api/music/status/${row.id}`, null, { status: row.status })
        this.$message.success('状态更新成功')
      } catch (error) {
        // 恢复状态
        row.status = row.status === 1 ? 0 : 1
        console.error('状态更新失败:', error)
      }
    },
    handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.form.id) {
            await http.put('/api/music/update', this.form)
          } else {
            await http.post('/api/music/add', this.form)
          }
          this.$message.success(this.form.id ? '更新成功' : '添加成功')
          this.dialogVisible = false
          this.loadMusic()
        } catch (error) {
          console.error('保存失败:', error)
          this.$message.error('保存失败')
        } finally {
          this.submitting = false
        }
      })
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadMusic()
    },
    formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '-'
      const min = Math.floor(seconds / 60)
      const sec = seconds % 60
      return `${min}:${sec.toString().padStart(2, '0')}`
    },
    // 获取完整资源URL
    getFullUrl(path) {
      return getResourceUrl(path)
    },
    // 封面上传前验证
    beforeCoverUpload(file) {
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
    // 上传封面
    async uploadCover(options) {
      try {
        const res = await http.upload('/api/music/uploadCover', options.file)
        this.form.cover = res.data
        this.$message.success('封面上传成功')
      } catch (error) {
        console.error('封面上传失败:', error)
        this.$message.error('封面上传失败')
      }
    },
    // 音频上传前验证
    beforeAudioUpload(file) {
      const isAudio = file.type.startsWith('audio/')
      const isLt20M = file.size / 1024 / 1024 < 20

      if (!isAudio) {
        this.$message.error('只能上传音频文件!')
        return false
      }
      if (!isLt20M) {
        this.$message.error('音频大小不能超过 20MB!')
        return false
      }
      return true
    },
    // 上传音频
    async uploadAudio(options) {
      try {
        const res = await http.upload('/api/music/uploadAudio', options.file)
        this.form.url = res.data
        // 自动获取音频时长
        this.getAudioDuration(res.data)
        this.$message.success('音乐上传成功')
      } catch (error) {
        console.error('音乐上传失败:', error)
        this.$message.error('音乐上传失败')
      }
    },
    // 获取音频时长
    getAudioDuration(url) {
      const audio = new Audio(getResourceUrl(url))
      audio.addEventListener('loadedmetadata', () => {
        this.form.duration = Math.floor(audio.duration)
      })
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #409EFF;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.cover-preview-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #999;
}

.audio-info {
  display: flex;
  align-items: center;
  color: #67C23A;
  font-size: 13px;
}

.audio-info i {
  margin-right: 5px;
}
</style>
