import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memoryAPI } from '../api/api'

function ResultDetailPage () {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRecord = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await memoryAPI.getMemoryRecord(recordId)
      setRecord(response)
    } catch (err) {
      setError('加载记录失败')
      console.error('加载记录失败:', err)
    } finally {
      setLoading(false)
    }
  }, [recordId])

  useEffect(() => {
    loadRecord()
  }, [loadRecord])

  const handleReanalyze = async () => {
    setLoading(true)
    setError('')
    try {
      await memoryAPI.reanalyzeMemoryRecord(recordId)
      setError('重新分析任务已开始，请稍后刷新查看结果')
      // 延迟加载以获取最新状态
      setTimeout(loadRecord, 3000)
    } catch (err) {
      setError('重新分析失败')
      console.error('重新分析失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
    <div className="min-h-screen page-container">
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
                className="btn btn-secondary flex items-center gap-2"
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
              <p className="text-sm text-gray-500 mt-1">ID: {recordId.substring(0, 8)}...</p>
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {record ? (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">状态</div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      record.status === 'completed' ? 'bg-green-100 text-green-700' :
                      record.status === 'failed' ? 'bg-red-100 text-red-700' :
                      record.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        record.status === 'completed' ? 'bg-green-500' :
                        record.status === 'failed' ? 'bg-red-500' :
                        record.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                        'bg-yellow-500'
                      }`}></span>
                      {record.status === 'completed' ? '已完成' : record.status === 'failed' ? '失败' : record.status === 'processing' ? '处理中' : '待处理'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">照片数量</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{record.image_count || 0}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">创建时间</div>
                    <div className="text-sm font-medium text-gray-900">{new Date(record.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">完成时间</div>
                    <div className="text-sm font-medium text-gray-900">{record.completed_at ? new Date(record.completed_at).toLocaleString('zh-CN') : '未完成'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
                    <div className="text-sm text-gray-500 mb-1">时间范围</div>
                    <div className="text-sm font-medium text-gray-900">
                      {record.time_range ? (
                        <div>
                          <div>{record.time_range[0]}</div>
                          <div className="text-gray-500">至 {record.time_range[1]}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">未知</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2 结果 */}
              {record.phase2_result && (
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">人格分析结果</h3>
                      <p className="text-sm text-gray-500">AI 深度心理分析</p>
                    </div>
                  </div>

                  {/* 元信息 */}
                  {record.phase2_result.meta && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 mb-4">
                      <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        分析摘要
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{record.phase2_result.meta.scan_summary != null ? String(record.phase2_result.meta.scan_summary) : '未知'}</p>
                      {record.phase2_result.meta.timeline_chapters && Array.isArray(record.phase2_result.meta.timeline_chapters) && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-indigo-800 mb-2">时间线章节</h5>
                          <ul className="space-y-2">
                            {record.phase2_result.meta.timeline_chapters.map((chapter, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <span className="text-gray-700">{chapter != null ? String(chapter) : '未知'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 时空分析 */}
                  {record.phase2_result.L1_Spatio_Temporal && (
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-5 mb-4">
                      <h4 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        时空分析
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-cyan-600 mb-1">活动范围</div>
                          <div className="font-semibold text-gray-900">{record.phase2_result.L1_Spatio_Temporal.life_radius != null ? String(record.phase2_result.L1_Spatio_Temporal.life_radius) : '未知'}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-cyan-600 mb-1">生物时钟</div>
                          <div className="font-semibold text-gray-900">{record.phase2_result.L1_Spatio_Temporal.biological_clock != null ? String(record.phase2_result.L1_Spatio_Temporal.biological_clock) : '未知'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 社交网络 */}
                  {record.phase2_result.L3_Social_Graph && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 mb-4">
                      <h4 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        社交网络
                      </h4>
                      {record.phase2_result.L3_Social_Graph.core_circle && Array.isArray(record.phase2_result.L3_Social_Graph.core_circle) && record.phase2_result.L3_Social_Graph.core_circle.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-semibold text-pink-800 mb-3">核心社交圈</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {record.phase2_result.L3_Social_Graph.core_circle.map((person, index) => {
                              if (typeof person !== 'object' || person === null) {
                                return (
                                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                                    <span className="text-gray-900">{String(person)}</span>
                                  </div>
                                )
                              }

                              const name_id = person.name_id != null ? String(person.name_id) : '未知'
                              const relation = person.relation != null ? String(person.relation) : '未知'
                              const frequency = person.frequency != null ? String(person.frequency) : '未知'
                              const status = person.status != null ? String(person.status) : ''

                              return (
                                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                  <div className="font-semibold text-gray-900 mb-1">{name_id}</div>
                                  <div className="text-sm text-gray-600 mb-2">{relation}</div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">{frequency}</span>
                                    {status && <span className="text-xs text-gray-500">{status}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {record.phase2_result.L3_Social_Graph.relationship_dynamics && Array.isArray(record.phase2_result.L3_Social_Graph.relationship_dynamics) && record.phase2_result.L3_Social_Graph.relationship_dynamics.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-pink-800 mb-2">关系动态</h5>
                          <ul className="space-y-2">
                            {record.phase2_result.L3_Social_Graph.relationship_dynamics.map((dynamic, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-200 text-pink-700 text-xs flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <span>{dynamic != null ? String(dynamic) : '未知'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 行为趋势 */}
                  {record.phase2_result.L4_Behavior_Trends && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 mb-4">
                      <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        行为趋势
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-amber-600 mb-1">社交形象</div>
                          <div className="font-semibold text-gray-900">{record.phase2_result.L4_Behavior_Trends.social_mask != null ? String(record.phase2_result.L4_Behavior_Trends.social_mask) : '未知'}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-amber-600 mb-1">消费变化</div>
                          <div className="font-semibold text-gray-900">{record.phase2_result.L4_Behavior_Trends.consumption_shift != null ? String(record.phase2_result.L4_Behavior_Trends.consumption_shift) : '未知'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 心理分析 */}
                  {record.phase2_result.L5_Psychology && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 mb-4">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        心理分析
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-purple-600 mb-1">人格类型</div>
                          <div className="font-semibold text-gray-900">{record.phase2_result.L5_Psychology.personality_type != null ? String(record.phase2_result.L5_Psychology.personality_type) : '未知'}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-purple-600 mb-1">情绪曲线</div>
                          <div className="font-semibold text-gray-900">{record.phase2_result.L5_Psychology.emotional_curve != null ? String(record.phase2_result.L5_Psychology.emotional_curve) : '未知'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 故事触发点 */}
                  {record.phase2_result.L6_Hooks && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-4">
                      <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        故事触发点
                      </h4>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-gray-700 italic leading-relaxed">{record.phase2_result.L6_Hooks.story_trigger != null ? String(record.phase2_result.L6_Hooks.story_trigger) : '未知'}</p>
                      </div>
                    </div>
                  )}

                  {/* JSON 格式原始输出 */}
                  <details className="mt-6 group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                      <svg className="w-5 h-5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      查看 JSON 格式原始输出
                    </summary>
                    <div className="mt-4 p-4 bg-gray-900 rounded-xl overflow-x-auto shadow-inner">
                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                        {(() => {
                          if (record.phase2_result.raw_output) {
                            const rawOutput = record.phase2_result.raw_output
                            const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/)
                            if (jsonMatch) {
                              try {
                                const jsonContent = jsonMatch[1]
                                const parsedJson = JSON.parse(jsonContent)
                                return JSON.stringify(parsedJson, null, 2)
                              } catch (e) {
                                return JSON.stringify(record.phase2_result, null, 2)
                              }
                            }
                          }
                          return JSON.stringify(record.phase2_result, null, 2)
                        })()}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              {/* Phase 1 结果 */}
              {record.phase1_results && record.phase1_results.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-medium mb-3">详细分析记录</h3>
                  <div className="space-y-6">
                    {record.phase1_results.map((phase1, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-blue-600">{phase1.batch_id}</h4>
                          <div className="text-sm text-gray-600">
                            <span>{phase1.image_count} 张照片</span>
                            <span className="mx-2">•</span>
                            <span>{phase1.processed_at}</span>
                          </div>
                        </div>

                        {/* 分析摘要 */}
                        {phase1.analysis_summary && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">分析摘要</h5>
                            <p className="text-sm text-gray-600">{phase1.analysis_summary}</p>
                          </div>
                        )}

                        {/* 原始输出 - 美化展示 */}
                        {phase1.raw_vlm_output && (
                          <details className="mt-4">
                            <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                              查看详细分析结果
                            </summary>
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                              {/* 尝试解析并美化原始输出 */}
                              {(() => {
                                const rawOutput = phase1.raw_vlm_output

                                // 检查是否包含主角识别部分
                                if (rawOutput.includes('0. 主角识别') || rawOutput.includes('主角识别')) {
                                  // 按段落分割
                                  const paragraphs = rawOutput.split('\n\n').filter(p => p.trim())

                                  return paragraphs.map((paragraph, paraIndex) => {
                                    // 检查是否是标题
                                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                                      return (
                                        <div key={paraIndex} className="mb-4">
                                          <h6 className="text-md font-bold mb-2">{paragraph.replace(/\*/g, '')}</h6>
                                        </div>
                                      )
                                    }

                                    // 检查是否是列表项
                                    if (paragraph.startsWith('*   **')) {
                                      const lines = paragraph.split('\n')
                                      return (
                                        <div key={paraIndex} className="mb-3">
                                          {lines.map((line, lineIndex) => {
                                            if (line.startsWith('*   **')) {
                                              const parts = line.split(': ')
                                              const title = parts[0].replace(/\*|\s/g, '')
                                              const content = parts.slice(1).join(': ')
                                              return (
                                                <div key={lineIndex} className="mb-2">
                                                  <strong className="text-gray-700">{title}:</strong> {content}
                                                </div>
                                              )
                                            }
                                            if (line.startsWith('    *   **')) {
                                              const parts = line.split(': ')
                                              const title = parts[0].replace(/\*|\s/g, '')
                                              const content = parts.slice(1).join(': ')
                                              return (
                                                <div key={lineIndex} className="ml-6 mb-1">
                                                  <strong className="text-gray-700">{title}:</strong> {content}
                                                </div>
                                              )
                                            }
                                            if (line.startsWith('    *   ')) {
                                              return (
                                                <div key={lineIndex} className="ml-6 mb-1">
                                                  {line.replace('    *   ', '')}
                                                </div>
                                              )
                                            }
                                            return (
                                              <div key={lineIndex} className="ml-4">
                                                {line}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )
                                    }

                                    // 检查是否是照片描述标题
                                    if (paragraph.match(/^\*\*\d+\. [^*]+\*\*$/)) {
                                      return (
                                        <div key={paraIndex} className="mb-4">
                                          <h6 className="text-md font-bold mb-2">{paragraph.replace(/\*/g, '')}</h6>
                                        </div>
                                      )
                                    }

                                    // 检查是否是照片描述内容
                                    if (paragraph.includes('**场景与环境**') || paragraph.includes('**人物与互动**')) {
                                      const lines = paragraph.split('\n')
                                      return (
                                        <div key={paraIndex} className="mb-4 ml-4">
                                          {lines.map((line, lineIndex) => {
                                            if (line.startsWith('*   **')) {
                                              const parts = line.split(': ')
                                              const title = parts[0].replace(/\*|\s/g, '')
                                              const content = parts.slice(1).join(': ')
                                              return (
                                                <div key={lineIndex} className="mb-2">
                                                  <strong className="text-gray-700">{title}:</strong> {content}
                                                </div>
                                              )
                                            }
                                            return (
                                              <div key={lineIndex} className="ml-4">
                                                {line}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )
                                    }

                                    // 默认展示
                                    return (
                                      <div key={paraIndex} className="mb-3">
                                        {paragraph}
                                      </div>
                                    )
                                  })
                                } else {
                                  // 如果不是预期格式，就按原样展示，但确保有适当的分行
                                  return (
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {rawOutput.split('\n').map((line, lineIndex) => (
                                        <div key={lineIndex}>{line}</div>
                                      ))}
                                    </div>
                                  )
                                }
                              })()}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              未找到记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultDetailPage
