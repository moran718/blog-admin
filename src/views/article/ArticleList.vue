<template>
  <div class="article-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchForm.keyword" placeholder="搜索文章标题" style="width: 200px" clearable
          @keyup.enter.native="handleSearch" />
        <el-select v-model="searchForm.categoryId" placeholder="选择分类" clearable style="width: 150px">
          <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button type="success" icon="el-icon-plus" @click="handleAdd">新增文章</el-button>
      </div>

      <!-- 文章表格 -->
      <el-table :data="articleList" v-loading="loading" style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="views" label="浏览" width="80" />
        <el-table-column prop="likes" label="点赞" width="80" />
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
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
  name: 'ArticleList',
  data() {
    return {
      loading: false,
      searchForm: {
        keyword: '',
        categoryId: ''
      },
      articleList: [],
      categories: [],
      pagination: {
        page: 1,
        size: 10,
        total: 0
      }
    }
  },
  created() {
    this.loadArticles()
    this.loadCategories()
  },
  methods: {
    async loadArticles() {
      this.loading = true
      try {
        const res = await http.get('/api/record/list', {
          page: this.pagination.page,
          pageSize: this.pagination.size,
          keyword: this.searchForm.keyword || undefined
        })
        // 后端返回的是 list 字段，不是 records
        this.articleList = res.data.list || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载文章失败:', error)
      } finally {
        this.loading = false
      }
    },
    async loadCategories() {
      try {
        const res = await http.get('/api/record/category-tree')
        this.categories = res.data || []
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadArticles()
    },
    handleAdd() {
      this.$router.push('/articles/edit')
    },
    handleEdit(row) {
      this.$router.push(`/articles/edit/${row.id}`)
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除这篇文章吗？', '提示', {
          type: 'warning'
        })
        await http.delete(`/api/record/delete/${row.id}`)
        this.$message.success('删除成功')
        this.loadArticles()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        }
      }
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadArticles()
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
  flex-wrap: wrap;
}
</style>
