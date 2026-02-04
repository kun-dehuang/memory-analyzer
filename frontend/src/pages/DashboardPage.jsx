import React, { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store'
import { memoryAPI, promptAPI, userAPI } from '../api/api'

function DashboardPage () {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token } = useSelector(state => state.user)
  const [promptGroups, setPromptGroups] = useState([])
  const [selectedPromptGroup, setSelectedPromptGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [icloudPassword, setIcloudPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [photoLoading, setPhotoLoading] = useState(false)

  // 使用useCallback memoize loadPromptGroups函数
  const loadPromptGroups = useCallback(async () => {
    try {
      console.log('DashboardPage - 开始加载提示词组')
      const groups = await promptAPI.getPromptGroups()
      console.log('DashboardPage - 提示词组加载成功:', groups)
      setPromptGroups(groups)
    } catch (err) {
      console.error('DashboardPage - 加载提示词组失败:', err)
      // 如果是401错误，说明token无效，跳转到登录页
      if (err.response && err.response.status === 401) {
        console.log('DashboardPage - 收到401错误，跳转到登录页')
        navigate('/login')
      }
    }
  }, [navigate])

  // 检查用户是否已登录
  useEffect(() => {
    console.log('DashboardPage - 检查认证状态:', { token, user })
    if (!token) {
      console.log('DashboardPage - token不存在，跳转到登录页')
      navigate('/login')
      return
    }
    console.log('DashboardPage - token存在，开始加载提示词组')
    loadPromptGroups()
  }, [token, navigate, loadPromptGroups, user])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleUpdateIcloudPassword = async () => {
    if (!icloudPassword) {
      setPasswordError('请输入 iCloud 密码')
      return
    }

    try {
      await userAPI.updateIcloudPassword(user.id, icloudPassword)

      setPasswordSuccess('iCloud 密码更新成功')
      setPasswordError('')
      setIcloudPassword('')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) {
      setPasswordError('更新 iCloud 密码失败，请重试')
      console.error('更新 iCloud 密码失败:', err)
    }
  }

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      setPhotoError('请选择一张照片')
      return
    }

    setPhotoLoading(true)
    setPhotoError('')

    try {
      const formData = new FormData()
      formData.append('file', photoFile)

      const response = await userAPI.uploadPhoto(user.id, formData)

      setPhotoSuccess('照片上传成功，特征提取完成')
      setPhotoError('')
      setPhotoFile(null)
      setTimeout(() => setPhotoSuccess(''), 3000)
    } catch (err) {
      setPhotoError('上传照片失败，请重试')
      console.error('上传照片失败:', err)
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleGenerateMemory = async () => {
    if (!selectedPromptGroup) {
      setError('请选择一个提示词组')
      return
    }

    setLoading(true)
    setError('')

    try {
      const recordData = {
        user_id: user.id,
        prompt_group_id: selectedPromptGroup.id
      }

      await memoryAPI.createMemoryRecord(recordData)
      navigate(`/memory-records`)
    } catch (err) {
      setError('生成记忆失败，请重试')
      console.error('生成记忆失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Memory Analyzer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span>欢迎，{user?.nickname}</span>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                {showPasswordForm ? '取消' : '设置 iCloud 密码'}
              </button>
              <button
                onClick={() => setShowPhotoForm(!showPhotoForm)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                {showPhotoForm ? '取消' : '上传照片'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* iCloud 密码设置表单 */}
        {showPasswordForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">设置 iCloud 密码</h2>

            {passwordError && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                {passwordSuccess}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">iCloud 密码</label>
              <input
                type="password"
                value={icloudPassword}
                onChange={(e) => setIcloudPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的 iCloud 密码"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleUpdateIcloudPassword}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                保存密码
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setIcloudPassword('')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 上传照片表单 */}
        {showPhotoForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">上传个人照片</h2>

            {photoError && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {photoError}
              </div>
            )}

            {photoSuccess && (
              <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                {photoSuccess}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">选择照片</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">请上传一张清晰的个人照片，用于提取特征并在后续分析中识别您</p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleUploadPhoto}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={photoLoading}
              >
                {photoLoading ? '上传中...' : '上传照片'}
              </button>
              <button
                onClick={() => {
                  setShowPhotoForm(false)
                  setPhotoFile(null)
                  setPhotoError('')
                  setPhotoSuccess('')
                }}
                className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">生成记忆分析</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">选择提示词组</label>
            <select
              value={selectedPromptGroup?.id || ''}
              onChange={(e) => {
                const group = promptGroups.find(g => g.id === e.target.value)
                setSelectedPromptGroup(group)
              }}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              {promptGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleGenerateMemory}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading || !selectedPromptGroup}
            >
              {loading ? '生成中...' : '生成记忆分析'}
            </button>
            <button
              onClick={() => navigate('/prompts')}
              className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded"
            >
              管理提示词
            </button>
            <button
              onClick={() => navigate('/memory-records')}
              className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded"
            >
              查看历史记录
            </button>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">提示词组</h3>
            <p className="text-3xl font-bold text-blue-600">{promptGroups.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">历史记录</h3>
            <p className="text-3xl font-bold text-blue-600">0</p> {/* 这里需要从API获取 */}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">分析照片</h3>
            <p className="text-3xl font-bold text-blue-600">0</p> {/* 这里需要从API获取 */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
