import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store'
import { authAPI } from '../api/api'

function RegisterPage () {
  const dispatch = useDispatch()
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

      console.log('准备提交注册数据')
      await authAPI.register(formDataRegister)

      // 自动登录
      console.log('准备自动登录:', formData.icloud_email)
      const loginResponse = await authAPI.login({
        username: formData.icloud_email,
        password: formData.icloud_password
      })
      console.log('自动登录成功:', loginResponse)

      dispatch(login({
        user: loginResponse.user,
        token: loginResponse.access_token
      }))

      console.log('准备跳转到dashboard')
      // 使用相对路径或完整路径确保正确跳转
      navigate('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Memory Analyzer</h2>
        <h3 className="text-lg font-medium text-center mb-6">注册</h3>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">iCloud 邮箱</label>
            <input
              type="email"
              name="icloud_email"
              value={formData.icloud_email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">iCloud 密码</label>
            <input
              type="password"
              name="icloud_password"
              value={formData.icloud_password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {passwordHint && (
              <div className="text-sm text-yellow-600 mt-1">
                {passwordHint}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">昵称</label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">本人照片（必填）</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {formData.photo && (
              <p className="mt-2 text-sm text-gray-500">已选择: {formData.photo.name}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p>已有账号？ <Link to="/login" className="text-blue-500 hover:underline">立即登录</Link></p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
