import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PromptManagementPage from './pages/PromptManagementPage'
import MemoryRecordsPage from './pages/MemoryRecordsPage'
import ResultDetailPage from './pages/ResultDetailPage'

function URLHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // 处理GitHub Pages的URL参数
    const params = new URLSearchParams(location.search)
    const path = params.get('p')
    if (path) {
      // 将路径参数转换为路由
      navigate(path, { replace: true })
    }
  }, [location, navigate])

  return null
}

function App () {
  return (
    <Provider store={store}>
      <Router basename="/memory-analyzer">
        <URLHandler />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/prompts" element={<PromptManagementPage />} />
          <Route path="/memory-records" element={<MemoryRecordsPage />} />
          <Route path="/result/:recordId" element={<ResultDetailPage />} />
          {/* 捕获所有未匹配的路由，重定向到登录页 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
