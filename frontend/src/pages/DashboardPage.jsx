import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store'
import { memoryAPI, promptAPI } from '../api/api'

function DashboardPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.user)
  const [promptGroups, setPromptGroups] = useState([])
  const [selectedPromptGroup, setSelectedPromptGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 加载提示词组
  useEffect(() => {
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

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
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
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Memory Analyzer</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4">欢迎，{user?.nickname}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">生成记忆分析</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">选择提示词组</label>
            <select
              value={selectedPromptGroup?.id || ''}
              onChange={(e) => {
                const group = promptGroups.find(g => g.id === e.target.value)
                setSelectedPromptGroup(group)
              }}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              {promptGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleGenerateMemory}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading || !selectedPromptGroup}
            >
              {loading ? '生成中...' : '生成记忆分析'}
            </button>
            <button
              onClick={() => navigate('/prompts')}
              className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded"
            >
              管理提示词
            </button>
            <button
              onClick={() => navigate('/memory-records')}
              className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded"
            >
              查看历史记录
            </button>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">提示词组</h3>
            <p className="text-3xl font-bold text-blue-600">{promptGroups.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">历史记录</h3>
            <p className="text-3xl font-bold text-blue-600">0</p> {/* 这里需要从API获取 */}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">分析照片</h3>
            <p className="text-3xl font-bold text-blue-600">0</p> {/* 这里需要从API获取 */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
