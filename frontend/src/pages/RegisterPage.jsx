import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/api'

// 新增基础样式，确保不依赖外部CSS框架也能正常显示
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom right, #6366f1, #8b5cf6, #ec4899)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px'
  },
  // 背景装饰元素样式（硬编码尺寸，避免依赖Tailwind）
  bgDecoration: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    filter: 'blur(60px)',
    zIndex: 0
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '24px'
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  inputError: {
    borderColor: '#fca5a5',
    boxShadow: '0 0 0 1px #fca5a5'
  },
  btnPrimary: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnSecondary: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center'
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  errorBox: {
    padding: '16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    borderRadius: '12px',
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  previewImgContainer: {
    marginBottom: '12px',
    position: 'relative',
    width: '100%',
    maxWidth: '200px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  previewImg: {
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '1px solid #e5e7eb'
  },
  removeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '50%',
    padding: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  fileInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  passwordHint: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#d97706',
    backgroundColor: '#fffbeb',
    padding: '8px 12px',
    borderRadius: '8px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  inputWrapper: {
    position: 'relative'
  },
  iconWrapper: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  errorText: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#dc2626'
  },
  successText: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#059669'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite',
    display: 'inline-block'
  },
  loginLink: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#4b5563'
  },
  link: {
    color: '#6366f1',
    fontWeight: '600',
    textDecoration: 'none'
  },
  footerText: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '14px',
    color: '#4b5563'
  }
}

// 定义spin动画（解决加载中旋转效果）
if (!document.querySelector('#register-spinner-style')) {
  const style = document.createElement('style')
  style.id = 'register-spinner-style'
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

function RegisterPage () {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    icloud_email: '',
    icloud_password: '',
    nickname: '',
    photo: null
  })
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [passwordHint, setPasswordHint] = useState('')

  const MAX_PASSWORD_LENGTH = 72
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const NICKNAME_MIN_LENGTH = 2
  const NICKNAME_MAX_LENGTH = 20

  // 密码长度提示逻辑
  useEffect(() => {
    const password = formData.icloud_password
    if (!password) {
      setPasswordHint('')
      return
    }
    
    if (password.length > MAX_PASSWORD_LENGTH) {
      setFormData(prev => ({
        ...prev,
        icloud_password: password.substring(0, MAX_PASSWORD_LENGTH)
      }))
      setPasswordHint(`密码已自动截断至 ${MAX_PASSWORD_LENGTH} 字符（最大限制）`)
    } else if (password.length > MAX_PASSWORD_LENGTH * 0.8) {
      setPasswordHint(`密码长度接近 ${MAX_PASSWORD_LENGTH} 字符限制（当前：${password.length}）`)
    } else {
      setPasswordHint('')
    }
  }, [formData.icloud_password])

  // 图片预览逻辑
  useEffect(() => {
    if (formData.photo) {
      const objectUrl = URL.createObjectURL(formData.photo)
      setPreviewUrl(objectUrl)
      
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreviewUrl('')
    }
  }, [formData.photo])

  // 表单字段变更处理
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    setValidationErrors(prev => ({
      ...prev,
      [name]: ''
    }))
  }

  // 文件选择处理
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileErrors = {}
    if (!file.type.startsWith('image/')) {
      fileErrors.photo = '请选择有效的图片文件（JPG/PNG等）'
    } else if (file.size > MAX_FILE_SIZE) {
      fileErrors.photo = `照片文件大小不能超过5MB（当前：${(file.size / 1024 / 1024).toFixed(2)}MB）`
    }

    if (Object.keys(fileErrors).length > 0) {
      setValidationErrors(fileErrors)
      setFormData(prev => ({ ...prev, photo: null }))
      return
    }

    setFormData(prev => ({
      ...prev,
      photo: file
    }))
    setValidationErrors(prev => ({ ...prev, photo: '' }))
  }

  // 取消文件选择
  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }))
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 表单验证
  const validateForm = () => {
    const errors = {}
    
    // 邮箱验证
    if (!formData.icloud_email.trim()) {
      errors.icloud_email = '请输入iCloud邮箱'
    } else if (!EMAIL_REGEX.test(formData.icloud_email)) {
      errors.icloud_email = '请输入有效的邮箱地址'
    }

    // 密码验证
    if (!formData.icloud_password.trim()) {
      errors.icloud_password = '请输入iCloud密码'
    }

    // 昵称验证
    if (!formData.nickname.trim()) {
      errors.nickname = '请输入昵称'
    } else if (formData.nickname.length < NICKNAME_MIN_LENGTH) {
      errors.nickname = `昵称长度不能少于${NICKNAME_MIN_LENGTH}个字符`
    } else if (formData.nickname.length > NICKNAME_MAX_LENGTH) {
      errors.nickname = `昵称长度不能超过${NICKNAME_MAX_LENGTH}个字符`
    }

    // 照片验证
    if (!formData.photo) {
      errors.photo = '请选择本人照片'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 表单提交处理
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const formDataRegister = new FormData()
      formDataRegister.append('icloud_email', formData.icloud_email.trim())
      formDataRegister.append('icloud_password', formData.icloud_password)
      formDataRegister.append('nickname', formData.nickname.trim())
      formDataRegister.append('photo', formData.photo)

      await authAPI.register(formDataRegister)
      navigate('/login')
    } catch (err) {
      console.error('注册失败:', err)
      
      let errorMessage = '注册失败，请检查信息并重试'
      try {
        if (err.response?.data) {
          errorMessage = err.response.data.detail || 
                         err.response.data.message || 
                         JSON.stringify(err.response.data).substring(0, 100)
        } else if (err.message) {
          errorMessage = err.message
        }
      } catch (e) {
        console.error('处理错误信息失败:', e)
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      icloud_email: '',
      icloud_password: '',
      nickname: '',
      photo: null
    })
    setError('')
    setValidationErrors({})
    setPasswordHint('')
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 键盘事件：ESC重置表单
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        resetForm()
      }
    }
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [])

  return (
    <div style={styles.container}>
      {/* 背景装饰元素（硬编码尺寸，避免失控） */}
      <div style={{...styles.bgDecoration, top: '-160px', right: '-160px', width: '256px', height: '256px'}}></div>
      <div style={{...styles.bgDecoration, bottom: '-160px', left: '-160px', width: '256px', height: '256px'}}></div>
      <div style={{...styles.bgDecoration, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '288px', height: '288px', backgroundColor: 'rgba(255, 255, 255, 0.05)'}}></div>

      {/* 注册卡片 */}
      <div style={styles.card}>
        {/* Logo 和标题 */}
        <div style={styles.titleSection}>
          <div style={styles.titleWrapper}>
            <svg style={{width: '24px', height: '24px', color: '#6366f1'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h1 style={styles.title}>Memory Analyzer</h1>
          </div>
          <p style={styles.subtitle}>创建新账号</p>
        </div>

        {/* 服务端错误提示 */}
        {error && (
          <div style={styles.errorBox}>
            <svg style={{width: '20px', height: '20px', color: '#dc2626', flexShrink: 0, marginTop: '2px'}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{fontSize: '14px', color: '#dc2626', margin: 0}}>{error}</p>
          </div>
        )}

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} style={{margin: 0}} aria-label="用户注册表单">
          {/* iCloud邮箱 */}
          <div style={styles.formGroup}>
            <label htmlFor="icloud_email" style={styles.label}>
              iCloud 邮箱 <span style={{color: '#dc2626'}}>*</span>
            </label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconWrapper}>
                <svg style={{width: '20px', height: '20px', color: '#9ca3af'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                id="icloud_email"
                name="icloud_email"
                value={formData.icloud_email}
                onChange={handleChange}
                style={{...styles.input, ...(validationErrors.icloud_email ? styles.inputError : {})}}
                placeholder="your@email.com"
              />
            </div>
            {validationErrors.icloud_email && (
              <p style={styles.errorText}>{validationErrors.icloud_email}</p>
            )}
          </div>

          {/* iCloud密码 */}
          <div style={styles.formGroup}>
            <label htmlFor="icloud_password" style={styles.label}>
              iCloud 密码 <span style={{color: '#dc2626'}}>*</span>
            </label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconWrapper}>
                <svg style={{width: '20px', height: '20px', color: '#9ca3af'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                id="icloud_password"
                name="icloud_password"
                value={formData.icloud_password}
                onChange={handleChange}
                style={{...styles.input, ...(validationErrors.icloud_password ? styles.inputError : {})}}
                placeholder="••••••••"
              />
            </div>
            {validationErrors.icloud_password && (
              <p style={styles.errorText}>{validationErrors.icloud_password}</p>
            )}
            {passwordHint && (
              <div style={styles.passwordHint}>
                <svg style={{width: '16px', height: '16px', flexShrink: 0}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {passwordHint}
              </div>
            )}
          </div>

          {/* 昵称 */}
          <div style={styles.formGroup}>
            <label htmlFor="nickname" style={styles.label}>
              昵称 <span style={{color: '#dc2626'}}>*</span>
            </label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconWrapper}>
                <svg style={{width: '20px', height: '20px', color: '#9ca3af'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                style={{...styles.input, ...(validationErrors.nickname ? styles.inputError : {})}}
                placeholder="您的昵称"
              />
            </div>
            {validationErrors.nickname && (
              <p style={styles.errorText}>{validationErrors.nickname}</p>
            )}
          </div>

          {/* 照片上传 */}
          <div style={styles.formGroup}>
            <label htmlFor="photo" style={styles.label}>
              本人照片 <span style={{color: '#dc2626'}}>*</span>
            </label>
            
            {/* 图片预览区域 */}
            {previewUrl && (
              <div style={styles.previewImgContainer}>
                <img 
                  src={previewUrl} 
                  alt="预览图" 
                  style={styles.previewImg}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={styles.removeBtn}
                  aria-label="移除照片"
                >
                  <svg style={{width: '16px', height: '16px', color: '#dc2626'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div style={styles.inputWrapper}>
              <div style={styles.iconWrapper}>
                <svg style={{width: '20px', height: '20px', color: '#9ca3af'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{...styles.fileInput, ...(validationErrors.photo ? styles.inputError : {})}}
              />
            </div>
            
            {validationErrors.photo ? (
              <p style={styles.errorText}>{validationErrors.photo}</p>
            ) : formData.photo && (
              <div style={styles.successText}>
                <svg style={{width: '16px', height: '16px'}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {formData.photo.name} ({(formData.photo.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* 提交按钮和重置按钮 */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={resetForm}
              style={{...styles.btnSecondary, ...(loading ? styles.btnDisabled : {})}}
              disabled={loading}
            >
              重置
            </button>
            <button
              type="submit"
              style={{...styles.btnPrimary, ...(loading ? styles.btnDisabled : {})}}
              disabled={loading}
            >
              {loading ? (
                <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <span style={styles.spinner}></span>
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </button>
          </div>
        </form>

        {/* 登录链接 */}
        <div style={styles.loginLink}>
          <p style={{margin: 0, color: '#4b5563'}}>
            已有账号？{' '}
            <Link to="/login" style={styles.link}>
              立即登录
            </Link>
          </p>
        </div>
      </div>

      {/* 底部信息 */}
      <p style={styles.footerText}>
        © 2024 Memory Analyzer. All rights reserved.
      </p>
    </div>
  )
}

export default RegisterPage