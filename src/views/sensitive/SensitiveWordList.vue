<template>
  <div class="sensitive-word-list">
    <el-card class="operation-card">
      <div class="operation-header">
        <div class="left-ops">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item>
              <el-input v-model="searchForm.keyword" placeholder="搜索敏感词" clearable @keyup.enter.native="handleSearch"
                style="width: 200px"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="right-ops">
          <el-select v-model="currentStrategy" placeholder="过滤策略" @change="handleStrategyChange" class="strategy-select">
            <el-option label="替换模式 (replace)" value="replace"></el-option>
            <el-option label="禁止模式 (block)" value="block"></el-option>
          </el-select>
          <el-button type="primary" icon="el-icon-plus" @click="handleAdd">添加敏感词</el-button>
          <el-button type="success" icon="el-icon-upload2" @click="batchVisible = true">批量导入</el-button>
          <el-button type="info" icon="el-icon-aim" @click="testVisible = true">测试过滤</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="wordList" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="word" label="敏感词" min-width="150"></el-table-column>
        <el-table-column prop="replacement" label="替换文本" width="150" align="center">
          <template slot-scope="scope">
            <span v-if="currentStrategy === 'block'">-</span>
            <el-tag v-else size="small" type="info">{{ scope.row.replacement || '***' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.enabled" :active-value="1" :inactive-value="0"
              @change="handleToggleEnabled(scope.row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" align="center"></el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" icon="el-icon-edit" circle @click="handleEdit(scope.row)"></el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" circle
              @click="handleDelete(scope.row)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination class="pagination" background layout="total, prev, pager, next" :total="total"
        :page-size="pageSize" :current-page="currentPage" @current-change="handlePageChange">
      </el-pagination>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog :title="form.id ? '编辑敏感词' : '添加敏感词'" :visible.sync="dialogVisible" width="500px" @close="resetForm">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="form.word" placeholder="请输入敏感词"></el-input>
        </el-form-item>
        <el-form-item label="替换文本" prop="replacement">
          <el-input v-model="form.replacement" placeholder="默认为 ***"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </div>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog title="批量导入敏感词" :visible.sync="batchVisible" width="600px">
      <el-input type="textarea" v-model="batchText" :rows="10" placeholder="请输入敏感词，每行一个"></el-input>
      <div slot="footer">
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchSubmit" :loading="batchSubmitting">导入</el-button>
      </div>
    </el-dialog>

    <!-- 测试过滤弹窗 -->
    <el-dialog title="测试过滤效果" :visible.sync="testVisible" width="600px">
      <div class="test-container">
        <el-input type="textarea" v-model="testContent" :rows="4" placeholder="请输入包含敏感词的测试文本..."></el-input>
        <div class="test-actions">
          <el-button type="primary" size="small" @click="handleTestFilter">测试</el-button>
        </div>
        <div class="test-result" v-if="testResult">
          <div class="result-item">
            <span class="label">当前策略：</span>
            <el-tag :type="testResult.strategy === 'block' ? 'danger' : 'warning'">
              {{ testResult.strategy === 'block' ? '禁止模式' : '替换模式' }}
            </el-tag>
          </div>
          <div class="result-item" v-if="testResult.foundWords && testResult.foundWords.length">
            <span class="label">发现敏感词：</span>
            <div class="tags">
              <el-tag size="mini" type="danger" v-for="(word, idx) in testResult.foundWords" :key="idx">{{ word
                }}</el-tag>
            </div>
          </div>
          <div class="result-item">
            <span class="label">过滤结果：</span>
            <div class="filtered-content">{{ testResult.filtered }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { http } from '@/utils/request'

export default {
  name: 'SensitiveWordList',
  data() {
    return {
      loading: false,
      wordList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      searchForm: {
        keyword: ''
      },
      currentStrategy: 'replace',
      // 添加/编辑
      dialogVisible: false,
      submitting: false,
      form: {
        id: null,
        word: '',
        replacement: '***',
        enabled: 1
      },
      rules: {
        word: [{ required: true, message: '请输入敏感词', trigger: 'blur' }]
      },
      // 批量导入
      batchVisible: false,
      batchSubmitting: false,
      batchText: '',
      // 测试
      testVisible: false,
      testContent: '',
      testResult: null
    }
  },
  created() {
    this.loadStrategy()
    this.loadList()
  },
  methods: {
    async loadStrategy() {
      try {
        const res = await http.get('/api/admin/sensitive-word/strategy')
        if (res.data) {
          this.currentStrategy = res.data
        }
      } catch (error) {
        console.error('获取策略失败:', error)
      }
    },
    async loadList() {
      this.loading = true
      try {
        const res = await http.get('/api/admin/sensitive-word/list', {
          page: this.currentPage,
          size: this.pageSize,
          keyword: this.searchForm.keyword || undefined
        })
        this.wordList = res.data.list || []
        this.total = res.data.total || 0
      } catch (error) {
        this.$message.error('加载列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadList()
    },
    handlePageChange(page) {
      this.currentPage = page
      this.loadList()
    },
    async handleStrategyChange(val) {
      try {
        await http.put('/api/admin/sensitive-word/strategy', { strategy: val })
        this.$message.success('策略已更新')
      } catch (error) {
        this.$message.error('更新策略失败')
        this.loadStrategy() // 回滚
      }
    },
    handleAdd() {
      this.resetForm()
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.form = {
        id: row.id,
        word: row.word,
        replacement: row.replacement,
        enabled: row.enabled
      }
      this.dialogVisible = true
    },
    resetForm() {
      this.form = {
        id: null,
        word: '',
        replacement: '***',
        enabled: 1
      }
      if (this.$refs.form) {
        this.$refs.form.clearValidate()
      }
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.form.id) {
            await http.put(`/api/admin/sensitive-word/${this.form.id}`, this.form)
            this.$message.success('更新成功')
          } else {
            await http.post('/api/admin/sensitive-word', this.form)
            this.$message.success('添加成功')
          }
          this.dialogVisible = false
          this.loadList()
        } catch (error) {
          this.$message.error(error.message || '操作失败')
        } finally {
          this.submitting = false
        }
      })
    },
    handleDelete(row) {
      this.$confirm('确定要删除该敏感词吗？', '提示', {
        type: 'warning'
      }).then(async () => {
        try {
          await http.delete(`/api/admin/sensitive-word/${row.id}`)
          this.$message.success('删除成功')
          this.loadList()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => { })
    },
    async handleToggleEnabled(row) {
      try {
        await http.post(`/api/admin/sensitive-word/${row.id}/toggle`)
        this.$message.success('状态已更新')
      } catch (error) {
        row.enabled = row.enabled === 1 ? 0 : 1 // 回滚
        this.$message.error('操作失败')
      }
    },
    async handleBatchSubmit() {
      if (!this.batchText.trim()) {
        return this.$message.warning('请输入敏感词')
      }
      const words = this.batchText.split('\n').map(w => w.trim()).filter(w => w)
      if (words.length === 0) return

      this.batchSubmitting = true
      try {
        await http.post('/api/admin/sensitive-word/batch', { words })
        this.$message.success(`成功导入 ${words.length} 个敏感词`)
        this.batchVisible = false
        this.batchText = ''
        this.loadList()
      } catch (error) {
        this.$message.error(error.message || '导入失败')
      } finally {
        this.batchSubmitting = false
      }
    },
    async handleTestFilter() {
      if (!this.testContent.trim()) return
      try {
        const res = await http.post('/api/admin/sensitive-word/test', {
          content: this.testContent
        })
        this.testResult = res.data
      } catch (error) {
        // 如果是block模式且被拦截，后端可能返回错误
        this.testResult = {
          strategy: this.currentStrategy,
          filtered: error.message,
          foundWords: []
        }
      }
    }
  }
}
</script>

<style scoped>
.sensitive-word-list {
  padding: 20px;
}

.operation-card {
  margin-bottom: 20px;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 0;
}

.right-ops {
  display: flex;
  gap: 10px;
}

.strategy-select {
  width: 160px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.test-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.test-result {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.result-item {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-item .label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 90px;
  color: #606266;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.filtered-content {
  color: #333;
  line-height: 1.5;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  width: 100%;
}
</style>
