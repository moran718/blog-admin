<template>
  <div class="browse-list">
    <el-card>
      <!-- 统计信息 -->
      <div class="stats-bar">
        <el-tag type="info" size="medium">总浏览量: {{ stats.total || 0 }}</el-tag>
        <el-tag type="success" size="medium">今日浏览: {{ stats.today || 0 }}</el-tag>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchForm.ip" placeholder="搜索IP地址" style="width: 200px" clearable
          @keyup.enter.native="handleSearch" />
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        <el-button type="danger" icon="el-icon-delete" @click="handleClearAll">清空记录</el-button>
      </div>

      <el-table :data="browseList" v-loading="loading" style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="ip" label="IP地址" width="150">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.ip }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="访问URL" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.url || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="userAgent" label="浏览器信息" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ getBrowserInfo(scope.row.userAgent) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="访问时间" width="180">
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
  name: 'BrowseList',
  data() {
    return {
      loading: false,
      searchForm: {
        ip: ''
      },
      browseList: [],
      stats: {
        total: 0,
        today: 0
      },
      pagination: {
        page: 1,
        size: 10,
        total: 0
      }
    }
  },
  created() {
    this.loadStats()
    this.loadBrowseList()
  },
  methods: {
    async loadStats() {
      try {
        const res = await http.get('/api/browse/admin/stats')
        this.stats = res.data || { total: 0, today: 0 }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },
    async loadBrowseList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          size: this.pagination.size
        }
        if (this.searchForm.ip) {
          params.ip = this.searchForm.ip
        }
        const res = await http.get('/api/browse/admin/list', params)
        this.browseList = res.data.list || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载浏览记录失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadBrowseList()
    },
    handleReset() {
      this.searchForm.ip = ''
      this.pagination.page = 1
      this.loadBrowseList()
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除这条浏览记录吗？', '提示', { type: 'warning' })
        await http.delete('/api/browse/admin/delete', { id: row.id })
        this.$message.success('删除成功')
        this.loadStats()
        this.loadBrowseList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    },
    async handleClearAll() {
      try {
        await this.$confirm('确定要清空所有浏览记录吗？此操作不可恢复！', '警告', { 
          type: 'warning',
          confirmButtonText: '确定清空',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger'
        })
        await http.delete('/api/browse/admin/clear')
        this.$message.success('清空成功')
        this.loadStats()
        this.loadBrowseList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('清空失败:', error)
        }
      }
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadBrowseList()
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    },
    getBrowserInfo(userAgent) {
      if (!userAgent) return '-'
      // 简单解析浏览器信息
      if (userAgent.includes('Chrome')) return 'Chrome'
      if (userAgent.includes('Firefox')) return 'Firefox'
      if (userAgent.includes('Safari')) return 'Safari'
      if (userAgent.includes('Edge')) return 'Edge'
      if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'IE'
      return '其他'
    }
  }
}
</script>

<style lang="less" scoped>
.stats-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>

