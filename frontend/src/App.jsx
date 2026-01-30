import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PromptManagementPage from './pages/PromptManagementPage'
import MemoryRecordsPage from './pages/MemoryRecordsPage'
import ResultDetailPage from './pages/ResultDetailPage'

function App () {
  return (
    <Provider store={store}>
      <Router basename="/memory-analyzer">
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
