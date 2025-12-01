<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
            <i class="el-icon-document"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.articleCount }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
            <i class="el-icon-view"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalViews }}</div>
            <div class="stat-label">总访问量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
            <i class="el-icon-chat-dot-round"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.commentCount }}</div>
            <div class="stat-label">评论总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7)">
            <i class="el-icon-user"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近文章 & 最近评论 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>最近文章</span>
            <el-button type="text" @click="$router.push('/articles')">更多</el-button>
          </div>
          <el-table :data="recentArticles" style="width: 100%">
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="views" label="浏览" width="80" />
            <el-table-column prop="createdAt" label="发布时间" width="120">
              <template slot-scope="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>最近评论</span>
            <el-button type="text" @click="$router.push('/comments')">更多</el-button>
          </div>
          <el-table :data="recentComments" style="width: 100%">
            <el-table-column prop="username" label="用户" width="100" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="时间" width="120">
              <template slot-scope="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { http } from '@/utils/request'

export default {
  name: 'DashboardPage',
  data() {
    return {
      stats: {
        articleCount: 0,
        totalViews: 0,
        commentCount: 0,
        userCount: 0
      },
      recentArticles: [],
      recentComments: []
    }
  },
  created() {
    this.loadDashboard()
  },
  methods: {
    async loadDashboard() {
      try {
        // 并行加载统计数据、最近文章、最近评论
        const [statsRes, articlesRes, commentsRes] = await Promise.all([
          http.get('/api/dashboard/stats'),
          http.get('/api/dashboard/recent-articles', { limit: 5 }),
          http.get('/api/dashboard/recent-comments', { limit: 5 })
        ])

        // 统计数据
        if (statsRes.data) {
          this.stats = {
            articleCount: statsRes.data.articleCount || 0,
            totalViews: statsRes.data.totalViews || 0,
            commentCount: statsRes.data.commentCount || 0,
            userCount: statsRes.data.userCount || 0
          }
        }

        // 最近文章
        this.recentArticles = articlesRes.data || []

        // 最近评论
        this.recentComments = commentsRes.data || []
      } catch (error) {
        console.error('加载仪表盘失败:', error)
        this.$message.error('加载仪表盘数据失败')
      }
    },
    formatDate(date) {
      if (!date) return ''
      return date.substring(0, 10)
    }
  }
}
</script>

<style lang="less" scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;

  /deep/ .el-card__body {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 20px;
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;

    i {
      font-size: 28px;
      color: #fff;
    }
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
