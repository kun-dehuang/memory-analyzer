import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memoryAPI, imageAPI, promptAPI } from '../api/api'

function MemoryRecordsPage () {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [verificationSuccess, setVerificationSuccess] = useState('')
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [currentRecordId, setCurrentRecordId] = useState(null)
  const [showImagesModal, setShowImagesModal] = useState(false)
  const [recordImages, setRecordImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imagesError, setImagesError] = useState('')

  // Regenerate Phase 2 state
  const [promptGroups, setPromptGroups] = useState([])
  const [selectedPromptGroup, setSelectedPromptGroup] = useState('')
  const [selectedPhase2Version, setSelectedPhase2Version] = useState(null)

  useEffect(() => {
    loadRecords()
    loadPromptGroups()
  }, [])

  const loadPromptGroups = async () => {
    try {
      const groups = await promptAPI.getPromptGroups()
      setPromptGroups(groups)
    } catch (err) {
      console.error('加载提示词组失败:', err)
    }
  }

  const loadRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await memoryAPI.getMemoryRecords()
      setRecords(response)
    } catch (err) {
      setError('加载记录失败')
      console.error('加载记录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewRecord = async (recordId) => {
    try {
      const record = await memoryAPI.getMemoryRecord(recordId)
      setSelectedRecord(record)
    } catch (err) {
      setError('加载记录详情失败')
      console.error('加载记录详情失败:', err)
    }
  }

  const viewRecordImages = async (record) => {
    try {
      setImagesLoading(true)
      setImagesError('')
      
      if (record.used_photos && record.used_photos.length > 0) {
        // 批量获取图片详情
        const images = await imageAPI.getImagesBatch(record.used_photos.join(','))
        setRecordImages(images)
      } else {
        setRecordImages([])
      }
    } catch (err) {
      setImagesError('加载图片失败')
      console.error('加载图片失败:', err)
      setRecordImages([])
    } finally {
      setImagesLoading(false)
      setShowImagesModal(true)
    }
  }

  const handleRegeneratePhase2 = async (record) => {
    if (!selectedPromptGroup || !record) {
      alert('请选择提示词组')
      return
    }

    try {
      // 调用API重新生成Phase 2结果
      const updatedRecord = await memoryAPI.regeneratePhase2Result(
        record.id,
        selectedPromptGroup
      )
      
      // 更新选中的记录
      setSelectedRecord(updatedRecord)
      alert('重新生成成功')
    } catch (err) {
      console.error('重新生成失败:', err)
      alert('重新生成失败，请重试')
    }
  }

  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordRecordId, setPasswordRecordId] = useState(null)

  const handleProvideVerificationCode = async () => {
    console.log('handleProvideVerificationCode 被调用')
    console.log('currentRecordId:', currentRecordId)
    console.log('verificationCode:', verificationCode)

    if (!verificationCode) {
      setVerificationError('请输入验证码')
      return
    }

    try {
      console.log('开始调用 provideVerificationCode API')
      await memoryAPI.provideVerificationCode(currentRecordId, verificationCode)
      console.log('provideVerificationCode API 调用成功')
      setVerificationSuccess('验证码已提交，分析任务已继续执行')
      setVerificationError('')
      setVerificationCode('')
      setTimeout(() => {
        setShowVerificationForm(false)
        setVerificationSuccess('')
        loadRecords() // 刷新记录列表
      }, 2000)
    } catch (err) {
      console.error('提交验证码失败:', err)
      setVerificationError('提交验证码失败，请重试')
    }
  }

  const handleProvidePassword = async () => {
    console.log('handleProvidePassword 被调用')
    console.log('passwordRecordId:', passwordRecordId)
    console.log('passwordInput:', passwordInput)

    if (!passwordInput) {
      setPasswordError('请输入iCloud密码')
      return
    }

    try {
      console.log('开始调用 providePassword API')
      await memoryAPI.providePassword(passwordRecordId, passwordInput)
      console.log('providePassword API 调用成功')
      setPasswordSuccess('密码已提交，分析任务已继续执行')
      setPasswordError('')
      setPasswordInput('')
      setTimeout(() => {
        setPasswordModalVisible(false)
        setPasswordSuccess('')
        loadRecords() // 刷新记录列表
      }, 2000)
    } catch (err) {
      console.error('提交密码失败:', err)
      setPasswordError('提交密码失败，请重试')
    }
  }

  const handleDeleteRecord = async (recordId) => {
    console.log('handleDeleteRecord 被调用，recordId:', recordId)
    
    if (window.confirm('确定要删除这条记忆记录吗？此操作不可撤销。')) {
      try {
        console.log('开始调用 deleteMemoryRecord API')
        await memoryAPI.deleteMemoryRecord(recordId)
        console.log('deleteMemoryRecord API 调用成功')
        // 删除成功后刷新记录列表
        loadRecords()
      } catch (err) {
        console.error('删除记录失败:', err)
        setError('删除记录失败，请重试')
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { text: '等待中', color: 'bg-yellow-100 text-yellow-800' },
      'processing': { text: '分析中', color: 'bg-blue-100 text-blue-800' },
      'completed': { text: '已完成', color: 'bg-green-100 text-green-800' },
      'failed': { text: '失败', color: 'bg-red-100 text-red-800' },
      'needs_password': { text: '需要密码', color: 'bg-orange-100 text-orange-800' },
      'needs_verification': { text: '需要验证', color: 'bg-purple-100 text-purple-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
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
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="card-elevated p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">记忆分析记录</h2>
              <p className="text-sm text-gray-500 mt-1">查看和管理您的分析历史</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadRecords}
                className="btn btn-secondary flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {loading ? '加载中...' : '刷新'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建分析
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>状态</th>
                  <th>图片数量</th>
                  <th>时间范围</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{record.id.substring(0, 8)}...</code>
                    </td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="font-medium">{record.image_count || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {record.time_range ? (
                          <div>
                            <div className="font-medium">{record.time_range[0]}</div>
                            <div className="text-xs text-gray-500">至 {record.time_range[1]}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{new Date(record.created_at).toLocaleString('zh-CN')}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 flex-wrap">
                        {record.status === 'completed' && (
                          <>
                            <button
                              onClick={() => viewRecord(record.id)}
                              className="btn btn-ghost text-indigo-600 text-xs px-3 py-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              查看结果
                            </button>
                            {record.used_photos && record.used_photos.length > 0 && (
                              <button
                                onClick={() => viewRecordImages(record)}
                                className="btn btn-ghost text-green-600 text-xs px-3 py-1.5"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                查看图片
                              </button>
                            )}
                          </>
                        )}
                        {record.status === 'failed' && (
                          <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded">
                            {record.error_message || '分析失败'}
                          </span>
                        )}
                        {record.status === 'needs_password' && (
                          <button
                            onClick={() => {
                              setPasswordRecordId(record.id)
                              setPasswordModalVisible(true)
                            }}
                            className="btn btn-ghost text-orange-600 text-xs px-3 py-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            提供密码
                          </button>
                        )}
                        {record.status === 'needs_verification' && (
                          <button
                            onClick={() => {
                              setCurrentRecordId(record.id)
                              setShowVerificationForm(true)
                            }}
                            className="btn btn-ghost text-purple-600 text-xs px-3 py-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            输入验证码
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="btn btn-ghost text-red-600 hover:bg-red-50 text-xs px-3 py-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {records.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无记录</h3>
              <p className="text-gray-500 text-sm mb-6">创建您的第一个记忆分析</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建分析
              </button>
            </div>
          )}

          {/* 验证码输入表单 */}
          {showVerificationForm && (
            <div className="modal-overlay">
              <div className="modal-content w-full max-w-md mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">输入 iCloud 验证码</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">Apple 已向您的设备发送验证码</p>

                  {verificationError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-700">{verificationError}</span>
                    </div>
                  )}

                  {verificationSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-700">{verificationSuccess}</span>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">验证码</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="input text-center text-lg tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleProvideVerificationCode}
                      className="btn btn-primary flex-1"
                    >
                      提交验证码
                    </button>
                    <button
                      onClick={() => setShowVerificationForm(false)}
                      className="btn btn-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 密码输入表单 */}
          {passwordModalVisible && (
            <div className="modal-overlay">
              <div className="modal-content w-full max-w-md mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">输入 iCloud 密码</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">请输入您的 iCloud 密码以继续</p>

                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-700">{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-700">{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">iCloud 密码</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="input"
                      placeholder="••••••••"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleProvidePassword}
                      className="btn btn-primary flex-1"
                    >
                      提交密码
                    </button>
                    <button
                      onClick={() => setPasswordModalVisible(false)}
                      className="btn btn-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 结果详情弹窗 */}
          {selectedRecord && (
            <div className="modal-overlay z-50">
              <div className="modal-content w-full max-w-5xl mx-4">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">分析结果详情</h3>
                    <p className="text-sm text-gray-500">ID: {selectedRecord.id.substring(0, 8)}...</p>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">

                  {/* Phase 1 结果 */}
                  {selectedRecord.phase1_results && selectedRecord.phase1_results.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-blue-600">Phase 1 分析结果</h4>
                      <div className="space-y-4">
                        {selectedRecord.phase1_results.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium">{result.batch_id}</h5>
                              <span className="text-sm text-gray-500">
                                {result.image_count} 张照片
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              {result.analysis_summary}
                            </div>
                            {result.raw_vlm_output && (
                              <details className="mt-2">
                                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                  查看原始输出
                                </summary>
                                <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                  {result.raw_vlm_output}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phase 2 结果 */}
                  {selectedRecord.phase2_result && (
                    <div className="mb-6">
                      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                        <h4 className="text-lg font-semibold text-green-600">Phase 2 综合分析</h4>
                        <div className="flex items-center gap-2">
                          <select
                            className="w-48 p-2 border rounded text-sm"
                            value={selectedPromptGroup}
                            onChange={(e) => setSelectedPromptGroup(e.target.value)}
                          >
                            <option value="">-- 选择提示词组 --</option>
                            {promptGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRegeneratePhase2(selectedRecord)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                            disabled={!selectedPromptGroup}
                          >
                            重新生成
                          </button>
                        </div>
                      </div>
                      
                      {/* Phase 2 版本选择 */}
                      {selectedRecord.phase2_results && selectedRecord.phase2_results.length > 1 && (
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2 text-sm">选择版本：</label>
                          <select
                            className="w-full p-2 border rounded text-sm"
                            value={selectedPhase2Version || ''}
                            onChange={(e) => setSelectedPhase2Version(e.target.value)}
                          >
                            {selectedRecord.phase2_results.map((version, index) => (
                              <option key={version.prompt_group_id || index} value={version.prompt_group_id || index}>
                                {version.prompt_group_name} ({new Date(version.created_at).toLocaleString('zh-CN')})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {/* 元信息 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.meta && (
                            <div className="border rounded-lg p-4">
                              <h5 className="font-medium mb-2">概览</h5>
                              <div className="text-sm text-gray-600">
                                {phase2Data.meta.scan_summary}
                              </div>
                              {phase2Data.meta.timeline_chapters && (
                                <div className="mt-2">
                                  <span className="font-medium">时间线章节：</span>
                                  <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                                    {phase2Data.meta.timeline_chapters.map((chapter, index) => (
                                      <li key={index}>{chapter}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 空间时间 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.L1_Spatio_Temporal && (
                            <div className="border rounded-lg p-4">
                              <h5 className="font-medium mb-2">空间时间维度</h5>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div><span className="font-medium">生活半径：</span>{phase2Data.L1_Spatio_Temporal.life_radius}</div>
                                <div><span className="font-medium">生物钟：</span>{phase2Data.L1_Spatio_Temporal.biological_clock}</div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 社交图谱 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.L3_Social_Graph && (
                            <div className="border rounded-lg p-4">
                              <h5 className="font-medium mb-2">社交图谱</h5>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">核心社交圈：</span>
                                  {phase2Data.L3_Social_Graph.core_circle.length > 0 ? (
                                    <ul className="list-disc list-inside mt-1">
                                      {phase2Data.L3_Social_Graph.core_circle.map((person, index) => {
                                        if (typeof person === 'object' && person !== null) {
                                          const name_id = person.name_id != null ? String(person.name_id) : '未知'
                                          const relation = person.relation != null ? String(person.relation) : '未知'
                                          const frequency = person.frequency != null ? String(person.frequency) : '未知'
                                          return <li key={index}>{name_id}: {relation} ({frequency})</li>
                                        } else {
                                          return <li key={index}>{String(person)}</li>
                                        }
                                      })}
                                    </ul>
                                  ) : (
                                    <span className="text-gray-400">暂无数据</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 行为趋势 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.L4_Behavior_Trends && (
                            <div className="border rounded-lg p-4">
                              <h5 className="font-medium mb-2">行为趋势</h5>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div><span className="font-medium">社交面具：</span>{phase2Data.L4_Behavior_Trends.social_mask}</div>
                                <div><span className="font-medium">消费变化：</span>{phase2Data.L4_Behavior_Trends.consumption_shift}</div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 心理学 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.L5_Psychology && (
                            <div className="border rounded-lg p-4">
                              <h5 className="font-medium mb-2">心理学分析</h5>
                              <div className="space-y-2 text-sm text-gray-600">
                                <div><span className="font-medium">人格类型：</span>{phase2Data.L5_Psychology.personality_type}</div>
                                <div><span className="font-medium">情绪曲线：</span>{phase2Data.L5_Psychology.emotional_curve}</div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 故事钩子 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.L6_Hooks && (
                            <div className="border rounded-lg p-4">
                              <h5 className="font-medium mb-2">故事钩子</h5>
                              <div className="text-sm text-gray-600">
                                {phase2Data.L6_Hooks.story_trigger}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 原始输出 */}
                        {(() => {
                          const phase2Data = selectedRecord.phase2_results && selectedRecord.phase2_results.length > 0 && selectedPhase2Version 
                            ? selectedRecord.phase2_results.find(v => v.prompt_group_id === selectedPhase2Version || selectedRecord.phase2_results.indexOf(v) === parseInt(selectedPhase2Version))?.result 
                            : selectedRecord.phase2_result;
                          
                          return phase2Data?.raw_output && (
                            <details className="mt-4">
                              <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                查看原始输出
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {phase2Data.raw_output}
                              </div>
                            </details>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 统计信息 */}
                  {selectedRecord.stats && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-green-600">统计信息</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">耗时统计</h5>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div><span className="font-medium">总耗时：</span>{selectedRecord.stats.total_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">下载图片耗时：</span>{selectedRecord.stats.download_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">过滤图片耗时：</span>{selectedRecord.stats.filter_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">Phase 1 分析耗时：</span>{selectedRecord.stats.phase1_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">Phase 2 分析耗时：</span>{selectedRecord.stats.phase2_time?.toFixed(2) || 0} 秒</div>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Token 消耗</h5>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div><span className="font-medium">Phase 1 总Token消耗：</span>{selectedRecord.stats.phase1_tokens || 0}</div>
                            <div><span className="font-medium">Phase 1 输入Token消耗：</span>{selectedRecord.stats.phase1_prompt_tokens || 0}</div>
                            <div><span className="font-medium">Phase 1 输出Token消耗：</span>{selectedRecord.stats.phase1_candidates_tokens || 0}</div>
                            <div className="border-t border-gray-200 my-2"></div>
                            <div><span className="font-medium">Phase 2 总Token消耗：</span>{selectedRecord.stats.phase2_tokens || 0}</div>
                            <div><span className="font-medium">Phase 2 输入Token消耗：</span>{selectedRecord.stats.phase2_prompt_tokens || 0}</div>
                            <div><span className="font-medium">Phase 2 输出Token消耗：</span>{selectedRecord.stats.phase2_candidates_tokens || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedRecord.phase1_results && !selectedRecord.phase2_result && (
                    <div className="text-center py-8 text-gray-500">
                      暂无分析结果
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 图片查看模态框 */}
        {showImagesModal && (
          <div className="modal-overlay z-50">
            <div className="modal-content w-full max-w-5xl mx-4">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">使用的图片</h3>
                  <p className="text-sm text-gray-500">{recordImages.length} 张照片</p>
                </div>
                <button
                  onClick={() => setShowImagesModal(false)}
                  className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">

                {imagesLoading && (
                  <div className="text-center py-8">
                    <p>加载图片中...</p>
                  </div>
                )}

                {imagesError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {imagesError}
                  </div>
                )}

                {!imagesLoading && !imagesError && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {recordImages.length > 0 ? (
                      recordImages.map((image) => (
                        <div key={image.id} className="card overflow-hidden group">
                          <div className="aspect-square overflow-hidden bg-gray-100">
                            <img
                              src={`/api/images/data/${image.id}`}
                              alt={image.filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-3">
                            <div className="font-medium text-sm truncate mb-1" title={image.filename}>
                              {image.filename}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {new Date(image.datetime).toLocaleString('zh-CN')}
                            </div>
                            {image.features && (
                              <div className="flex gap-2 mb-2">
                                <div className="flex-1 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg px-2 py-1 text-center">
                                  <div className="text-xs text-gray-500">美学</div>
                                  <div className="text-sm font-semibold text-pink-600">
                                    {image.features.aesthetic_score?.toFixed(2) || 'N/A'}
                                  </div>
                                </div>
                                <div className="flex-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-2 py-1 text-center">
                                  <div className="text-xs text-gray-500">信息</div>
                                  <div className="text-sm font-semibold text-blue-600">
                                    {image.features.information_score?.toFixed(2) || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            )}
                            {image.compressed_info && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                {image.compressed_info.width}x{image.compressed_info.height} · {image.compressed_info.format}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">暂无图片</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}

export default MemoryRecordsPage