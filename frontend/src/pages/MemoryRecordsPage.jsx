import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { memoryAPI, imageAPI, promptAPI } from '../api/api'
import Icon, { ImageFallback } from './components/Icon.jsx'

// 拆分：验证码输入模态框子组件
const VerificationModal = ({
  visible,
  onClose,
  verificationCode,
  onCodeChange,
  verificationError,
  verificationSuccess,
  onSubmit
}) => {
  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md mx-4">
        <div className="p-6">
          {/* 🌟 父容器固定尺寸 + Icon 强制像素尺寸 */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mx-auto mb-4">
            <Icon 
              name="verify" 
              size="xl" 
              color="white" 
              ariaLabel="验证码图标" 
              className="inline-flex flex-shrink-0 overflow-hidden"
              style={{ width: 32, height: 32, flex: 'none' }} // 强制像素尺寸
            />
          </div>
          <h3 className="text-xl font-bold text-center mb-2">输入 iCloud 验证码</h3>
          <p className="text-sm text-gray-500 text-center mb-6">Apple 已向您的设备发送验证码</p>

          {verificationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
              {/* 🌟 Icon 强制像素尺寸 */}
              <Icon 
                name="warning" 
                size="xs" 
                color="#ef4444" 
                className="mt-0.5 flex-shrink-0 inline-flex overflow-hidden"
                style={{ width: 12, height: 12, flex: 'none' }} // 强制像素尺寸
                ariaLabel="错误提示" 
              />
              <span className="text-red-700">{verificationError}</span>
            </div>
          )}

          {verificationSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm">
              {/* 🌟 Icon 强制像素尺寸 */}
              <Icon 
                name="success" 
                size="xs" 
                color="#22c55e" 
                className="mt-0.5 flex-shrink-0 inline-flex overflow-hidden"
                style={{ width: 12, height: 12, flex: 'none' }} // 强制像素尺寸
                ariaLabel="成功提示" 
              />
              <span className="text-green-700">{verificationSuccess}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">验证码</label>
            <input
              type="text"
              value={verificationCode}
              onChange={onCodeChange}
              className="input text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onSubmit}
              className="btn btn-primary flex-1"
              disabled={!!verificationSuccess}
            >
              提交验证码
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={!!verificationSuccess}
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 拆分：密码输入模态框子组件
const PasswordModal = ({
  visible,
  onClose,
  passwordInput,
  onPasswordChange,
  passwordError,
  passwordSuccess,
  onSubmit
}) => {
  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md mx-4">
        <div className="p-6">
          {/* 🌟 父容器固定尺寸 + Icon 强制像素尺寸 */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 mx-auto mb-4">
            <Icon 
              name="lock" 
              size="xl" 
              color="white" 
              ariaLabel="密码图标" 
              className="inline-flex flex-shrink-0 overflow-hidden"
              style={{ width: 32, height: 32, flex: 'none' }} // 强制像素尺寸
            />
          </div>
          <h3 className="text-xl font-bold text-center mb-2">输入 iCloud 密码</h3>
          <p className="text-sm text-gray-500 text-center mb-6">请输入您的 iCloud 密码以继续</p>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
              {/* 🌟 Icon 强制像素尺寸 */}
              <Icon 
                name="warning" 
                size="xs" 
                color="#ef4444" 
                className="mt-0.5 flex-shrink-0 inline-flex overflow-hidden"
                style={{ width: 12, height: 12, flex: 'none' }} // 强制像素尺寸
                ariaLabel="错误提示" 
              />
              <span className="text-red-700">{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm">
              {/* 🌟 Icon 强制像素尺寸 */}
              <Icon 
                name="success" 
                size="xs" 
                color="#22c55e" 
                className="mt-0.5 flex-shrink-0 inline-flex overflow-hidden"
                style={{ width: 12, height: 12, flex: 'none' }} // 强制像素尺寸
                ariaLabel="成功提示" 
              />
              <span className="text-green-700">{passwordSuccess}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">iCloud 密码</label>
            <input
              type="password"
              value={passwordInput}
              onChange={onPasswordChange}
              className="input"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onSubmit}
              className="btn btn-primary flex-1"
              disabled={!!passwordSuccess}
            >
              提交密码
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={!!passwordSuccess}
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 拆分：图片查看模态框子组件
const ImagesModal = ({
  visible,
  onClose,
  images,
  loading,
  error
}) => {
  if (!visible) return null

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content w-full max-w-5xl mx-4">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">使用的图片</h3>
            <p className="text-sm text-gray-500">{images.length} 张照片</p>
          </div>
          {/* 🌟 按钮固定尺寸 + Icon 强制像素尺寸 */}
          <button
            onClick={onClose}
            className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center w-10 h-10"
            style={{ flex: 'none' }} // 禁止拉伸
          >
            <Icon 
              name="close" 
              size="lg" 
              ariaLabel="关闭图片查看" 
              className="inline-flex flex-shrink-0 overflow-hidden"
              style={{ width: 24, height: 24, flex: 'none' }} // 强制像素尺寸
            />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <p>加载图片中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.length > 0 ? (
                images.map((image) => (
                  <div key={image.id} className="card overflow-hidden group">
                    <div className="aspect-square overflow-hidden bg-gray-100 relative">
                      <img
                        src={`/api/images/data/${image.id}`}
                        alt={image.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center';
                          fallback.style.width = '100%';
                          fallback.style.height = '100%';
                          e.target.parentNode.appendChild(fallback);
                          // 🌟 ImageFallback 强制尺寸
                          ReactDOM.render(
                            <ImageFallback 
                              size="2xl" 
                              className="inline-flex flex-shrink-0 overflow-hidden"
                              style={{ width: 32, height: 32, flex: 'none' }} // 强制像素尺寸
                            />, 
                            fallback
                          );
                        }}
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
                  {/* 🌟 ImageFallback 强制尺寸 + 父容器固定尺寸 */}
                  <div style={{ width: 64, height: 64, margin: '0 auto 16px' }}>
                    <ImageFallback 
                      size="2xl" 
                      className="inline-flex flex-shrink-0 overflow-hidden"
                      style={{ width: 32, height: 32, flex: 'none' }} // 强制像素尺寸
                    />
                  </div>
                  <p className="text-gray-500">暂无图片</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 状态映射工具函数（抽离复用）
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

// 主组件
function MemoryRecordsPage () {
  const navigate = useNavigate()
  
  // 整合状态：按功能模块分组
  const [recordsState, setRecordsState] = useState({
    list: [],
    loading: false,
    error: ''
  })
  
  const [modalState, setModalState] = useState({
    verification: {
      visible: false,
      code: '',
      error: '',
      success: '',
      recordId: null
    },
    password: {
      visible: false,
      password: '',
      error: '',
      success: '',
      recordId: null
    },
    images: {
      visible: false,
      list: [],
      loading: false,
      error: ''
    },
    recordDetail: {
      data: null
    }
  })
  
  const [promptState, setPromptState] = useState({
    groups: [],
    selectedGroup: '',
    selectedPhase2Version: null
  })

  // 性能优化：useCallback 包裹回调函数
  const loadRecords = useCallback(async () => {
    setRecordsState(prev => ({ ...prev, loading: true, error: '' }))
    try {
      const response = await memoryAPI.getMemoryRecords()
      setRecordsState(prev => ({ ...prev, list: response, loading: false }))
    } catch (err) {
      setRecordsState(prev => ({ 
        ...prev, 
        error: '加载记录失败', 
        loading: false 
      }))
      console.error('加载记录失败:', err)
    }
  }, [])

  const loadPromptGroups = useCallback(async () => {
    try {
      const groups = await promptAPI.getPromptGroups()
      setPromptState(prev => ({ ...prev, groups }))
    } catch (err) {
      console.error('加载提示词组失败:', err)
    }
  }, [])

  useEffect(() => {
    loadRecords()
    loadPromptGroups()
  }, [loadRecords, loadPromptGroups])

  // 查看记录详情
  const viewRecord = useCallback(async (recordId) => {
    try {
      const record = await memoryAPI.getMemoryRecord(recordId)
      setModalState(prev => ({
        ...prev,
        recordDetail: { data: record }
      }))
      // 重置phase2版本选择
      setPromptState(prev => ({ ...prev, selectedPhase2Version: null }))
    } catch (err) {
      setRecordsState(prev => ({ ...prev, error: '加载记录详情失败' }))
      console.error('加载记录详情失败:', err)
    }
  }, [])

  // 查看记录图片
  const viewRecordImages = useCallback(async (record) => {
    try {
      setModalState(prev => ({
        ...prev,
        images: { ...prev.images, loading: true, error: '' }
      }))
      
      if (record.used_photos && record.used_photos.length > 0) {
        const images = await imageAPI.getImagesBatch(record.used_photos.join(','))
        setModalState(prev => ({
          ...prev,
          images: { ...prev.images, list: images, loading: false, visible: true }
        }))
      } else {
        setModalState(prev => ({
          ...prev,
          images: { ...prev.images, list: [], loading: false, visible: true }
        }))
      }
    } catch (err) {
      setModalState(prev => ({
        ...prev,
        images: { 
          ...prev.images, 
          error: '加载图片失败', 
          list: [], 
          loading: false, 
          visible: true 
        }
      }))
      console.error('加载图片失败:', err)
    }
  }, [])

  // 重新生成Phase2结果
  const handleRegeneratePhase2 = useCallback(async () => {
    const { recordDetail } = modalState
    const { selectedGroup } = promptState
    
    if (!selectedGroup || !recordDetail.data) {
      alert('请选择提示词组')
      return
    }

    try {
      const updatedRecord = await memoryAPI.regeneratePhase2Result(
        recordDetail.data.id,
        selectedGroup
      )
      
      setModalState(prev => ({
        ...prev,
        recordDetail: { data: updatedRecord }
      }))
      alert('重新生成成功')
    } catch (err) {
      console.error('重新生成失败:', err)
      alert('重新生成失败，请重试')
    }
  }, [modalState, promptState])

  // 提交验证码
  const handleProvideVerificationCode = useCallback(async () => {
    const { verification } = modalState
    const { code, recordId } = verification

    if (!code) {
      setModalState(prev => ({
        ...prev,
        verification: { ...prev.verification, error: '请输入验证码' }
      }))
      return
    }

    try {
      await memoryAPI.provideVerificationCode(recordId, code)
      setModalState(prev => ({
        ...prev,
        verification: {
          ...prev.verification,
          success: '验证码已提交，分析任务已继续执行',
          error: '',
          code: ''
        }
      }))
      
      // 2秒后关闭模态框并刷新
      setTimeout(() => {
        setModalState(prev => ({
          ...prev,
          verification: {
            ...prev.verification,
            visible: false,
            success: ''
          }
        }))
        loadRecords()
      }, 2000)
    } catch (err) {
      console.error('提交验证码失败:', err)
      setModalState(prev => ({
        ...prev,
        verification: {
          ...prev.verification,
          error: '提交验证码失败，请重试'
        }
      }))
    }
  }, [modalState, loadRecords])

  // 提交密码
  const handleProvidePassword = useCallback(async () => {
    const { password } = modalState
    const { password: pwd, recordId } = password

    if (!pwd) {
      setModalState(prev => ({
        ...prev,
        password: { ...prev.password, error: '请输入iCloud密码' }
      }))
      return
    }

    try {
      await memoryAPI.providePassword(recordId, pwd)
      setModalState(prev => ({
        ...prev,
        password: {
          ...prev.password,
          success: '密码已提交，分析任务已继续执行',
          error: '',
          password: ''
        }
      }))
      
      // 2秒后关闭模态框并刷新
      setTimeout(() => {
        setModalState(prev => ({
          ...prev,
          password: {
            ...prev.password,
            visible: false,
            success: ''
          }
        }))
        loadRecords()
      }, 2000)
    } catch (err) {
      console.error('提交密码失败:', err)
      setModalState(prev => ({
        ...prev,
        password: {
          ...prev.password,
          error: '提交密码失败，请重试'
        }
      }))
    }
  }, [modalState, loadRecords])

  // 删除记录
  const handleDeleteRecord = useCallback(async (recordId) => {
    if (window.confirm('确定要删除这条记忆记录吗？此操作不可撤销。')) {
      try {
        await memoryAPI.deleteMemoryRecord(recordId)
        loadRecords()
      } catch (err) {
        console.error('删除记录失败:', err)
        setRecordsState(prev => ({ ...prev, error: '删除记录失败，请重试' }))
      }
    }
  }, [loadRecords])

  // 处理Phase2数据读取（避免空值报错）
  const getPhase2Data = useMemo(() => {
    const { recordDetail } = modalState
    const { selectedPhase2Version } = promptState
    
    if (!recordDetail.data) return null
    
    // 优先使用版本选择的phase2数据
    if (recordDetail.data.phase2_results && recordDetail.data.phase2_results.length > 0) {
      if (selectedPhase2Version !== null) {
        const selected = recordDetail.data.phase2_results.find(
          v => v.prompt_group_id === selectedPhase2Version || 
               recordDetail.data.phase2_results.indexOf(v) === parseInt(selectedPhase2Version)
        )
        return selected?.result || recordDetail.data.phase2_result
      }
      // 默认返回第一个版本
      return recordDetail.data.phase2_results[0]?.result || recordDetail.data.phase2_result
    }
    
    return recordDetail.data.phase2_result
  }, [modalState, promptState])

  return (
    <div className="min-h-screen page-container">
      {/* 导航栏 */}
      <nav className="navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              {/* 🌟 父容器固定尺寸 + Icon 强制像素尺寸 */}
              <div style={{ width: 20, height: 20, flex: 'none' }}>
                <Icon 
                  name="empty" 
                  size="md" 
                  color="#4f46e5" 
                  ariaLabel="Memory Analyzer Logo" 
                  className="inline-flex flex-shrink-0 overflow-hidden"
                  style={{ width: 20, height: 20, flex: 'none' }} // 强制像素尺寸
                />
              </div>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Memory Analyzer</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary flex items-center gap-2"
                style={{ whiteSpace: 'nowrap' }}
              >
                {/* 🌟 Icon 强制像素尺寸 */}
                <Icon 
                  name="back" 
                  size="sm" 
                  ariaLabel="返回首页" 
                  className="inline-flex flex-shrink-0 overflow-hidden"
                  style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                />
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
                disabled={recordsState.loading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {recordsState.loading ? (
                  <span className="spinner"></span>
                ) : (
                  // 🌟 Icon 强制像素尺寸
                  <Icon 
                    name="refresh" 
                    size="sm" 
                    ariaLabel="刷新记录" 
                    className="inline-flex flex-shrink-0 overflow-hidden"
                    style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                  />
                )}
                {recordsState.loading ? '加载中...' : '刷新'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary flex items-center gap-2"
                style={{ whiteSpace: 'nowrap' }}
              >
                {/* 🌟 Icon 强制像素尺寸 */}
                <Icon 
                  name="add" 
                  size="sm" 
                  ariaLabel="新建分析" 
                  className="inline-flex flex-shrink-0 overflow-hidden"
                  style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                />
                新建分析
              </button>
            </div>
          </div>

          {recordsState.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              {/* 🌟 Icon 强制像素尺寸 */}
              <Icon 
                name="warning" 
                size="sm" 
                color="#ef4444" 
                className="mt-0.5 flex-shrink-0 inline-flex overflow-hidden"
                style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                ariaLabel="错误提示" 
              />
              <p className="text-sm text-red-700">{recordsState.error}</p>
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
                {recordsState.list.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{record.id.substring(0, 8)}...</code>
                    </td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {/* 🌟 父容器固定尺寸 + Icon 强制像素尺寸 */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                          <Icon 
                            name="image" 
                            size="sm" 
                            color="#ec4899" 
                            ariaLabel="图片数量" 
                            className="inline-flex flex-shrink-0 overflow-hidden"
                            style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                          />
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
                              className="btn btn-ghost text-indigo-600 text-xs px-3 py-1.5 flex items-center gap-1"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {/* 🌟 Icon 强制像素尺寸 */}
                              <Icon 
                                name="eye" 
                                size="sm" 
                                ariaLabel="查看结果" 
                                className="inline-flex flex-shrink-0 overflow-hidden"
                                style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                              />
                              查看结果
                            </button>
                            {record.used_photos && record.used_photos.length > 0 && (
                              <button
                                onClick={() => viewRecordImages(record)}
                                className="btn btn-ghost text-green-600 text-xs px-3 py-1.5 flex items-center gap-1"
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                {/* 🌟 Icon 强制像素尺寸 */}
                                <Icon 
                                  name="image" 
                                  size="sm" 
                                  ariaLabel="查看图片" 
                                  className="inline-flex flex-shrink-0 overflow-hidden"
                                  style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                                />
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
                              setModalState(prev => ({
                                ...prev,
                                password: {
                                  ...prev.password,
                                  visible: true,
                                  recordId: record.id,
                                  error: '',
                                  success: ''
                                }
                              }))
                            }}
                            className="btn btn-ghost text-orange-600 text-xs px-3 py-1.5 flex items-center gap-1"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {/* 🌟 Icon 强制像素尺寸 */}
                            <Icon 
                              name="lock" 
                              size="sm" 
                              ariaLabel="提供密码" 
                              className="inline-flex flex-shrink-0 overflow-hidden"
                              style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                            />
                            提供密码
                          </button>
                        )}
                        {record.status === 'needs_verification' && (
                          <button
                            onClick={() => {
                              setModalState(prev => ({
                                ...prev,
                                verification: {
                                  ...prev.verification,
                                  visible: true,
                                  recordId: record.id,
                                  error: '',
                                  success: ''
                                }
                              }))
                            }}
                            className="btn btn-ghost text-purple-600 text-xs px-3 py-1.5 flex items-center gap-1"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {/* 🌟 Icon 强制像素尺寸 */}
                            <Icon 
                              name="verify" 
                              size="sm" 
                              ariaLabel="输入验证码" 
                              className="inline-flex flex-shrink-0 overflow-hidden"
                              style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                            />
                            输入验证码
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="btn btn-ghost text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 flex items-center gap-1"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {/* 🌟 Icon 强制像素尺寸 */}
                          <Icon 
                            name="delete" 
                            size="sm" 
                            ariaLabel="删除记录" 
                            className="inline-flex flex-shrink-0 overflow-hidden"
                            style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                          />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recordsState.list.length === 0 && !recordsState.loading && (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                {/* 🌟 父容器固定尺寸 + Icon 强制像素尺寸 */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <Icon 
                    name="file" 
                    size="2xl" 
                    color="#818cf8" 
                    ariaLabel="暂无记录" 
                    className="inline-flex flex-shrink-0 overflow-hidden"
                    style={{ width: 32, height: 32, flex: 'none' }} // 强制像素尺寸
                  />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无记录</h3>
              <p className="text-gray-500 text-sm mb-6">创建您的第一个记忆分析</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary flex items-center gap-2"
                style={{ whiteSpace: 'nowrap' }}
              >
                {/* 🌟 Icon 强制像素尺寸 */}
                <Icon 
                  name="add" 
                  size="sm" 
                  ariaLabel="新建分析" 
                  className="inline-flex flex-shrink-0 overflow-hidden"
                  style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                />
                新建分析
              </button>
            </div>
          )}

          {/* 子组件引用：验证码模态框 */}
          <VerificationModal
            visible={modalState.verification.visible}
            onClose={() => setModalState(prev => ({
              ...prev,
              verification: { ...prev.verification, visible: false }
            }))}
            verificationCode={modalState.verification.code}
            onCodeChange={(e) => setModalState(prev => ({
              ...prev,
              verification: { ...prev.verification, code: e.target.value, error: '' }
            }))}
            verificationError={modalState.verification.error}
            verificationSuccess={modalState.verification.success}
            onSubmit={handleProvideVerificationCode}
          />

          {/* 子组件引用：密码模态框 */}
          <PasswordModal
            visible={modalState.password.visible}
            onClose={() => setModalState(prev => ({
              ...prev,
              password: { ...prev.password, visible: false }
            }))}
            passwordInput={modalState.password.password}
            onPasswordChange={(e) => setModalState(prev => ({
              ...prev,
              password: { ...prev.password, password: e.target.value, error: '' }
            }))}
            passwordError={modalState.password.error}
            passwordSuccess={modalState.password.success}
            onSubmit={handleProvidePassword}
          />

          {/* 子组件引用：图片查看模态框 */}
          <ImagesModal
            visible={modalState.images.visible}
            onClose={() => setModalState(prev => ({
              ...prev,
              images: { ...prev.images, visible: false }
            }))}
            images={modalState.images.list}
            loading={modalState.images.loading}
            error={modalState.images.error}
          />

          {/* 结果详情弹窗 */}
          {modalState.recordDetail.data && (
            <div className="modal-overlay z-50">
              <div className="modal-content w-full max-w-5xl mx-4">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">分析结果详情</h3>
                    <p className="text-sm text-gray-500">ID: {modalState.recordDetail.data.id.substring(0, 8)}...</p>
                  </div>
                  {/* 🌟 按钮固定尺寸 + Icon 强制像素尺寸 */}
                  <button
                    onClick={() => setModalState(prev => ({
                      ...prev,
                      recordDetail: { data: null }
                    }))}
                    className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center w-10 h-10 flex-shrink-0"
                  >
                    <Icon 
                      name="close" 
                      size="lg" 
                      ariaLabel="关闭详情" 
                      className="inline-flex flex-shrink-0 overflow-hidden"
                      style={{ width: 24, height: 24, flex: 'none' }} // 强制像素尺寸
                    />
                  </button>
                </div>

                <div className="p-6">
                  {/* Phase 1 结果 */}
                  {modalState.recordDetail.data.phase1_results && modalState.recordDetail.data.phase1_results.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-blue-600">Phase 1 分析结果</h4>
                      <div className="space-y-4">
                        {modalState.recordDetail.data.phase1_results.map((result, index) => (
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
                  {getPhase2Data && (
                    <div className="mb-6">
                      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                        <h4 className="text-lg font-semibold text-green-600">Phase 2 综合分析</h4>
                        <div className="flex items-center gap-2">
                          <select
                            className="w-48 p-2 border rounded text-sm"
                            value={promptState.selectedGroup}
                            onChange={(e) => setPromptState(prev => ({
                              ...prev,
                              selectedGroup: e.target.value
                            }))}
                          >
                            <option value="">-- 选择提示词组 --</option>
                            {promptState.groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleRegeneratePhase2}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1"
                            disabled={!promptState.selectedGroup}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {/* 🌟 Icon 强制像素尺寸 */}
                            <Icon 
                              name="refresh" 
                              size="sm" 
                              color="white" 
                              className="inline-flex flex-shrink-0 overflow-hidden"
                              style={{ width: 16, height: 16, flex: 'none' }} // 强制像素尺寸
                            />
                            重新生成
                          </button>
                        </div>
                      </div>
                      
                      {/* Phase 2 版本选择 */}
                      {modalState.recordDetail.data.phase2_results && modalState.recordDetail.data.phase2_results.length > 1 && (
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2 text-sm">选择版本：</label>
                          <select
                            className="w-full p-2 border rounded text-sm"
                            value={promptState.selectedPhase2Version || ''}
                            onChange={(e) => setPromptState(prev => ({
                              ...prev,
                              selectedPhase2Version: e.target.value
                            }))}
                          >
                            {modalState.recordDetail.data.phase2_results.map((version, index) => (
                              <option 
                                key={version.prompt_group_id || index} 
                                value={version.prompt_group_id || index}
                              >
                                {version.prompt_group_name} ({new Date(version.created_at).toLocaleString('zh-CN')})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {/* 元信息 */}
                        {getPhase2Data.meta && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">概览</h5>
                            <div className="text-sm text-gray-600">
                              {getPhase2Data.meta.scan_summary}
                            </div>
                            {getPhase2Data.meta.timeline_chapters && (
                              <div className="mt-2">
                                <span className="font-medium">时间线章节：</span>
                                <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                                  {getPhase2Data.meta.timeline_chapters.map((chapter, index) => (
                                    <li key={index}>{chapter}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 空间时间 */}
                        {getPhase2Data.L1_Spatio_Temporal && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">空间时间维度</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div><span className="font-medium">生活半径：</span>{getPhase2Data.L1_Spatio_Temporal.life_radius}</div>
                              <div><span className="font-medium">生物钟：</span>{getPhase2Data.L1_Spatio_Temporal.biological_clock}</div>
                            </div>
                          </div>
                        )}

                        {/* 社交图谱 */}
                        {getPhase2Data.L3_Social_Graph && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">社交图谱</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">核心社交圈：</span>
                                {getPhase2Data.L3_Social_Graph.core_circle.length > 0 ? (
                                  <ul className="list-disc list-inside mt-1">
                                    {getPhase2Data.L3_Social_Graph.core_circle.map((person, index) => {
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
                        )}

                        {/* 行为趋势 */}
                        {getPhase2Data.L4_Behavior_Trends && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">行为趋势</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div><span className="font-medium">社交面具：</span>{getPhase2Data.L4_Behavior_Trends.social_mask}</div>
                              <div><span className="font-medium">消费变化：</span>{getPhase2Data.L4_Behavior_Trends.consumption_shift}</div>
                            </div>
                          </div>
                        )}

                        {/* 心理学 */}
                        {getPhase2Data.L5_Psychology && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">心理学分析</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div><span className="font-medium">人格类型：</span>{getPhase2Data.L5_Psychology.personality_type}</div>
                              <div><span className="font-medium">情绪曲线：</span>{getPhase2Data.L5_Psychology.emotional_curve}</div>
                            </div>
                          </div>
                        )}

                        {/* 故事钩子 */}
                        {getPhase2Data.L6_Hooks && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">故事钩子</h5>
                            <div className="text-sm text-gray-600">
                              {getPhase2Data.L6_Hooks.story_trigger}
                            </div>
                          </div>
                        )}

                        {/* 原始输出 */}
                        {getPhase2Data.raw_output && (
                          <details className="mt-4">
                            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                              查看原始输出
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {getPhase2Data.raw_output}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 统计信息 */}
                  {modalState.recordDetail.data.stats && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-green-600">统计信息</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">耗时统计</h5>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div><span className="font-medium">总耗时：</span>{modalState.recordDetail.data.stats.total_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">下载图片耗时：</span>{modalState.recordDetail.data.stats.download_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">过滤图片耗时：</span>{modalState.recordDetail.data.stats.filter_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">Phase 1 分析耗时：</span>{modalState.recordDetail.data.stats.phase1_time?.toFixed(2) || 0} 秒</div>
                            <div><span className="font-medium">Phase 2 分析耗时：</span>{modalState.recordDetail.data.stats.phase2_time?.toFixed(2) || 0} 秒</div>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Token 消耗</h5>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div><span className="font-medium">Phase 1 总Token消耗：</span>{modalState.recordDetail.data.stats.phase1_tokens || 0}</div>
                            <div><span className="font-medium">Phase 1 输入Token消耗：</span>{modalState.recordDetail.data.stats.phase1_prompt_tokens || 0}</div>
                            <div><span className="font-medium">Phase 1 输出Token消耗：</span>{modalState.recordDetail.data.stats.phase1_candidates_tokens || 0}</div>
                            <div className="border-t border-gray-200 my-2"></div>
                            <div><span className="font-medium">Phase 2 总Token消耗：</span>{modalState.recordDetail.data.stats.phase2_tokens || 0}</div>
                            <div><span className="font-medium">Phase 2 输入Token消耗：</span>{modalState.recordDetail.data.stats.phase2_prompt_tokens || 0}</div>
                            <div><span className="font-medium">Phase 2 输出Token消耗：</span>{modalState.recordDetail.data.stats.phase2_candidates_tokens || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!modalState.recordDetail.data.phase1_results && !modalState.recordDetail.data.phase2_result && (
                    <div className="text-center py-8 text-gray-500">
                      暂无分析结果
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemoryRecordsPage