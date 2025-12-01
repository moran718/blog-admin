<template>
  <div class="level-list">
    <!-- 操作栏 -->
    <el-card class="action-card">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">添加等级</el-button>
      <el-button icon="el-icon-refresh" @click="loadLevelList">刷新</el-button>
    </el-card>

    <!-- 等级列表 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="levelList" border style="width: 100%">
        <el-table-column prop="id" label="等级ID" width="100" align="center"></el-table-column>
        <el-table-column label="图标" width="80" align="center">
          <template slot-scope="scope">
            <span class="level-icon">{{ scope.row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="等级名称" width="150">
          <template slot-scope="scope">
            <span class="level-name" :style="{ color: scope.row.color }">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="minExp" label="最低经验值" width="120" align="center">
          <template slot-scope="scope">
            <el-tag type="info">{{ scope.row.minExp }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="120" align="center">
          <template slot-scope="scope">
            <div class="color-preview">
              <span class="color-box" :style="{ backgroundColor: scope.row.color }"></span>
              <span class="color-code">{{ scope.row.color }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template slot-scope="scope">
            <span class="description">{{ scope.row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户数" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="small" type="success">{{ userCounts[scope.row.id] || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)"
                :disabled="userCounts[scope.row.id] > 0">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" @close="resetForm">
      <el-form ref="levelForm" :model="levelForm" :rules="rules" label-width="100px">
        <el-form-item label="等级ID" prop="id">
          <el-input-number v-model="levelForm.id" :min="1" :max="99" :disabled="isEdit"
            placeholder="请输入等级ID"></el-input-number>
          <span class="form-tip">等级ID决定等级顺序，数字越小等级越低</span>
        </el-form-item>
        <el-form-item label="等级名称" prop="name">
          <el-input v-model="levelForm.name" placeholder="请输入等级名称" maxlength="20"></el-input>
        </el-form-item>
        <el-form-item label="等级图标" prop="icon">
          <el-input v-model="levelForm.icon" placeholder="请输入等级图标（emoji）" maxlength="10">
            <template slot="append">
              <span class="icon-preview">{{ levelForm.icon }}</span>
            </template>
          </el-input>
          <div class="emoji-suggestions">
            <span v-for="emoji in suggestedEmojis" :key="emoji" class="emoji-item" @click="levelForm.icon = emoji">
              {{ emoji }}
            </span>
          </div>
        </el-form-item>
        <el-form-item label="最低经验值" prop="minExp">
          <el-input-number v-model="levelForm.minExp" :min="0" :max="999999"
            placeholder="达到该等级需要的最低经验值"></el-input-number>
        </el-form-item>
        <el-form-item label="等级颜色" prop="color">
          <el-color-picker v-model="levelForm.color"></el-color-picker>
          <span class="color-value">{{ levelForm.color }}</span>
        </el-form-item>
        <el-form-item label="等级描述" prop="description">
          <el-input v-model="levelForm.description" type="textarea" :rows="3" placeholder="请输入等级描述"
            maxlength="100" show-word-limit></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { http } from '@/utils/request'

export default {
  name: 'LevelList',
  data() {
    return {
      loading: false,
      levelList: [],
      userCounts: {},
      dialogVisible: false,
      isEdit: false,
      submitting: false,
      levelForm: {
        id: null,
        name: '',
        icon: '🌱',
        minExp: 0,
        color: '#9e9e9e',
        description: ''
      },
      rules: {
        id: [{ required: true, message: '请输入等级ID', trigger: 'blur' }],
        name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
        icon: [{ required: true, message: '请输入等级图标', trigger: 'blur' }],
        minExp: [{ required: true, message: '请输入最低经验值', trigger: 'blur' }],
        color: [{ required: true, message: '请选择等级颜色', trigger: 'change' }]
      },
      suggestedEmojis: ['🌱', '🌿', '🌳', '⭐', '👑', '🔥', '💎', '🏆', '🎖️', '🌟']
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑等级' : '添加等级'
    }
  },
  created() {
    this.loadLevelList()
  },
  methods: {
    async loadLevelList() {
      this.loading = true
      try {
        const res = await http.get('/api/level/list')
        this.levelList = res.data || []
        // 加载每个等级的用户数
        this.loadUserCounts()
      } catch (error) {
        console.error('加载等级列表失败:', error)
        this.$message.error('加载等级列表失败')
      } finally {
        this.loading = false
      }
    },
    async loadUserCounts() {
      for (const level of this.levelList) {
        try {
          const res = await http.get(`/api/level/${level.id}/user-count`)
          this.$set(this.userCounts, level.id, res.data || 0)
        } catch (error) {
          console.error('加载用户数失败:', error)
        }
      }
    },
    handleAdd() {
      this.isEdit = false
      this.resetForm()
      // 设置默认ID为当前最大ID+1
      const maxId = this.levelList.reduce((max, l) => Math.max(max, l.id), 0)
      this.levelForm.id = maxId + 1
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.levelForm = { ...row }
      this.dialogVisible = true
    },
    resetForm() {
      this.levelForm = {
        id: null,
        name: '',
        icon: '🌱',
        minExp: 0,
        color: '#9e9e9e',
        description: ''
      }
      if (this.$refs.levelForm) {
        this.$refs.levelForm.clearValidate()
      }
    },
    handleSubmit() {
      this.$refs.levelForm.validate(async (valid) => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.isEdit) {
            await http.put('/api/level/update', this.levelForm)
            this.$message.success('更新成功')
          } else {
            await http.post('/api/level/add', this.levelForm)
            this.$message.success('添加成功')
          }
          this.dialogVisible = false
          this.loadLevelList()
        } catch (error) {
          this.$message.error(error.message || '操作失败')
        } finally {
          this.submitting = false
        }
      })
    },
    handleDelete(row) {
      if (this.userCounts[row.id] > 0) {
        this.$message.warning(`有 ${this.userCounts[row.id]} 个用户使用该等级，无法删除`)
        return
      }
      this.$confirm(`确定要删除等级「${row.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await http.delete(`/api/level/delete/${row.id}`)
          this.$message.success('删除成功')
          this.loadLevelList()
        } catch (error) {
          this.$message.error(error.message || '删除失败')
        }
      }).catch(() => { })
    }
  }
}
</script>

<style scoped>
.level-list {
  padding: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.level-icon {
  font-size: 24px;
}

.level-name {
  font-weight: 600;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.color-code {
  font-size: 12px;
  color: #666;
}

.description {
  color: #666;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.form-tip {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.icon-preview {
  font-size: 20px;
}

.emoji-suggestions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.emoji-item:hover {
  background: #f0f0f0;
}

.color-value {
  margin-left: 12px;
  font-size: 14px;
  color: #666;
}
</style>

