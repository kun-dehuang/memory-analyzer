import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/api'

function RegisterPage () {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    icloud_email: '',
    icloud_password: '',
    nickname: '',
    photo: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordHint, setPasswordHint] = useState('')

  const MAX_PASSWORD_LENGTH = 72

  useEffect(() => {
    const password = formData.icloud_password
    if (password.length > MAX_PASSWORD_LENGTH) {
      setPasswordHint(`密码长度超过 ${MAX_PASSWORD_LENGTH} 字符，将被自动截断`)
    } else if (password.length > MAX_PASSWORD_LENGTH * 0.8) {
      setPasswordHint(`密码长度接近 ${MAX_PASSWORD_LENGTH} 字符限制`)
    } else {
      setPasswordHint('')
    }
  }, [formData.icloud_password])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    console.log('文件选择事件:', e)
    console.log('选择的文件:', e.target.files)
    if (e.target.files && e.target.files[0]) {
      console.log('文件信息:', {
        name: e.target.files[0].name,
        type: e.target.files[0].type,
        size: e.target.files[0].size
      })
    }
    setFormData(prev => ({
      ...prev,
      photo: e.target.files[0]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 验证照片是否已选择
      if (!formData.photo) {
        setError('请选择一张本人照片')
        setLoading(false)
        return
      }

      // 验证照片文件类型
      if (!formData.photo.type.startsWith('image/')) {
        setError('请选择有效的图片文件')
        setLoading(false)
        return
      }

      // 验证照片文件大小（例如：限制为5MB）
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (formData.photo.size > maxSize) {
        setError('照片文件大小不能超过5MB')
        setLoading(false)
        return
      }

      console.log('照片文件信息:', {
        name: formData.photo.name,
        type: formData.photo.type,
        size: formData.photo.size
      })

      // 使用FormData提交注册数据和照片
      const formDataRegister = new FormData()
      formDataRegister.append('icloud_email', formData.icloud_email)
      formDataRegister.append('icloud_password', formData.icloud_password)
      formDataRegister.append('nickname', formData.nickname)
      formDataRegister.append('photo', formData.photo)

      // 验证FormData内容
      console.log('FormData内容检查:')
      for (let [key, value] of formDataRegister.entries()) {
        if (key === 'photo') {
          console.log(`${key}:`, value.name, value.size, value.type)
        } else {
          console.log(`${key}:`, value)
        }
      }

      console.log('准备提交注册数据')
      await authAPI.register(formDataRegister)

      console.log('注册成功，准备跳转到登录页')
      // 注册成功后跳转到登录页，让用户手动登录
      navigate('/login')
    } catch (err) {
      console.error('注册失败:', err)
      // 确保错误信息是字符串
      let errorMessage = '注册失败，请检查信息'
      try {
        if (err.response && err.response.data) {
          if (err.response.data.detail) {
            // 检查detail是否为对象
            if (typeof err.response.data.detail === 'object') {
              // 如果是对象，尝试提取错误信息
              if (Array.isArray(err.response.data.detail)) {
                // 如果是数组，取第一个错误信息
                errorMessage = err.response.data.detail[0]?.msg || errorMessage
              } else if (err.response.data.detail.msg) {
                // 如果有msg属性，使用它
                errorMessage = err.response.data.detail.msg
              } else {
                // 否则转换为字符串
                errorMessage = JSON.stringify(err.response.data.detail)
              }
            } else {
              // 如果是字符串，直接使用
              errorMessage = err.response.data.detail
            }
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message
          }
        } else if (err.message) {
          errorMessage = err.message
        }
      } catch (e) {
        console.error('处理错误信息失败:', e)
      }
      // 确保最终的errorMessage是字符串
      if (typeof errorMessage !== 'string') {
        errorMessage = '注册失败，请检查信息'
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* 注册卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          {/* Logo 和标题 */}
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h1 className="text-lg font-bold text-gray-800">Memory Analyzer</h1>
            </div>
            <p className="text-sm text-gray-600">创建新账号</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                iCloud 邮箱
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="icloud_email"
                  value={formData.icloud_email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                iCloud 密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="icloud_password"
                  value={formData.icloud_password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordHint && (
                <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {passwordHint}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                昵称
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="您的昵称"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                本人照片 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input pl-10 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  required
                />
              </div>
              {formData.photo && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {formData.photo.name}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner"></span>
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              已有账号？{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* 底部信息 */}
        <p className="mt-6 text-center text-white/70 text-xs">
          © 2024 Memory Analyzer. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
