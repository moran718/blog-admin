<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">拾光博客</span>
        <span v-else>拾</span>
      </div>
      <el-menu :default-active="$route.path" :collapse="isCollapse" :collapse-transition="false"
        background-color="#304156" text-color="#bfcbd9" active-text-color="#409EFF" router>
        <el-menu-item index="/">
          <i class="el-icon-s-home"></i>
          <span slot="title">仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/articles">
          <i class="el-icon-document"></i>
          <span slot="title">记录管理</span>
        </el-menu-item>
        <el-menu-item index="/essays">
          <i class="el-icon-edit-outline"></i>
          <span slot="title">随笔管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <i class="el-icon-folder"></i>
          <span slot="title">分类管理</span>
        </el-menu-item>
        <el-menu-item index="/tags">
          <i class="el-icon-collection-tag"></i>
          <span slot="title">标签管理</span>
        </el-menu-item>
        <el-menu-item index="/comments">
          <i class="el-icon-chat-dot-round"></i>
          <span slot="title">评论管理</span>
        </el-menu-item>
        <el-menu-item index="/messages">
          <i class="el-icon-message"></i>
          <span slot="title">留言管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <i class="el-icon-user"></i>
          <span slot="title">用户管理</span>
        </el-menu-item>
        <el-menu-item index="/levels">
          <i class="el-icon-medal"></i>
          <span slot="title">等级管理</span>
        </el-menu-item>
        <el-menu-item index="/music">
          <i class="el-icon-headset"></i>
          <span slot="title">音乐管理</span>
        </el-menu-item>
        <el-menu-item index="/browse">
          <i class="el-icon-view"></i>
          <span slot="title">浏览记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容 -->
    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'" class="collapse-btn"
            @click="toggleCollapse"></i>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userAvatar"></el-avatar>
              <span class="username">{{ user.username || '管理员' }}</span>
              <i class="el-icon-arrow-down"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { http, getResourceUrl } from '@/utils/request'
import { resetAuthCheck } from '@/router'

export default {
  name: 'LayoutIndex',
  data() {
    return {
      isCollapse: false
    }
  },
  computed: {
    user() {
      return this.$store.state.user || {}
    },
    userAvatar() {
      const avatar = this.user.avatar
      if (!avatar) {
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
      }
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar
      }
      return getResourceUrl(avatar)
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    },
    async handleCommand(command) {
      if (command === 'logout') {
        try {
          await http.post('/api/user/logout')
          this.$store.commit('SET_USER', null)
          resetAuthCheck() // 重置验证状态
          this.$router.push('/login')
          this.$message.success('已退出登录')
        } catch (error) {
          console.error('退出登录失败:', error)
        }
      } else if (command === 'profile') {
        this.$router.push('/profile')
      }
    }
  }
}
</script>

<style lang="less" scoped>
.layout-container {
  height: 100%;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;

  .logo {
    height: 60px;
    line-height: 60px;
    text-align: center;
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    background-color: #263445;
  }

  .el-menu {
    border-right: none;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .collapse-btn {
    font-size: 20px;
    cursor: pointer;
    color: #666;

    &:hover {
      color: #409EFF;
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        color: #333;
      }
    }
  }
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
}
</style>
