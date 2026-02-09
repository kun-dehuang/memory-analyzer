import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memoryAPI } from '../api/api'
import BasicInfo from './components/BasicInfo.jsx'
import Phase2Result from './components/Phase2Result.jsx'
import Phase1Results from './components/Phase1Results.jsx'

function ResultDetailPage () {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const mainContentRef = useRef(null)
  
  // 监听滚动，显示/隐藏回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // 回到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  // 加载记录
  const loadRecord = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')
    
    try {
      if (!recordId) {
        throw new Error('记录ID不存在')
      }
      
      const response = await memoryAPI.getMemoryRecord(recordId)
      setRecord(response)
      
      // 如果有错误提示且加载成功，清除错误
      if (error.includes('重新分析任务已开始')) {
        setError('重新分析完成，已加载最新结果')
      }
    } catch (err) {
      const errorMsg = err.message || '加载记录失败'
      setError(errorMsg)
      console.error('加载记录失败:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [recordId, error])
  
  // 初始加载
  useEffect(() => {
    loadRecord()
  }, [loadRecord])
  
  // 重新分析
  const handleReanalyze = async () => {
    setLoading(true)
    setError('')
    
    try {
      await memoryAPI.reanalyzeMemoryRecord(recordId)
      setError('重新分析任务已提交，系统正在处理，请稍候...')
      
      // 轮询获取最新结果（比固定timeout更可靠）
      const pollInterval = setInterval(async () => {
        try {
          const latestRecord = await memoryAPI.getMemoryRecord(recordId)
          // 如果状态变为处理中或已完成，更新并停止轮询
          if (latestRecord.status !== 'pending') {
            setRecord(latestRecord)
            clearInterval(pollInterval)
            setLoading(false)
            setError('重新分析完成，已加载最新结果')
          }
        } catch (err) {
          console.error('轮询加载失败:', err)
        }
      }, 2000)
      
      // 最多轮询30秒
      setTimeout(() => {
        clearInterval(pollInterval)
        if (loading) {
          setLoading(false)
          setError('重新分析任务正在后台处理，您可以刷新页面查看最新结果')
        }
      }, 30000)
      
    } catch (err) {
      setError('重新分析失败：' + (err.message || '未知错误'))
      console.error('重新分析失败:', err)
      setLoading(false)
    }
  }
  
  // 加载状态渲染
  if (loading && !record) {
    return (
      <div className="min-h-screen page-container flex items-center justify-center">
        <div className="card-elevated p-8 sm:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <span className="spinner spinner-lg"></span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">加载中...</h2>
          <p className="text-gray-500">正在获取分析结果</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen page-container" ref={mainContentRef}>
      {/* 导航栏 */}
      <nav className="navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Memory Analyzer</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/memory-records')}
                className="btn btn-secondary flex items-center gap-2 mr-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回列表
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
              <h2 className="text-2xl font-bold text-gray-900">记忆分析结果</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {recordId?.substring(0, 8)}...</p>
            </div>
            <button
              onClick={handleReanalyze}
              className="btn btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner"></span>
                  重新分析中...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重新分析
                </>
              )}
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 内容区域 */}
          {record ? (
            <div className="space-y-6">
              <BasicInfo record={record} />
              <Phase2Result data={record.phase2_result} />
              <Phase1Results data={record.phase1_results} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>未找到对应的分析记录</p>
              <button 
                onClick={() => navigate('/memory-records')}
                className="mt-4 text-indigo-600 hover:text-indigo-800"
              >
                返回记录列表
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 回到顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-50"
          aria-label="回到顶部"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default ResultDetailPage