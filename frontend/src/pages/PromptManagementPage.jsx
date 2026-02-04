import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promptAPI } from '../api/api'

function PromptManagementPage () {
  const navigate = useNavigate()
  const [promptGroups, setPromptGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [editGroup, setEditGroup] = useState(null)

  const defaultPrompts = {
    phase1: `你是一位专业的视觉人类学家。请详细描述这批照片中的所有视觉要素，包括：
1. 人物：描述每个人的外貌特征、表情、姿态、穿着打扮
2. 场景：描述拍摄地点的环境特征、建筑风格、自然景观
3. 活动：描述照片中人物正在进行的动作或活动
4. 物品：描述照片中出现的物品、工具、装饰品等
5. 氛围：描述照片的整体氛围、光线、色调等

请以客观、细致的方式描述每一张照片，为后续的记忆分析提供丰富的视觉信息。`,

    phase2: `你是一位数字人类学家和心理学专家。现在需要你基于用户的完整相册记录，进行深度的记忆分析和人格画像构建。

请从以下维度进行分析：
1. 生活轨迹：分析用户的生活轨迹、活动范围、社交圈子
2. 兴趣爱好：识别用户的兴趣爱好、关注焦点、生活方式
3. 人格特质：通过照片中的行为表现、社交模式、环境选择等，分析用户的人格特质
4. 情感状态：分析用户的情感状态、情绪变化、心理需求
5. 成长历程：通过时间序列的照片，分析用户的成长历程和人生阶段

请以温暖、理解、尊重的语气，为用户呈现一份深度的记忆分析报告，帮助用户更好地理解自己。`
  }

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    prompts: [
      {
        name: 'Phase 1',
        content: defaultPrompts.phase1,
        type: 'phase1',
        description: '记忆分析第一阶段提示词',
        variables: []
      },
      {
        name: 'Phase 2',
        content: defaultPrompts.phase2,
        type: 'phase2',
        description: '记忆分析第二阶段提示词',
        variables: []
      }
    ]
  })

  console.log('初始newGroup状态:', newGroup)

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
      console.log('提交的提示词组数据:', newGroup)
      console.log('提交的提示词数量:', newGroup.prompts.length)
      console.log('Phase 1 提示词:', newGroup.prompts[0])
      console.log('Phase 2 提示词:', newGroup.prompts[1])
      await promptAPI.createPromptGroup(newGroup)
      setShowAddGroupModal(false)
      setNewGroup({
        name: '',
        description: '',
        prompts: [
          {
            name: 'Phase 1',
            content: defaultPrompts.phase1,
            type: 'phase1',
            description: '记忆分析第一阶段提示词',
            variables: []
          },
          {
            name: 'Phase 2',
            content: defaultPrompts.phase2,
            type: 'phase2',
            description: '记忆分析第二阶段提示词',
            variables: []
          }
        ]
      })
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

  const handleEditGroup = (group) => {
    console.log('编辑提示词组:', group)
    setEditGroup({
      id: group.id,
      name: group.name,
      description: group.description,
      prompts: group.prompts.map(prompt => ({
        id: prompt.id,
        name: prompt.name,
        content: prompt.content,
        type: prompt.type,
        description: prompt.description,
        variables: prompt.variables || []
      }))
    })
    setShowEditGroupModal(true)
  }

  const handleUpdateGroup = async () => {
    if (!editGroup) return

    setLoading(true)
    setError('')

    try {
      console.log('更新提示词组数据:', editGroup)
      await promptAPI.updatePromptGroup(editGroup.id, editGroup)
      setShowEditGroupModal(false)
      setEditGroup(null)
      loadPromptGroups()
    } catch (err) {
      setError('更新提示词组失败')
      console.error('更新提示词组失败:', err)
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
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditGroup(group)
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          编辑
                        </button>
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
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

            {/* Phase 1 提示词 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700">Phase 1 提示词</label>
                <button
                  type="button"
                  onClick={() => {
                    const updatedPrompts = [...newGroup.prompts]
                    updatedPrompts[0].content = defaultPrompts.phase1
                    updatedPrompts[0].description = '记忆分析第一阶段提示词'
                    setNewGroup({ ...newGroup, prompts: updatedPrompts })
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  使用默认样例
                </button>
              </div>
              <div className="border rounded p-4">
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">内容</label>
                  <textarea
                    value={newGroup.prompts[0].content}
                    onChange={(e) => {
                      const updatedPrompts = [...newGroup.prompts]
                      updatedPrompts[0].content = e.target.value
                      setNewGroup({ ...newGroup, prompts: updatedPrompts })
                    }}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="请输入第一阶段提示词"
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">描述</label>
                  <input
                    type="text"
                    value={newGroup.prompts[0].description}
                    onChange={(e) => {
                      const updatedPrompts = [...newGroup.prompts]
                      updatedPrompts[0].description = e.target.value
                      setNewGroup({ ...newGroup, prompts: updatedPrompts })
                    }}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入描述"
                  />
                </div>
              </div>
            </div>

            {/* Phase 2 提示词 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700">Phase 2 提示词</label>
                <button
                  type="button"
                  onClick={() => {
                    const updatedPrompts = [...newGroup.prompts]
                    updatedPrompts[1].content = defaultPrompts.phase2
                    updatedPrompts[1].description = '记忆分析第二阶段提示词'
                    setNewGroup({ ...newGroup, prompts: updatedPrompts })
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  使用默认样例
                </button>
              </div>
              <div className="border rounded p-4">
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">内容</label>
                  <textarea
                    value={newGroup.prompts[1].content}
                    onChange={(e) => {
                      const updatedPrompts = [...newGroup.prompts]
                      updatedPrompts[1].content = e.target.value
                      setNewGroup({ ...newGroup, prompts: updatedPrompts })
                    }}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="请输入第二阶段提示词"
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">描述</label>
                  <input
                    type="text"
                    value={newGroup.prompts[1].description}
                    onChange={(e) => {
                      const updatedPrompts = [...newGroup.prompts]
                      updatedPrompts[1].description = e.target.value
                      setNewGroup({ ...newGroup, prompts: updatedPrompts })
                    }}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入描述"
                  />
                </div>
              </div>
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

      {/* 编辑提示词组模态框 */}
      {showEditGroupModal && editGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">编辑提示词组</h3>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">名称</label>
              <input
                type="text"
                value={editGroup.name}
                onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">描述</label>
              <textarea
                value={editGroup.description}
                onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div>

            {/* 提示词列表 */}
            {editGroup.prompts.map((prompt, index) => (
              <div key={prompt.id} className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700">{prompt.name}</label>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded">{prompt.type}</span>
                </div>
                <div className="border rounded p-4">
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">内容</label>
                    <textarea
                      value={prompt.content}
                      onChange={(e) => {
                        const updatedPrompts = [...editGroup.prompts]
                        updatedPrompts[index].content = e.target.value
                        setEditGroup({ ...editGroup, prompts: updatedPrompts })
                      }}
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      placeholder={`请输入${prompt.name}提示词`}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">描述</label>
                    <input
                      type="text"
                      value={prompt.description}
                      onChange={(e) => {
                        const updatedPrompts = [...editGroup.prompts]
                        updatedPrompts[index].description = e.target.value
                        setEditGroup({ ...editGroup, prompts: updatedPrompts })
                      }}
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入描述"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowEditGroupModal(false)
                  setEditGroup(null)
                }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                取消
              </button>
              <button
                onClick={handleUpdateGroup}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptManagementPage
