import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memoryAPI } from '../api/api'

function MemoryRecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRecords()
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Memory Analyzer</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded mr-4"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">记忆分析记录</h2>
            <button
              onClick={loadRecords}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">是否重复</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">是否截图</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{record.filename}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.datetime?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.is_duplicate ? '是' : '否'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.is_screenshot ? '是' : '否'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemoryRecordsPage
