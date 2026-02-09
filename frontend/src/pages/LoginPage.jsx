import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store'
import { authAPI } from '../api/api'

// 补充内联样式，解决样式缺失问题
const styles = {
  // 基础输入框样式
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: '#111827',
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease-in-out',
    boxSizing: 'border-box'
  },
  // 按钮基础样式
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.75rem',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box'
  },
  // 主按钮样式
  btnPrimary: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem'
  },
  // 加载中动画样式
  spinner: {
    width: '1rem',
    height: '1rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite'
  },
  // 毛玻璃效果
  glass: {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', // 兼容webkit内核
  }
}

// 全局样式注入（解决spinner动画）
if (!document.getElementById('login-page-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'login-page-styles';
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    .btn-primary:hover {
      background-color: #4338ca;
      cursor: pointer;
    }
    .btn-primary:disabled {
      background-color: #818cf8;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(styleSheet);
}

function LoginPage () {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    icloud_email: '',
    icloud_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordHint, setPasswordHint] = useState('')

  const MAX_PASSWORD_LENGTH = 72

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('LoginPage - 开始登录，用户名:', formData.icloud_email)
      const response = await authAPI.login({
        username: formData.icloud_email,
        password: formData.icloud_password
      })

      console.log('LoginPage - 登录成功，响应:', response)
      console.log('LoginPage - token:', response.access_token)
      console.log('LoginPage - user:', response.user)

      dispatch(login({
        user: response.user,
        token: response.access_token
      }))

      console.log('LoginPage - token已保存到Redux和localStorage')
      console.log('LoginPage - localStorage中的token:', localStorage.getItem('token'))

      navigate('/dashboard')
    } catch (err) {
      console.error('LoginPage - 登录失败:', err)
      setError(err.response?.data?.detail || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(to bottom right, #6366f1, #a855f7, #ec4899)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 登录卡片 - 提升层级并约束宽度 */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        maxWidth: '28rem', 
        margin: '0 1rem' 
      }}>
        <div style={{
          ...styles.glass,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.5rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Logo 和标题 */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '50%' }}>
                {/* 图标增加严格尺寸约束 */}
                <svg style={{ width: '2rem', height: '2rem', color: '#4f46e5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>Memory Analyzer</h1>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              分析您的照片，发现隐藏的记忆模式
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '1rem', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem' 
            }}>
              <svg style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>{error}</p>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                iCloud 邮箱
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', insetY: 0, left: 0, paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', top: '12px' }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="icloud_email"
                  value={formData.icloud_email}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingLeft: '2.5rem' }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                iCloud 密码
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', insetY: 0, left: 0, paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', top: '12px' }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="icloud_password"
                  value={formData.icloud_password}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordHint && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.875rem', 
                  color: '#c2410c', 
                  backgroundColor: '#fffbeb', 
                  padding: '0.75rem', 
                  borderRadius: '0.75rem' 
                }}>
                  <svg style={{ width: '1rem', height: '1rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {passwordHint}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{ ...styles.btn, ...styles.btnPrimary, width: '100%', padding: '0.75rem 1rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={styles.spinner}></span>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* 注册链接 */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
              还没有账号？{' '}
              <Link to="/register" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }} 
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                立即注册
              </Link>
            </p>
          </div>
        </div>

        {/* 底部信息 */}
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
          © 2026 Memory Analyzer. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginPage