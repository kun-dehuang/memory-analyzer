import React, { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store'
import { memoryAPI, promptAPI, userAPI } from '../api/api'

// 注入全局样式（包含响应式、伪类、动画）
if (!document.getElementById('dashboard-page-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-page-styles';
  styleSheet.textContent = `
    /* 全局动画 */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    /* 响应式容器 */
    .dashboard-container {
      max-width: 7xl;
      margin: 0 auto;
      padding: 0 1rem;
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }
    @media (min-width: 640px) {
      .dashboard-container {
        padding: 0 1.5rem;
        padding-top: 2rem;
        padding-bottom: 2rem;
      }
    }
    @media (min-width: 1024px) {
      .dashboard-container {
        padding: 0 2rem;
      }
    }
    
    /* 导航栏容器 */
    .navbar-container {
      max-width: 7xl;
      margin: 0 auto;
      padding: 0 1rem;
    }
    @media (min-width: 640px) {
      .navbar-container {
        padding: 0 1.5rem;
      }
    }
    @media (min-width: 1024px) {
      .navbar-container {
        padding: 0 2rem;
      }
    }
    
    /* 卡片响应式 */
    .card-elevated {
      margin-bottom: 1.5rem;
      padding: 1.5rem;
    }
    @media (min-width: 640px) {
      .card-elevated {
        margin-bottom: 2rem;
        padding: 2rem;
      }
    }
    
    /* 按钮样式（伪类） */
    .btn-ghost {
      background-color: transparent;
      color: #374151;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }
    .btn-ghost:hover {
      background-color: #f3f4f6;
    }
    .btn-ghost-logout {
      color: #dc2626;
    }
    .btn-ghost-logout:hover {
      background-color: #fef2f2;
    }
    @media (min-width: 640px) {
      .btn-ghost {
        padding: 0.375rem 1rem;
        font-size: 1rem;
      }
    }
    
    /* 按钮文字响应式 */
    .btn-text {
      display: none;
    }
    @media (min-width: 640px) {
      .btn-text {
        display: inline;
      }
    }
    
    /* 卡片hover效果 */
    .card {
      background-color: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    /* 统计卡片网格 */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
      }
    }
    
    /* 上传区域样式 */
    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 1rem;
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      background-color: rgba(249, 250, 251, 0.5);
      transition: border-color 0.2s ease;
    }
    .upload-area:hover {
      border-color: #818cf8;
    }
    
    /* 主按钮样式 */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.625rem 1rem;
      gap: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: #4f46e5;
      color: white;
    }
    .btn-primary:disabled {
      background-color: #818cf8;
      cursor: not-allowed;
      opacity: 0.7;
    }
    
    /* 次要按钮样式 */
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.625rem 1rem;
      gap: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: #f3f4f6;
      color: #374151;
    }
    .btn-secondary:hover {
      background-color: #e5e7eb;
    }
    
    /* 输入框样式 */
    .input-style {
      width: 100%;
      padding: 0.75rem 1rem;
      padding-left: 2.5rem;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      fontSize: 0.875rem;
      lineHeight: 1.25rem;
      color: #111827;
      background-color: white;
      box-sizing: border-box;
      outline: none;
    }
    .input-style:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    
    /* 选择框样式 */
    .select-style {
      width: 100%;
      padding: 0.75rem 1rem;
      padding-left: 2.5rem;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #111827;
      background-color: white;
      box-sizing: border-box;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236b7280%22%3E%3Cpath strokeLinecap=%22round%22 strokeLinejoin=%22round%22 strokeWidth=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1.5rem;
    }
    .select-style:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
  `;
  document.head.appendChild(styleSheet);
}

// 基础内联样式（仅固定值，无媒体查询/伪类）
const styles = {
  // 页面容器
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  },
  // 导航栏
  navbar: {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 40
  },
  navbarContent: {
    display: 'flex',
    justifyContent: 'space-between',
    height: '4rem'
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  navbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  // 卡片样式
  cardElevated: {
    backgroundColor: 'white',
    borderRadius: '1.25rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  // 加载动画
  spinner: {
    width: '1rem',
    height: '1rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite'
  },
  // 用户状态指示器
  userStatus: {
    display: 'none',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#e0e7ff',
    borderRadius: '9999px'
  },
  statusDot: {
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  // 错误/成功提示框
  alertBox: {
    marginBottom: '1rem',
    padding: '1rem',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem'
  },
  alertError: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca'
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0'
  },
  // 表单标题
  formTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  formIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '1.5rem'
  },
  // 标签样式
  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  // 输入框容器
  inputWrapper: {
    position: 'relative',
    marginBottom: '1.5rem'
  },
  inputIcon: {
    position: 'absolute',
    insetY: 0,
    left: 0,
    paddingLeft: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  // 按钮组
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  // 统计卡片
  statCardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem'
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '3rem',
    height: '3rem',
    borderRadius: '2rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease'
  },
  statValue: {
    textAlign: 'right'
  }
}

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
    <div style={styles.pageContainer}>
      {/* 导航栏 */}
      <div style={styles.navbar}>
        <div className="navbar-container">
          <div style={styles.navbarContent}>
            <div style={styles.navbarLeft}>
              {/* Logo图标 - 硬编码尺寸，避免失控 */}
              <svg width="24px" height="24px" style={{ color: '#4f46e5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h1 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '700', 
                color: '#1f2937',
                display: 'none',
                '@media (min-width: 640px)': { display: 'block' }
              }}>Memory Analyzer</h1>
            </div>

            <div style={styles.navbarRight}>
              <div style={{ ...styles.userStatus, display: user ? 'flex' : 'none' }}>
                <div style={styles.statusDot}></div>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4338ca' }}>{user?.nickname || '用户'}</span>
              </div>

              {/* iCloud密码按钮 */}
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn-ghost"
              >
                <svg width="20px" height="20px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="btn-text">{showPasswordForm ? '取消' : 'iCloud 密码'}</span>
              </button>

              {/* 上传照片按钮 */}
              <button
                onClick={() => setShowPhotoForm(!showPhotoForm)}
                className="btn-ghost"
              >
                <svg width="20px" height="20px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="btn-text">{showPhotoForm ? '取消' : '上传照片'}</span>
              </button>

              {/* 退出按钮 */}
              <button
                onClick={handleLogout}
                className="btn-ghost btn-ghost-logout"
              >
                <svg width="20px" height="20px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="btn-text">退出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="dashboard-container">
        {/* iCloud 密码设置表单 */}
        {showPasswordForm && (
          <div style={styles.cardElevated} className="card-elevated">
            <div style={styles.formTitle}>
              <div style={{ ...styles.formIcon, background: 'linear-gradient(to bottom right, #6366f1, #8b5cf6)' }}>
                <svg width="20px" height="20px" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>设置 iCloud 密码</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>安全地存储您的 iCloud 凭证</p>
              </div>
            </div>

            {passwordError && (
              <div style={{ ...styles.alertBox, ...styles.alertError }}>
                <svg width="20px" height="20px" style={{ color: '#ef4444', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0 }}>{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div style={{ ...styles.alertBox, ...styles.alertSuccess }}>
                <svg width="20px" height="20px" style={{ color: '#22c55e', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '0.875rem', color: '#16a34a', margin: 0 }}>{passwordSuccess}</p>
              </div>
            )}

            <div style={styles.inputWrapper}>
              <label style={styles.formLabel}>iCloud 密码</label>
              <div style={styles.inputIcon}>
                <svg width="20px" height="20px" style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={icloudPassword}
                onChange={(e) => setIcloudPassword(e.target.value)}
                className="input-style"
                placeholder="请输入您的 iCloud 密码"
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                onClick={handleUpdateIcloudPassword}
                className="btn-primary"
              >
                <svg width="16px" height="16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 上传照片表单 */}
        {showPhotoForm && (
          <div style={styles.cardElevated} className="card-elevated">
            <div style={styles.formTitle}>
              <div style={{ ...styles.formIcon, background: 'linear-gradient(to bottom right, #ec4899, #e11d48)' }}>
                <svg width="20px" height="20px" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>上传个人照片</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>用于 AI 人脸识别和分析</p>
              </div>
            </div>

            {photoError && (
              <div style={{ ...styles.alertBox, ...styles.alertError }}>
                <svg width="20px" height="20px" style={{ color: '#ef4444', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0 }}>{photoError}</p>
              </div>
            )}

            {photoSuccess && (
              <div style={{ ...styles.alertBox, ...styles.alertSuccess }}>
                <svg width="20px" height="20px" style={{ color: '#22c55e', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '0.875rem', color: '#16a34a', margin: 0 }}>{photoSuccess}</p>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={styles.formLabel}>选择照片</label>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" style={{ cursor: 'pointer' }}>
                  {photoFile ? (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <svg width="48px" height="48px" style={{ margin: '0 auto', color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: '0.5rem 0' }}>{photoFile.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>点击更换照片</p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <svg width="48px" height="48px" style={{ margin: '0 auto', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: '0.5rem 0' }}>点击上传或拖拽照片到此处</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>支持 JPG、PNG 等常见格式</p>
                    </div>
                  )}
                </label>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="16px" height="16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                请上传一张清晰的个人照片，用于提取特征并在后续分析中识别您
              </p>
            </div>

            <div style={styles.buttonGroup}>
              <button
                onClick={handleUploadPhoto}
                className="btn-primary"
                disabled={photoLoading || !photoFile}
              >
                {photoLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={styles.spinner}></span>
                    上传中...
                  </span>
                ) : (
                  <>
                    <svg width="16px" height="16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 生成记忆分析卡片 */}
        <div style={styles.cardElevated} className="card-elevated">
          <div style={styles.formTitle}>
            <div style={{ ...styles.formIcon, background: 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)' }}>
              <svg width="20px" height="20px" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>生成记忆分析</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>AI 深度分析您的照片记忆</p>
            </div>
          </div>

          {error && (
            <div style={{ ...styles.alertBox, ...styles.alertError }}>
              <svg width="20px" height="20px" style={{ color: '#ef4444', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={styles.inputWrapper}>
            <label style={styles.formLabel}>选择提示词组</label>
            <div style={styles.inputIcon}>
              <svg width="20px" height="20px" style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <select
              value={selectedPromptGroup?.id || ''}
              onChange={(e) => {
                const group = promptGroups.find(g => g.id === e.target.value)
                setSelectedPromptGroup(group)
              }}
              className="select-style"
            >
              <option value="">请选择提示词组</option>
              {promptGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.buttonGroup}>
            <button
              onClick={handleGenerateMemory}
              className="btn-primary"
              disabled={loading || !selectedPromptGroup}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={styles.spinner}></span>
                  生成中...
                </span>
              ) : (
                <>
                  <svg width="16px" height="16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  生成记忆分析
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/prompts')}
              className="btn-secondary"
            >
              <svg width="16px" height="16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              管理提示词
            </button>
            <button
              onClick={() => navigate('/memory-records')}
              className="btn-secondary"
            >
              <svg width="16px" height="16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              历史记录
            </button>
          </div>
        </div>

        {/* 快速统计卡片 */}
        <div className="stats-grid">
          {/* 提示词组统计 */}
          <div className="card card-hover">
            <div style={styles.statCardContent}>
              <div style={{ ...styles.statIcon, background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)' }}>
                <svg width="24px" height="24px" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div style={styles.statValue}>
                <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>{promptGroups.length}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>个</p>
              </div>
            </div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: 0 }}>提示词组</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>AI 分析模板</p>
          </div>

          {/* 历史记录统计 */}
          <div className="card card-hover">
            <div style={styles.statCardContent}>
              <div style={{ ...styles.statIcon, background: 'linear-gradient(to bottom right, #8b5cf6, #a855f7)' }}>
                <svg width="24px" height="24px" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div style={styles.statValue}>
                <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>0</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>条</p>
              </div>
            </div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: 0 }}>历史记录</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>分析次数</p>
          </div>

          {/* 分析照片统计 */}
          <div className="card card-hover">
            <div style={styles.statCardContent}>
              <div style={{ ...styles.statIcon, background: 'linear-gradient(to bottom right, #ec4899, #e11d48)' }}>
                <svg width="24px" height="24px" style={{ color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div style={styles.statValue}>
                <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>0</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>张</p>
              </div>
            </div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: 0 }}>分析照片</h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: 0 }}>已处理总数</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage