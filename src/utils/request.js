import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router'

// 管理端通过 vue.config.js 代理，API请求使用相对路径
// 但资源访问需要完整的后端地址
const BASE_URL = process.env.VUE_APP_API_URL || ''
const RESOURCE_BASE_URL = process.env.VUE_APP_RESOURCE_URL || 'http://localhost:9999'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token 并添加到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      Message.error(res.message || '请求失败')
      if (res.code === 401) {
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    console.error('请求错误:', error)
    Message.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export const http = {
  get(url, params) {
    return request.get(url, { params })
  },
  post(url, data) {
    return request.post(url, data)
  },
  put(url, data) {
    return request.put(url, data)
  },
  delete(url, params) {
    return request.delete(url, { params })
  },
  upload(url, file, fieldName = 'file') {
    const formData = new FormData()
    formData.append(fieldName, file)
    return request.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000 // 5分钟超时，适合大文件上传
    })
  }
}

/**
 * 获取资源完整URL
 * 将相对路径转换为完整的访问URL
 * @param {string} path - 相对路径，如 /uploads/music/audio/xxx.mp3
 * @returns {string} 完整URL
 */
export function getResourceUrl(path) {
  if (!path) return ''
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // 拼接资源服务器地址和相对路径
  return RESOURCE_BASE_URL + path
}

export default request

