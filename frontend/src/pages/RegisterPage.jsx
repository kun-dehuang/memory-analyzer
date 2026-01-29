import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store'
import { authAPI } from '../api/api'

function RegisterPage() {
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
      // 首先注册用户
      const userData = {
        icloud_email: formData.icloud_email,
        icloud_password: formData.icloud_password,
        nickname: formData.nickname
      }

      const registerResponse = await authAPI.register(userData)

      // 如果有上传照片，调用上传照片API
      if (formData.photo) {
        const formDataPhoto = new FormData()
        formDataPhoto.append('file', formData.photo)

        await authAPI.uploadPhoto(registerResponse.id, formDataPhoto)
      }

      // 自动登录
      const loginResponse = await authAPI.login({
        username: formData.icloud_email,
        password: formData.icloud_password
      })

      dispatch(login({
        user: loginResponse.user,
        token: loginResponse.access_token
      }))

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败，请检查信息')
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
            <label className="block text-gray-700 mb-2">本人照片（可选）</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
