import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store'
import { authAPI } from '../api/api'

function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    icloud_email: '',
    icloud_password: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login({
        username: formData.icloud_email, // 注意：这里使用username字段，因为后端使用OAuth2PasswordRequestForm
        password: formData.icloud_password
      })

      dispatch(login({
        user: response.user,
        token: response.access_token
      }))

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Memory Analyzer</h2>
        <h3 className="text-lg font-medium text-center mb-6">登录</h3>

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

          <div className="mb-6">
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

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p>还没有账号？ <Link to="/register" className="text-blue-500 hover:underline">立即注册</Link></p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
