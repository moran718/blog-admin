<template>
  <div class="article-edit">
    <el-card>
      <div slot="header">
        <span>{{ isEdit ? '编辑文章' : '新增文章' }}</span>
      </div>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="文章分类" prop="categoryId">
          <el-cascader v-model="form.categoryIds" :options="categoryOptions" :props="{ value: 'id', label: 'name' }"
            placeholder="请选择分类" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="文章标签" prop="tagIds">
          <el-select v-model="form.tagIds" multiple placeholder="请选择标签" style="width: 100%">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图片">
          <div class="upload-section">
            <el-upload class="cover-uploader" action="#" :show-file-list="false" :before-upload="beforeCoverUpload"
              :http-request="uploadCover" accept="image/*">
              <img v-if="form.cover" :src="getFullUrl(form.cover)" class="cover-preview-img" />
              <i v-else class="el-icon-plus cover-uploader-icon"></i>
            </el-upload>
            <span class="upload-tip">支持 jpg、png 格式，最大 5MB</span>
          </div>
        </el-form-item>
        <el-form-item label="文章摘要">
          <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="请输入文章摘要" />
        </el-form-item>
        <el-form-item label="文章内容" prop="content">
          <div class="content-editor">
            <div class="editor-toolbar">
              <el-upload class="image-uploader" action="#" :show-file-list="false" :before-upload="beforeImageUpload"
                :http-request="uploadContentImage" accept="image/*">
                <el-button size="small" type="primary" icon="el-icon-picture">插入图片</el-button>
              </el-upload>
              <span class="toolbar-tip">先将光标定位到要插入的位置，再点击上传图片</span>
            </div>
            <el-input ref="contentInput" v-model="form.content" type="textarea" :rows="15"
              placeholder="请输入文章内容（支持 Markdown）" @blur="saveCursorPosition" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存文章</el-button>
          <el-button @click="$router.back()">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { http, getResourceUrl } from '@/utils/request'

export default {
  name: 'ArticleEdit',
  data() {
    return {
      isEdit: false,
      submitting: false,
      form: {
        id: null,
        title: '',
        categoryIds: [],
        tagIds: [],
        cover: '',
        summary: '',
        content: '',
        status: 1
      },
      rules: {
        title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
        content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
      },
      categoryOptions: [],
      tags: [],
      cursorPosition: 0
    }
  },
  created() {
    this.loadCategories()
    this.loadTags()
    if (this.$route.params.id) {
      this.isEdit = true
      this.loadArticle(this.$route.params.id)
    }
  },
  methods: {
    async loadArticle(id) {
      try {
        // 获取文章详情
        const res = await http.get(`/api/record/${id}`)
        const article = res.data
        // 获取文章标签ID
        const tagRes = await http.get(`/api/record/${id}/tag-ids`)
        const tagIds = tagRes.data || []

        this.form = {
          id: article.id,
          title: article.title,
          categoryIds: article.categoryId ? [article.categoryId] : [],
          tagIds: tagIds,
          cover: article.cover || '',
          summary: article.summary || '',
          content: article.content || '',
          status: article.status || 1
        }
      } catch (error) {
        console.error('加载文章失败:', error)
        this.$message.error('加载文章失败')
      }
    },
    async loadCategories() {
      try {
        const res = await http.get('/api/record/category-tree')
        // 构建树形结构
        const categories = res.data || []
        this.categoryOptions = this.buildCategoryTree(categories)
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },
    buildCategoryTree(categories) {
      // 找出一级分类（parentId 为 null 或 0）
      const parents = categories.filter(c => !c.parentId || c.parentId === 0)
      return parents.map(parent => {
        const children = categories.filter(c => c.parentId === parent.id)
        return {
          id: parent.id,
          name: parent.name,
          children: children.length > 0 ? children.map(child => ({
            id: child.id,
            name: child.name
          })) : undefined
        }
      })
    },
    async loadTags() {
      try {
        const res = await http.get('/api/record/tags')
        this.tags = res.data || []
      } catch (error) {
        console.error('加载标签失败:', error)
      }
    },
    getFullUrl(path) {
      return getResourceUrl(path)
    },
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
    async uploadCover(options) {
      try {
        const res = await http.upload('/api/record/uploadCover', options.file)
        this.form.cover = res.data
        this.$message.success('封面上传成功')
      } catch (error) {
        console.error('封面上传失败:', error)
        this.$message.error('封面上传失败')
      }
    },
    beforeImageUpload(file) {
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
    saveCursorPosition() {
      // 保存光标位置
      const textarea = this.$refs.contentInput.$el.querySelector('textarea')
      if (textarea) {
        this.cursorPosition = textarea.selectionStart
      }
    },
    async uploadContentImage(options) {
      try {
        const res = await http.upload('/api/record/uploadImage', options.file)
        // 只存储相对路径，前端展示时再拼接完整 URL
        const imageUrl = res.data
        const markdownImage = `![图片](${imageUrl})`

        // 在光标位置插入图片
        const content = this.form.content || ''
        const pos = this.cursorPosition
        this.form.content = content.slice(0, pos) + markdownImage + content.slice(pos)

        // 更新光标位置到插入内容之后
        this.cursorPosition = pos + markdownImage.length

        this.$message.success('图片已插入到光标位置')
      } catch (error) {
        console.error('图片上传失败:', error)
        this.$message.error('图片上传失败')
      }
    },
    handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          const data = {
            id: this.form.id,
            title: this.form.title,
            summary: this.form.summary,
            content: this.form.content,
            cover: this.form.cover,
            categoryId: this.form.categoryIds.length > 0
              ? this.form.categoryIds[this.form.categoryIds.length - 1]
              : null,
            tagIds: this.form.tagIds,
            status: this.form.status
          }
          if (this.isEdit) {
            await http.put('/api/record/update', data)
          } else {
            await http.post('/api/record/add', data)
          }
          this.$message.success(this.isEdit ? '更新成功' : '发布成功')
          this.$router.push('/articles')
        } catch (error) {
          console.error('保存失败:', error)
          this.$message.error('保存失败')
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-uploader {
  /deep/ .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 200px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #409EFF;
    }
  }
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.cover-preview-img {
  width: 200px;
  height: 120px;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #999;
}

.content-editor {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.toolbar-tip {
  font-size: 12px;
  color: #909399;
}

.image-uploader {
  display: inline-block;
}
</style>
