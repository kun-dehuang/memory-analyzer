import React, { useMemo } from 'react'
import { getNestedValue } from '../utils/helpers.js'

// 时空分析组件
const SpatioTemporal = ({ data }) => {
  if (!data) return null
  
  return (
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
          <div className="font-semibold text-gray-900">{getNestedValue(data, 'life_radius')}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-cyan-600 mb-1">生物时钟</div>
          <div className="font-semibold text-gray-900">{getNestedValue(data, 'biological_clock')}</div>
        </div>
      </div>
    </div>
  )
}

// 社交网络组件
const SocialGraph = ({ data }) => {
  if (!data) return null
  
  const coreCircle = getNestedValue(data, 'core_circle', [])
  const relationshipDynamics = getNestedValue(data, 'relationship_dynamics', [])
  
  return (
    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 mb-4">
      <h4 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        社交网络
      </h4>
      
      {Array.isArray(coreCircle) && coreCircle.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-semibold text-pink-800 mb-3">核心社交圈</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreCircle.map((person, index) => {
              if (typeof person !== 'object' || person === null) {
                return (
                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                    <span className="text-gray-900">{String(person)}</span>
                  </div>
                )
              }

              const name_id = getNestedValue(person, 'name_id')
              const relation = getNestedValue(person, 'relation')
              const frequency = getNestedValue(person, 'frequency')
              const status = getNestedValue(person, 'status', '')

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
      
      {Array.isArray(relationshipDynamics) && relationshipDynamics.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-pink-800 mb-2">关系动态</h5>
          <ul className="space-y-2">
            {relationshipDynamics.map((dynamic, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-200 text-pink-700 text-xs flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{String(dynamic)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// 行为趋势组件
const BehaviorTrends = ({ data }) => {
  if (!data) return null
  
  return (
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
          <div className="font-semibold text-gray-900">{getNestedValue(data, 'social_mask')}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-amber-600 mb-1">消费变化</div>
          <div className="font-semibold text-gray-900">{getNestedValue(data, 'consumption_shift')}</div>
        </div>
      </div>
    </div>
  )
}

// 心理分析组件
const Psychology = ({ data }) => {
  if (!data) return null
  
  return (
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
          <div className="font-semibold text-gray-900">{getNestedValue(data, 'personality_type')}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-purple-600 mb-1">情绪曲线</div>
          <div className="font-semibold text-gray-900">{getNestedValue(data, 'emotional_curve')}</div>
        </div>
      </div>
    </div>
  )
}

// 故事触发点组件
const Hooks = ({ data }) => {
  if (!data) return null
  
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-4">
      <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        故事触发点
      </h4>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <p className="text-gray-700 italic leading-relaxed">{getNestedValue(data, 'story_trigger')}</p>
      </div>
    </div>
  )
}

// JSON查看器组件
const JsonViewer = ({ data }) => {
  const formattedJson = useMemo(() => {
    if (!data) return '{}'
    return getNestedValue(data, 'raw_output', data)
  }, [data])
  
  return (
    <details className="mt-6 group">
      <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
        <svg className="w-5 h-5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        查看 JSON 格式原始输出
      </summary>
      <div className="mt-4 p-4 bg-gray-900 rounded-xl overflow-x-auto shadow-inner">
        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
          {formattedJson}
        </pre>
      </div>
    </details>
  )
}

// 主组件
const Phase2Result = ({ data }) => {
  if (!data) return null
  
  const meta = getNestedValue(data, 'meta')
  const timelineChapters = getNestedValue(meta, 'timeline_chapters', [])
  
  return (
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
      {meta && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 mb-4">
          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            分析摘要
          </h4>
          <p className="text-gray-700 leading-relaxed">{getNestedValue(meta, 'scan_summary')}</p>
          
          {Array.isArray(timelineChapters) && timelineChapters.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-indigo-800 mb-2">时间线章节</h5>
              <ul className="space-y-2">
                {timelineChapters.map((chapter, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{String(chapter)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <SpatioTemporal data={data?.L1_Spatio_Temporal} />
      <SocialGraph data={data?.L3_Social_Graph} />
      <BehaviorTrends data={data?.L4_Behavior_Trends} />
      <Psychology data={data?.L5_Psychology} />
      <Hooks data={data?.L6_Hooks} />

      <JsonViewer data={data} />
    </div>
  )
}

export default Phase2Result