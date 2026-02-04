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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">加载中...</h2>
          </div>
        </div>
      </div>
    )
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
                onClick={() => navigate('/memory-records')}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded mr-4"
              >
                返回列表
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">记忆分析结果</h2>
            <button
              onClick={handleReanalyze}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? '重新分析中...' : '重新分析'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {record ? (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="border rounded p-4">
                <h3 className="text-lg font-medium mb-3">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">状态:</span>
                    <span className={`ml-2 ${record.status === 'completed' ? 'text-green-600' : record.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {record.status === 'completed' ? '已完成' : record.status === 'failed' ? '失败' : record.status === 'processing' ? '处理中' : '待处理'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">照片数量:</span>
                    <span className="ml-2">{record.image_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">创建时间:</span>
                    <span className="ml-2">{new Date(record.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">完成时间:</span>
                    <span className="ml-2">{record.completed_at ? new Date(record.completed_at).toLocaleString() : '未完成'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">时间范围:</span>
                    <span className="ml-2">{record.time_range ? `${record.time_range[0]} 至 ${record.time_range[1]}` : '未知'}</span>
                  </div>
                </div>
              </div>

              {/* Phase 2 结果 */}
              {record.phase2_result && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-medium mb-3">人格分析结果</h3>

                  {/* 元信息 */}
                  {record.phase2_result.meta && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">分析摘要</h4>
                      <p>{record.phase2_result.meta.scan_summary != null ? String(record.phase2_result.meta.scan_summary) : '未知'}</p>
                      {record.phase2_result.meta.timeline_chapters && Array.isArray(record.phase2_result.meta.timeline_chapters) && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">时间线章节</h5>
                          <ul className="list-disc pl-5">
                            {record.phase2_result.meta.timeline_chapters.map((chapter, index) => (
                              <li key={index}>{chapter != null ? String(chapter) : '未知'}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 时空分析 */}
                  {record.phase2_result.L1_Spatio_Temporal && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">时空分析</h4>
                      <p><span className="text-gray-600">活动范围:</span> {record.phase2_result.L1_Spatio_Temporal.life_radius != null ? String(record.phase2_result.L1_Spatio_Temporal.life_radius) : '未知'}</p>
                      <p><span className="text-gray-600">生物时钟:</span> {record.phase2_result.L1_Spatio_Temporal.biological_clock != null ? String(record.phase2_result.L1_Spatio_Temporal.biological_clock) : '未知'}</p>
                    </div>
                  )}

                  {/* 社交网络 */}
                  {record.phase2_result.L3_Social_Graph && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">社交网络</h4>
                      {record.phase2_result.L3_Social_Graph.core_circle && Array.isArray(record.phase2_result.L3_Social_Graph.core_circle) && record.phase2_result.L3_Social_Graph.core_circle.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">核心社交圈</h5>
                          <ul className="list-disc pl-5">
                            {record.phase2_result.L3_Social_Graph.core_circle.map((person, index) => {
                              // 确保person是一个对象
                              if (typeof person !== 'object' || person === null) {
                                return <li key={index}>{String(person)}</li>
                              }

                              // 安全地获取所有属性
                              const name_id = person.name_id != null ? String(person.name_id) : '未知'
                              const relation = person.relation != null ? String(person.relation) : '未知'
                              const frequency = person.frequency != null ? String(person.frequency) : '未知'
                              const status = person.status != null ? String(person.status) : ''

                              return (
                                <li key={index}>
                                  {name_id}: {relation} ({frequency})
                                  {status && <span className="ml-2 text-gray-500">状态: {status}</span>}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                      {record.phase2_result.L3_Social_Graph.relationship_dynamics && Array.isArray(record.phase2_result.L3_Social_Graph.relationship_dynamics) && record.phase2_result.L3_Social_Graph.relationship_dynamics.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">关系动态</h5>
                          <ul className="list-disc pl-5">
                            {record.phase2_result.L3_Social_Graph.relationship_dynamics.map((dynamic, index) => {
                              // 安全地渲染动态
                              return <li key={index}>{dynamic != null ? String(dynamic) : '未知'}</li>
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 行为趋势 */}
                  {record.phase2_result.L4_Behavior_Trends && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">行为趋势</h4>
                      <p><span className="text-gray-600">社交形象:</span> {record.phase2_result.L4_Behavior_Trends.social_mask != null ? String(record.phase2_result.L4_Behavior_Trends.social_mask) : '未知'}</p>
                      <p><span className="text-gray-600">消费变化:</span> {record.phase2_result.L4_Behavior_Trends.consumption_shift != null ? String(record.phase2_result.L4_Behavior_Trends.consumption_shift) : '未知'}</p>
                    </div>
                  )}

                  {/* 心理分析 */}
                  {record.phase2_result.L5_Psychology && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">心理分析</h4>
                      <p><span className="text-gray-600">人格类型:</span> {record.phase2_result.L5_Psychology.personality_type != null ? String(record.phase2_result.L5_Psychology.personality_type) : '未知'}</p>
                      <p><span className="text-gray-600">情绪曲线:</span> {record.phase2_result.L5_Psychology.emotional_curve != null ? String(record.phase2_result.L5_Psychology.emotional_curve) : '未知'}</p>
                    </div>
                  )}

                  {/* 故事触发点 */}
                  {record.phase2_result.L6_Hooks && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">故事触发点</h4>
                      <p className="italic">{record.phase2_result.L6_Hooks.story_trigger != null ? String(record.phase2_result.L6_Hooks.story_trigger) : '未知'}</p>
                    </div>
                  )}

                  {/* JSON 格式原始输出 */}
                  <details className="mt-6">
                    <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                      查看 JSON 格式原始输出
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {(() => {
                          // 检查是否有原始输出并且包含 JSON 代码块
                          if (record.phase2_result.raw_output) {
                            const rawOutput = record.phase2_result.raw_output
                            // 尝试提取 JSON 代码块
                            const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/)
                            if (jsonMatch) {
                              try {
                                const jsonContent = jsonMatch[1]
                                const parsedJson = JSON.parse(jsonContent)
                                return JSON.stringify(parsedJson, null, 2)
                              } catch (e) {
                                // JSON 解析失败，使用原始结果
                                return JSON.stringify(record.phase2_result, null, 2)
                              }
                            }
                          }
                          // 默认使用整个 phase2_result 对象
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
