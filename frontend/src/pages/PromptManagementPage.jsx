import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promptAPI } from '../api/api'

function PromptManagementPage() {
  const navigate = useNavigate()
  const [promptGroups, setPromptGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', description: '' })

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
      setError('加载提示词组失败')
    }
  }

  const handleAddGroup = async () => {
    setLoading(true)
    setError('')

    try {
      await promptAPI.createPromptGroup(newGroup)
      setShowAddGroupModal(false)
      setNewGroup({ name: '', description: '' })
      loadPromptGroups()
    } catch (err) {
      setError('创建提示词组失败')
      console.error('创建提示词组失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('确定要删除这个提示词组吗？')) {
      return
    }

    try {
      await promptAPI.deletePromptGroup(groupId)
      loadPromptGroups()
      if (selectedGroup && selectedGroup.id === groupId) {
        setSelectedGroup(null)
      }
    } catch (err) {
      setError('删除提示词组失败')
      console.error('删除提示词组失败:', err)
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
        <div className="flex space-x-6">
          {/* 左侧提示词组列表 */}
          <div className="w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">提示词组</h2>
                <button
                  onClick={() => setShowAddGroupModal(true)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  新增
                </button>
              </div>

              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {promptGroups.map(group => (
                  <div
                    key={group.id}
                    className={`p-3 rounded cursor-pointer ${selectedGroup?.id === group.id ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{group.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{group.description || '无描述'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧提示词详情 */}
          <div className="w-2/3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedGroup ? (
                <>
                  <h2 className="text-xl font-bold mb-4">{selectedGroup.name}</h2>
                  <p className="text-gray-600 mb-6">{selectedGroup.description || '无描述'}</p>

                  <h3 className="text-lg font-medium mb-3">提示词</h3>
                  <div className="space-y-4">
                    {selectedGroup.prompts.map(prompt => (
                      <div key={prompt.id} className="border rounded p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{prompt.name}</span>
                          <span className="text-sm bg-gray-200 px-2 py-1 rounded">{prompt.type}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{prompt.description || '无描述'}</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <pre>{prompt.content.substring(0, 200)}...</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  请选择一个提示词组
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 添加提示词组模态框 */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">新增提示词组</h3>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">名称</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">描述</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddGroupModal(false)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                取消
              </button>
              <button
                onClick={handleAddGroup}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptManagementPage
