import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api', // 后端API基础URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器，添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    console.log('API Request - URL:', config.url)
    console.log('API Request - Token:', token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request - Authorization header:', config.headers.Authorization)
    } else {
      console.log('API Request - No token found in localStorage')
    }
    return config
  },
  error => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 确保返回的数据格式正确
    console.log('API Response - URL:', response.config.url)
    console.log('API Response - Status:', response.status)
    if (response && response.data) {
      return response.data
    }
    return response
  },
  error => {
    console.error('API Response Error - URL:', error.config?.url)
    console.error('API Response Error - Status:', error.response?.status)
    console.error('API Response Error - Data:', error.response?.data)
    if (error.response && error.response.status === 401) {
      // 未授权，清除token并跳转到登录页
      console.log('API Response Error - 401错误，清除token并跳转到登录页')
      localStorage.removeItem('token')
      // 使用正确的路径，考虑GitHub Pages的子目录结构
      window.location.href = '/memory-analyzer/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关API
export const authAPI = {
  // 登录
  login: (data) => api.post('/auth/login', data),
  // 注册
  register: (data) => {
    // 直接使用axios.post，让axios自动处理FormData
    // 当数据是FormData时，axios会自动设置正确的Content-Type头
    return axios.post(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'}/auth/register`, data)
  },
  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/me')
}

// 用户相关API
export const userAPI = {
  // 获取用户列表
  getUsers: () => api.get('/users'),
  // 获取用户信息
  getUser: (userId) => api.get(`/users/${userId}`),
  // 更新用户信息
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
  // 上传用户照片
  uploadPhoto: (userId, formData) => api.post(`/users/${userId}/upload-photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  // 更新iCloud密码
  updateIcloudPassword: (userId, icloudPassword) => api.put(`/users/${userId}/icloud-password`, { "icloud_password": icloudPassword })
}

// 提示词相关API
export const promptAPI = {
  // 获取提示词组列表
  getPromptGroups: () => api.get('/prompts/groups'),
  // 创建提示词组
  createPromptGroup: (data) => api.post('/prompts/groups', data),
  // 获取提示词组详情
  getPromptGroup: (groupId) => api.get(`/prompts/groups/${groupId}`),
  // 更新提示词组
  updatePromptGroup: (groupId, data) => api.put(`/prompts/groups/${groupId}`, data),
  // 删除提示词组
  deletePromptGroup: (groupId) => api.delete(`/prompts/groups/${groupId}`),
  // 创建提示词
  createPrompt: (data) => api.post('/prompts', data),
  // 更新提示词
  updatePrompt: (promptId, data) => api.put(`/prompts/${promptId}`, data),
  // 删除提示词
  deletePrompt: (promptId) => api.delete(`/prompts/${promptId}`)
}

// 记忆分析相关API
export const memoryAPI = {
  // 获取记忆记录列表
  getMemoryRecords: (userId) => api.get('/memory/records', { params: { userId } }),
  // 创建记忆记录
  createMemoryRecord: (data) => api.post('/memory/records', data),
  // 获取记忆记录详情
  getMemoryRecord: (recordId) => api.get(`/memory/records/${recordId}`),
  // 重新分析记忆记录
  reanalyzeMemoryRecord: (recordId, icloudPassword) => api.put(`/memory/records/${recordId}/reanalyze`, { icloud_password: icloudPassword }),
  // 提供iCloud密码
  providePassword: (recordId, icloudPassword) => api.put(`/memory/records/${recordId}/provide-password`, { icloud_password: icloudPassword }),
  // 提供验证码
  provideVerificationCode: (recordId, verificationCode) => api.put(`/memory/records/${recordId}/provide-verification`, { verification_code: verificationCode }),
  // 删除记忆记录
  deleteMemoryRecord: (recordId) => api.delete(`/memory/records/${recordId}`)
}

export default api
