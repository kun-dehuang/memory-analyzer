import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memoryAPI } from '../api/api'

function MemoryRecordsPage () {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

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

  const viewRecord = async (recordId) => {
    try {
      const record = await memoryAPI.getMemoryRecord(recordId)
      setSelectedRecord(record)
    } catch (err) {
      setError('加载记录详情失败')
      console.error('加载记录详情失败:', err)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { text: '等待中', color: 'bg-yellow-100 text-yellow-800' },
      'processing': { text: '分析中', color: 'bg-blue-100 text-blue-800' },
      'completed': { text: '已完成', color: 'bg-green-100 text-green-800' },
      'failed': { text: '失败', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图片数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间范围</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500">{record.id.substring(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.image_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.time_range ? `${record.time_range[0]} 至 ${record.time_range[1]}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'completed' && (
                        <button
                          onClick={() => viewRecord(record.id)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          查看结果
                        </button>
                      )}
                      {record.status === 'failed' && (
                        <span className="text-red-600 text-sm">
                          {record.error_message || '分析失败'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {records.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              暂无记录
            </div>
          )}

          {/* 结果详情弹窗 */}
          {selectedRecord && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">分析结果详情</h3>
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Phase 1 结果 */}
                  {selectedRecord.phase1_results && selectedRecord.phase1_results.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-blue-600">Phase 1 分析结果</h4>
                      <div className="space-y-4">
                        {selectedRecord.phase1_results.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium">{result.batch_id}</h5>
                              <span className="text-sm text-gray-500">
                                {result.image_count} 张照片
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              {result.analysis_summary}
                            </div>
                            {result.raw_vlm_output && (
                              <details className="mt-2">
                                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                  查看原始输出
                                </summary>
                                <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                  {result.raw_vlm_output}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phase 2 结果 */}
                  {selectedRecord.phase2_result && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-green-600">Phase 2 综合分析</h4>
                      <div className="space-y-4">
                        {/* 元信息 */}
                        {selectedRecord.phase2_result.meta && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">概览</h5>
                            <div className="text-sm text-gray-600">
                              {selectedRecord.phase2_result.meta.scan_summary}
                            </div>
                            {selectedRecord.phase2_result.meta.timeline_chapters && (
                              <div className="mt-2">
                                <span className="font-medium">时间线章节：</span>
                                <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                                  {selectedRecord.phase2_result.meta.timeline_chapters.map((chapter, index) => (
                                    <li key={index}>{chapter}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 空间时间 */}
                        {selectedRecord.phase2_result.L1_Spatio_Temporal && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">空间时间维度</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div><span className="font-medium">生活半径：</span>{selectedRecord.phase2_result.L1_Spatio_Temporal.life_radius}</div>
                              <div><span className="font-medium">生物钟：</span>{selectedRecord.phase2_result.L1_Spatio_Temporal.biological_clock}</div>
                            </div>
                          </div>
                        )}

                        {/* 社交图谱 */}
                        {selectedRecord.phase2_result.L3_Social_Graph && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">社交图谱</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">核心社交圈：</span>
                                {selectedRecord.phase2_result.L3_Social_Graph.core_circle.length > 0 ? (
                                  <ul className="list-disc list-inside mt-1">
                                    {selectedRecord.phase2_result.L3_Social_Graph.core_circle.map((person, index) => (
                                      <li key={index}>{person}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-gray-400">暂无数据</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 行为趋势 */}
                        {selectedRecord.phase2_result.L4_Behavior_Trends && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">行为趋势</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div><span className="font-medium">社交面具：</span>{selectedRecord.phase2_result.L4_Behavior_Trends.social_mask}</div>
                              <div><span className="font-medium">消费变化：</span>{selectedRecord.phase2_result.L4_Behavior_Trends.consumption_shift}</div>
                            </div>
                          </div>
                        )}

                        {/* 心理学 */}
                        {selectedRecord.phase2_result.L5_Psychology && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">心理学分析</h5>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div><span className="font-medium">人格类型：</span>{selectedRecord.phase2_result.L5_Psychology.personality_type}</div>
                              <div><span className="font-medium">情绪曲线：</span>{selectedRecord.phase2_result.L5_Psychology.emotional_curve}</div>
                            </div>
                          </div>
                        )}

                        {/* 故事钩子 */}
                        {selectedRecord.phase2_result.L6_Hooks && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">故事钩子</h5>
                            <div className="text-sm text-gray-600">
                              {selectedRecord.phase2_result.L6_Hooks.story_trigger}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedRecord.phase1_results && !selectedRecord.phase2_result && (
                    <div className="text-center py-8 text-gray-500">
                      暂无分析结果
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemoryRecordsPage