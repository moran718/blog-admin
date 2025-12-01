<template>
  <div class="category-list">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增一级分类</el-button>
      </div>

      <el-table :data="categoryList" v-loading="loading" row-key="id" :tree-props="{ children: 'children' }"
        default-expand-all style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="分类名称">
          <template slot-scope="scope">
            <span v-if="scope.row.icon">{{ scope.row.icon }} </span>
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryKey" label="分类Key" width="120" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="articleCount" label="文章数" width="80" />
        <el-table-column label="操作" width="280">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="success" size="mini" @click="handleAddChild(scope.row)"
              v-if="!scope.row.parentId">添加子分类</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图标" v-if="!form.parentId">
          <el-input v-model="form.icon" placeholder="请输入图标（如 🔧）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
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
import { http } from '@/utils/request'

export default {
  name: 'CategoryList',
  data() {
    return {
      loading: false,
      categoryList: [],
      dialogVisible: false,
      dialogTitle: '新增分类',
      submitting: false,
      form: {
        id: null,
        name: '',
        icon: '',
        parentId: null,
        sort: 0
      },
      rules: {
        name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.loadCategories()
  },
  methods: {
    async loadCategories() {
      this.loading = true
      try {
        const res = await http.get('/api/category/tree')
        this.categoryList = res.data || []
      } catch (error) {
        console.error('加载分类失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleAdd() {
      this.dialogTitle = '新增一级分类'
      this.form = { id: null, name: '', icon: '', parentId: null, sort: 0 }
      this.dialogVisible = true
    },
    handleAddChild(row) {
      this.dialogTitle = '添加子分类 - ' + row.name
      this.form = { id: null, name: '', icon: '', parentId: row.id, sort: 0 }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogTitle = '编辑分类'
      this.form = {
        id: row.id,
        name: row.name,
        icon: row.icon || '',
        parentId: row.parentId,
        sort: row.sortOrder || 0
      }
      this.dialogVisible = true
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除该分类吗？删除后不可恢复！', '提示', { type: 'warning' })
        await http.delete(`/api/category/delete/${row.id}`)
        this.$message.success('删除成功')
        this.loadCategories()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
        }
      }
    },
    handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.form.id) {
            await http.put('/api/category/update', this.form)
          } else {
            await http.post('/api/category/add', this.form)
          }
          this.$message.success(this.form.id ? '更新成功' : '添加成功')
          this.dialogVisible = false
          this.loadCategories()
        } catch (error) {
          console.error('保存失败:', error)
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
}
</style>
