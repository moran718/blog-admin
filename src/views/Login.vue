<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">拾光博客管理系统</h2>
      <el-form ref="loginForm" :model="loginForm" :rules="rules" class="login-form">
        <el-form-item prop="email">
          <el-input v-model="loginForm.email" prefix-icon="el-icon-user" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" prefix-icon="el-icon-lock" type="password" placeholder="请输入密码"
            @keyup.enter.native="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { http } from '@/utils/request'

export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        email: '',
        password: '',
        loginType: 'password'  // 密码登录
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  created() {
    // 如果已经登录，直接跳转
    this.checkLogin()
  },
  methods: {
    async checkLogin() {
      try {
        const res = await http.get('/api/user/info')
        if (res.data && res.data.role === 1) {
          this.$store.commit('SET_USER', res.data)
          const redirect = this.$route.query.redirect || '/'
          this.$router.push(redirect)
        }
      } catch (error) {
        // 未登录，留在登录页
      }
    },
    handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (!valid) return
        this.loading = true
        try {
          await http.post('/api/user/login', this.loginForm)
          // 检查是否是管理员
          const userRes = await http.get('/api/user/info')
          if (userRes.data.role !== 1) {
            this.$message.error('您没有管理员权限')
            await http.post('/api/user/logout')
            return
          }
          this.$store.commit('SET_USER', userRes.data)
          this.$message.success('登录成功')
          // 跳转到原来要访问的页面或首页
          const redirect = this.$route.query.redirect || '/'
          this.$router.push(redirect)
        } catch (error) {
          console.error('登录失败:', error)
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.login-form {
  .el-input {
    height: 44px;

    /deep/ input {
      height: 44px;
    }
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}
</style>
