<template>
  <div class="user-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchForm.keyword" placeholder="搜索用户名/邮箱" style="width: 200px" clearable
          @keyup.enter.native="handleSearch" />
        <el-select v-model="searchForm.role" placeholder="选择角色" clearable style="width: 120px">
          <el-option label="全部角色" :value="null" />
          <el-option label="普通用户" :value="0" />
          <el-option label="管理员" :value="1" />
        </el-select>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="userList" v-loading="loading" style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template slot-scope="scope">
            <el-avatar :size="40" :src="getAvatarUrl(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" show-overflow-tooltip />
        <el-table-column label="性别" width="80">
          <template slot-scope="scope">
            {{ scope.row.gender === 1 ? '男' : scope.row.gender === 2 ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="等级" width="80">
          <template slot-scope="scope">
            <span>Lv.{{ scope.row.level || 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.role === 1 ? 'danger' : 'info'" size="small">
              {{ scope.row.role === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="随笔/评论" width="100">
          <template slot-scope="scope">
            <span>{{ scope.row.essayCount || 0 }}/{{ scope.row.commentCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)"
              v-if="scope.row.role !== 1">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination style="margin-top: 20px; text-align: right" :current-page="pagination.page"
        :page-size="pagination.size" :total="pagination.total" layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange" />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog title="编辑用户" :visible.sync="dialogVisible" width="500px">
      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" disabled />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
            <el-radio :label="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.bio" type="textarea" :rows="3" />
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
  name: 'UserList',
  data() {
    return {
      loading: false,
      searchForm: {
        keyword: '',
        role: null
      },
      userList: [],
      pagination: {
        page: 1,
        size: 10,
        total: 0
      },
      dialogVisible: false,
      submitting: false,
      form: {
        id: null,
        username: '',
        email: '',
        gender: 0,
        bio: ''
      }
    }
  },
  created() {
    this.loadUsers()
  },
  methods: {
    getAvatarUrl(user) {
      const avatar = user.avatar
      if (!avatar) {
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id
      }
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar
      }
      return getResourceUrl(avatar)
    },
    async loadUsers() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          size: this.pagination.size
        }
        if (this.searchForm.keyword) {
          params.keyword = this.searchForm.keyword
        }
        if (this.searchForm.role !== null) {
          params.role = this.searchForm.role
        }
        const res = await http.get('/api/user/admin/list', params)
        this.userList = res.data.list || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载用户失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadUsers()
    },
    handleReset() {
      this.searchForm.keyword = ''
      this.searchForm.role = null
      this.pagination.page = 1
      this.loadUsers()
    },
    handleEdit(row) {
      this.form = { ...row }
      this.dialogVisible = true
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除该用户吗？删除后该用户将无法登录！', '提示', { type: 'warning' })
        await http.delete('/api/user/admin/delete', { id: row.id })
        this.$message.success('删除成功')
        this.loadUsers()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    },
    async handleSubmit() {
      this.submitting = true
      try {
        await http.put('/api/user/admin/update', this.form)
        this.$message.success('更新成功')
        this.dialogVisible = false
        this.loadUsers()
      } catch (error) {
        console.error('更新失败:', error)
        this.$message.error('更新失败')
      } finally {
        this.submitting = false
      }
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadUsers()
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
</style>
