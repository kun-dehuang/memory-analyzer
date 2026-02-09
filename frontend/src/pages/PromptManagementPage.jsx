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
    <div className="min-h-screen page-container">
      {/* 导航栏 */}
      <nav className="navbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Memory Analyzer</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧提示词组列表 */}
          <div className="w-full lg:w-1/3">
            <div className="card-elevated p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  提示词组
                </h2>
                <button
                  onClick={() => setShowAddGroupModal(true)}
                  className="btn btn-primary text-sm px-3 py-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新增
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {promptGroups.map(group => (
                  <div
                    key={group.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedGroup?.id === group.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-semibold ${selectedGroup?.id === group.id ? 'text-white' : 'text-gray-900'}`}>{group.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditGroup(group)
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            selectedGroup?.id === group.id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-blue-100 text-blue-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGroup(group.id)
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            selectedGroup?.id === group.id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm truncate ${selectedGroup?.id === group.id ? 'text-white/80' : 'text-gray-500'}`}>{group.description || '无描述'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧提示词详情 */}
          <div className="w-full lg:w-2/3">
            <div className="card-elevated p-6">
              {selectedGroup ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
                      <p className="text-sm text-gray-500">{selectedGroup.description || '无描述'}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    提示词列表
                  </h3>
                  <div className="space-y-4">
                    {selectedGroup.prompts.map(prompt => (
                      <div key={prompt.id} className="card p-4 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              prompt.type === 'phase1'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {prompt.type === 'phase1' ? 'Phase 1' : 'Phase 2'}
                            </div>
                            <span className="font-semibold text-gray-900">{prompt.name}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg p-3">{prompt.description || '无描述'}</p>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{prompt.content.substring(0, 200)}...</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">请选择一个提示词组</p>
                  <p className="text-sm mt-1">点击左侧列表查看详情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 添加提示词组模态框 */}
      {showAddGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-4xl mx-4">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">新增提示词组</h3>
                <p className="text-sm text-gray-500">创建新的 AI 分析模板</p>
              </div>
              <button
                onClick={() => setShowAddGroupModal(false)}
                className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">

              {/* Phase 1 提示词 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">1</span>
                    Phase 1 提示词
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPrompts = [...newGroup.prompts]
                      updatedPrompts[0].content = defaultPrompts.phase1
                      updatedPrompts[0].description = '记忆分析第一阶段提示词'
                      setNewGroup({ ...newGroup, prompts: updatedPrompts })
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    使用默认样例
                  </button>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">内容</label>
                    <textarea
                      value={newGroup.prompts[0].content}
                      onChange={(e) => {
                        const updatedPrompts = [...newGroup.prompts]
                        updatedPrompts[0].content = e.target.value
                        setNewGroup({ ...newGroup, prompts: updatedPrompts })
                      }}
                      className="input"
                      rows={6}
                      placeholder="请输入第一阶段提示词"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
                    <input
                      type="text"
                      value={newGroup.prompts[0].description}
                      onChange={(e) => {
                        const updatedPrompts = [...newGroup.prompts]
                        updatedPrompts[0].description = e.target.value
                        setNewGroup({ ...newGroup, prompts: updatedPrompts })
                      }}
                      className="input"
                      placeholder="请输入描述"
                    />
                  </div>
                </div>
              </div>

              {/* Phase 2 提示词 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 font-bold text-sm">2</span>
                    Phase 2 提示词
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPrompts = [...newGroup.prompts]
                      updatedPrompts[1].content = defaultPrompts.phase2
                      updatedPrompts[1].description = '记忆分析第二阶段提示词'
                      setNewGroup({ ...newGroup, prompts: updatedPrompts })
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    使用默认样例
                  </button>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">内容</label>
                    <textarea
                      value={newGroup.prompts[1].content}
                      onChange={(e) => {
                        const updatedPrompts = [...newGroup.prompts]
                        updatedPrompts[1].content = e.target.value
                        setNewGroup({ ...newGroup, prompts: updatedPrompts })
                      }}
                      className="input"
                      rows={6}
                      placeholder="请输入第二阶段提示词"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
                    <input
                      type="text"
                      value={newGroup.prompts[1].description}
                      onChange={(e) => {
                        const updatedPrompts = [...newGroup.prompts]
                        updatedPrompts[1].description = e.target.value
                        setNewGroup({ ...newGroup, prompts: updatedPrompts })
                      }}
                      className="input"
                      placeholder="请输入描述"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddGroupModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleAddGroup}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner"></span>
                      创建中...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      创建
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑提示词组模态框 */}
      {showEditGroupModal && editGroup && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-4xl mx-4">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">编辑提示词组</h3>
                <p className="text-sm text-gray-500">修改 AI 分析模板</p>
              </div>
              <button
                onClick={() => {
                  setShowEditGroupModal(false)
                  setEditGroup(null)
                }}
                className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">

              {/* 提示词列表 */}
              {editGroup.prompts.map((prompt, index) => (
                <div key={prompt.id} className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                        prompt.type === 'phase1'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {index + 1}
                      </span>
                      {prompt.name}
                    </label>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      prompt.type === 'phase1'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {prompt.type === 'phase1' ? 'Phase 1' : 'Phase 2'}
                    </span>
                  </div>
                  <div className={`rounded-xl p-5 border ${
                    prompt.type === 'phase1'
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                      : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100'
                  }`}>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">内容</label>
                      <textarea
                        value={prompt.content}
                        onChange={(e) => {
                          const updatedPrompts = [...editGroup.prompts]
                          updatedPrompts[index].content = e.target.value
                          setEditGroup({ ...editGroup, prompts: updatedPrompts })
                        }}
                        className="input"
                        rows={6}
                        placeholder={`请输入${prompt.name}提示词`}
                        required
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
                      <input
                        type="text"
                        value={prompt.description}
                        onChange={(e) => {
                          const updatedPrompts = [...editGroup.prompts]
                          updatedPrompts[index].description = e.target.value
                          setEditGroup({ ...editGroup, prompts: updatedPrompts })
                        }}
                        className="input"
                        placeholder="请输入描述"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowEditGroupModal(false)
                    setEditGroup(null)
                  }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateGroup}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner"></span>
                      更新中...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      更新
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptManagementPage
