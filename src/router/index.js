import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/layout/index.vue'
import store from '@/store'
import { http } from '@/utils/request'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/article/ArticleList.vue'),
        meta: { title: '记录管理' }
      },
      {
        path: 'articles/edit/:id?',
        name: 'ArticleEdit',
        component: () => import('@/views/article/ArticleEdit.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/category/CategoryList.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('@/views/tag/TagList.vue'),
        meta: { title: '标签管理' }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/comment/CommentList.vue'),
        meta: { title: '评论管理' }
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/message/MessageList.vue'),
        meta: { title: '留言管理' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'music',
        name: 'Music',
        component: () => import('@/views/music/MusicList.vue'),
        meta: { title: '音乐管理' }
      },
      {
        path: 'essays',
        name: 'Essays',
        component: () => import('@/views/essay/EssayList.vue'),
        meta: { title: '随笔管理' }
      },
      {
        path: 'levels',
        name: 'Levels',
        component: () => import('@/views/level/LevelList.vue'),
        meta: { title: '等级管理' }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

// 是否已验证过登录状态
let hasCheckedAuth = false

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 拾光博客管理系统` : '拾光博客管理系统'

  // 登录页直接放行
  if (to.path === '/login') {
    next()
    return
  }

  // 如果已经验证过且有用户信息，直接放行
  if (hasCheckedAuth && store.state.user) {
    next()
    return
  }

  // 验证登录状态
  try {
    const res = await http.get('/api/user/info')
    if (res.data && res.data.role === 1) {
      store.commit('SET_USER', res.data)
      hasCheckedAuth = true
      next()
    } else {
      // 不是管理员
      store.commit('SET_USER', null)
      hasCheckedAuth = false
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  } catch (error) {
    // 未登录或验证失败
    store.commit('SET_USER', null)
    hasCheckedAuth = false
    next({ path: '/login', query: { redirect: to.fullPath } })
  }
})

// 退出登录时重置验证状态
export function resetAuthCheck() {
  hasCheckedAuth = false
}

export default router
