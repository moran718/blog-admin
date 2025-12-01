<template>
  <div class="tag-list">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增标签</el-button>
      </div>

      <el-table :data="tagList" v-loading="loading" style="width: 100%; margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标签名称" width="200" />
        <el-table-column label="预览" width="150">
          <template slot-scope="scope">
            <el-tag :style="{ backgroundColor: scope.row.color, borderColor: scope.row.color }" size="small">
              {{ scope.row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色值" width="120" />
        <el-table-column prop="useCount" label="使用次数" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination style="margin-top: 20px; text-align: right" :current-page="pagination.page"
        :page-size="pagination.size" :total="pagination.total" layout="total, prev, pager, next"
        @current-change="handlePageChange" />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="400px">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <div class="color-picker-row">
            <el-color-picker v-model="form.color" />
            <span class="color-value">{{ form.color }}</span>
          </div>
          <div class="preset-colors">
            <span v-for="c in presetColors" :key="c" class="preset-color" :style="{ backgroundColor: c }"
              @click="form.color = c"></span>
          </div>
        </el-form-item>
        <el-form-item label="预览">
          <el-tag :style="{ backgroundColor: form.color, borderColor: form.color }">
            {{ form.name || '标签预览' }}
          </el-tag>
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
  name: 'TagList',
  data() {
    return {
      loading: false,
      tagList: [],
      pagination: {
        page: 1,
        size: 10,
        total: 0
      },
      dialogVisible: false,
      dialogTitle: '新增标签',
      submitting: false,
      form: {
        id: null,
        name: '',
        color: '#409EFF'
      },
      rules: {
        name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
      },
      // 预设颜色
      presetColors: [
        '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
        '#00d4ff', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
        '#1dd1a1', '#5f27cd', '#54a0ff', '#c8d6e5', '#222f3e'
      ]
    }
  },
  created() {
    this.loadTags()
  },
  methods: {
    async loadTags() {
      this.loading = true
      try {
        const res = await http.get('/api/tag/list', {
          page: this.pagination.page,
          size: this.pagination.size
        })
        this.tagList = res.data.records || []
        this.pagination.total = res.data.total || 0
      } catch (error) {
        console.error('加载标签失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleAdd() {
      this.dialogTitle = '新增标签'
      this.form = { id: null, name: '', color: '#409EFF' }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogTitle = '编辑标签'
      this.form = {
        id: row.id,
        name: row.name,
        color: row.color || '#409EFF'
      }
      this.dialogVisible = true
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除该标签吗？删除后不可恢复！', '提示', { type: 'warning' })
        await http.delete(`/api/tag/delete/${row.id}`)
        this.$message.success('删除成功')
        this.loadTags()
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
            await http.put('/api/tag/update', this.form)
          } else {
            await http.post('/api/tag/add', this.form)
          }
          this.$message.success(this.form.id ? '更新成功' : '添加成功')
          this.dialogVisible = false
          this.loadTags()
        } catch (error) {
          console.error('保存失败:', error)
        } finally {
          this.submitting = false
        }
      })
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadTags()
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }
  }
}
</script>

<style lang="less" scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .color-value {
    font-family: monospace;
    color: #666;
  }
}

.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  .preset-color {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.1);
      border-color: #333;
    }
  }
}
</style>
