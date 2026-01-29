import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memoryAPI } from '../api/api'

function ResultDetailPage() {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRecord()
  }, [recordId])

  const loadRecord = async () => {
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
  }

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
                      <p>{record.phase2_result.meta.scan_summary}</p>
                      {record.phase2_result.meta.timeline_chapters && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">时间线章节</h5>
                          <ul className="list-disc pl-5">
                            {record.phase2_result.meta.timeline_chapters.map((chapter, index) => (
                              <li key={index}>{chapter}</li>
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
                      <p><span className="text-gray-600">活动范围:</span> {record.phase2_result.L1_Spatio_Temporal.life_radius}</p>
                      <p><span className="text-gray-600">生物时钟:</span> {record.phase2_result.L1_Spatio_Temporal.biological_clock}</p>
                    </div>
                  )}

                  {/* 社交网络 */}
                  {record.phase2_result.L3_Social_Graph && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">社交网络</h4>
                      {record.phase2_result.L3_Social_Graph.core_circle && record.phase2_result.L3_Social_Graph.core_circle.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">核心社交圈</h5>
                          <ul className="list-disc pl-5">
                            {record.phase2_result.L3_Social_Graph.core_circle.map((person, index) => (
                              <li key={index}>
                                {person.name_id}: {person.relation} ({person.frequency})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {record.phase2_result.L3_Social_Graph.relationship_dynamics && record.phase2_result.L3_Social_Graph.relationship_dynamics.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">关系动态</h5>
                          <ul className="list-disc pl-5">
                            {record.phase2_result.L3_Social_Graph.relationship_dynamics.map((dynamic, index) => (
                              <li key={index}>{dynamic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 行为趋势 */}
                  {record.phase2_result.L4_Behavior_Trends && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">行为趋势</h4>
                      <p><span className="text-gray-600">社交形象:</span> {record.phase2_result.L4_Behavior_Trends.social_mask}</p>
                      <p><span className="text-gray-600">消费变化:</span> {record.phase2_result.L4_Behavior_Trends.consumption_shift}</p>
                    </div>
                  )}

                  {/* 心理分析 */}
                  {record.phase2_result.L5_Psychology && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">心理分析</h4>
                      <p><span className="text-gray-600">人格类型:</span> {record.phase2_result.L5_Psychology.personality_type}</p>
                      <p><span className="text-gray-600">情绪曲线:</span> {record.phase2_result.L5_Psychology.emotional_curve}</p>
                    </div>
                  )}

                  {/* 故事触发点 */}
                  {record.phase2_result.L6_Hooks && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">故事触发点</h4>
                      <p className="italic">{record.phase2_result.L6_Hooks.story_trigger}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Phase 1 结果 */}
              {record.phase1_results && record.phase1_results.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-medium mb-3">详细分析记录</h3>
                  <div className="space-y-4">
                    {record.phase1_results.map((phase1, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium">{phase1.batch_id}</h4>
                        <p className="text-sm text-gray-600">{phase1.processed_at}</p>
                        <p className="text-sm text-gray-600">{phase1.image_count} 张照片</p>
                        <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                          <pre>{phase1.raw_vlm_output.substring(0, 300)}...</pre>
                        </div>
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
