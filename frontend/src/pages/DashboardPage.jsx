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

      await userAPI.uploadPhoto(user.id, formData)

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
    <div className="min-h-screen page-container">
      {/* 导航栏 */}
      <nav className="navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold gradient-text hidden sm:block">Memory Analyzer</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-indigo-700">{user?.nickname || '用户'}</span>
              </div>

              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn btn-ghost text-sm sm:text-base px-3 sm:px-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="hidden sm:inline">{showPasswordForm ? '取消' : 'iCloud 密码'}</span>
              </button>

              <button
                onClick={() => setShowPhotoForm(!showPhotoForm)}
                className="btn btn-ghost text-sm sm:text-base px-3 sm:px-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">{showPhotoForm ? '取消' : '上传照片'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm sm:text-base px-3 sm:px-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* iCloud 密码设置表单 */}
        {showPasswordForm && (
          <div className="card-elevated p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">设置 iCloud 密码</h2>
                <p className="text-sm text-gray-500">安全地存储您的 iCloud 凭证</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700">{passwordSuccess}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">iCloud 密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={icloudPassword}
                  onChange={(e) => setIcloudPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="请输入您的 iCloud 密码"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUpdateIcloudPassword}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存密码
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setIcloudPassword('')
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 上传照片表单 */}
        {showPhotoForm && (
          <div className="card-elevated p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">上传个人照片</h2>
                <p className="text-sm text-gray-500">用于 AI 人脸识别和分析</p>
              </div>
            </div>

            {photoError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{photoError}</p>
              </div>
            )}

            {photoSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700">{photoSuccess}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">选择照片</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {photoFile ? (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">{photoFile.name}</p>
                      <p className="text-xs text-gray-500">点击更换照片</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">点击上传或拖拽照片到此处</p>
                      <p className="text-xs text-gray-500">支持 JPG、PNG 等常见格式</p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                请上传一张清晰的个人照片，用于提取特征并在后续分析中识别您
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUploadPhoto}
                className="btn btn-primary"
                disabled={photoLoading || !photoFile}
              >
                {photoLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner"></span>
                    上传中...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    上传照片
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPhotoForm(false)
                  setPhotoFile(null)
                  setPhotoError('')
                  setPhotoSuccess('')
                }}
                className="btn btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 生成记忆分析卡片 */}
        <div className="card-elevated p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">生成记忆分析</h2>
              <p className="text-sm text-gray-500">AI 深度分析您的照片记忆</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">选择提示词组</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <select
                value={selectedPromptGroup?.id || ''}
                onChange={(e) => {
                  const group = promptGroups.find(g => g.id === e.target.value)
                  setSelectedPromptGroup(group)
                }}
                className="select pl-10"
              >
                <option value="">请选择提示词组</option>
                {promptGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerateMemory}
              className="btn btn-primary"
              disabled={loading || !selectedPromptGroup}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner"></span>
                  生成中...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  生成记忆分析
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/prompts')}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              管理提示词
            </button>
            <button
              onClick={() => navigate('/memory-records')}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              历史记录
            </button>
          </div>
        </div>

        {/* 快速统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* 提示词组统计 */}
          <div className="card p-6 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{promptGroups.length}</p>
                <p className="text-xs text-gray-500">个</p>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">提示词组</h3>
            <p className="text-xs text-gray-500 mt-1">AI 分析模板</p>
          </div>

          {/* 历史记录统计 */}
          <div className="card p-6 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">条</p>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">历史记录</h3>
            <p className="text-xs text-gray-500 mt-1">分析次数</p>
          </div>

          {/* 分析照片统计 */}
          <div className="card p-6 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">张</p>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">分析照片</h3>
            <p className="text-xs text-gray-500 mt-1">已处理总数</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
