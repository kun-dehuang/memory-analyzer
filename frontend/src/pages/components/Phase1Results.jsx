import React from 'react'
import { formatDate } from '../utils/helpers.js'

// 单个Phase1记录组件
const Phase1Item = ({ item, index }) => {
  if (!item) return null
  
  // 格式化原始输出
  const formatRawOutput = (rawOutput) => {
    if (!rawOutput) return null
    
    // 检查是否包含主角识别部分
    if (rawOutput.includes('0. 主角识别') || rawOutput.includes('主角识别')) {
      // 按段落分割
      const paragraphs = rawOutput.split('\n\n').filter(p => p.trim())

      return paragraphs.map((paragraph, paraIndex) => {
        // 标题处理
        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return (
            <div key={paraIndex} className="mb-4">
              <h6 className="text-md font-bold mb-2">{paragraph.replace(/\*/g, '')}</h6>
            </div>
          )
        }

        // 列表项处理
        if (paragraph.startsWith('*   **')) {
          const lines = paragraph.split('\n')
          return (
            <div key={paraIndex} className="mb-3">
              {lines.map((line, lineIndex) => {
                if (line.startsWith('*   **')) {
                  const parts = line.split(': ')
                  const title = parts[0]?.replace(/\*|\s/g, '') || ''
                  const content = parts.slice(1).join(': ') || ''
                  return (
                    <div key={lineIndex} className="mb-2">
                      <strong className="text-gray-700">{title}:</strong> {content}
                    </div>
                  )
                }
                if (line.startsWith('    *   **')) {
                  const parts = line.split(': ')
                  const title = parts[0]?.replace(/\*|\s/g, '') || ''
                  const content = parts.slice(1).join(': ') || ''
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

        // 照片描述标题
        if (paragraph.match(/^\*\*\d+\. [^*]+\*\*$/)) {
          return (
            <div key={paraIndex} className="mb-4">
              <h6 className="text-md font-bold mb-2">{paragraph.replace(/\*/g, '')}</h6>
            </div>
          )
        }

        // 照片描述内容
        if (paragraph.includes('**场景与环境**') || paragraph.includes('**人物与互动**')) {
          const lines = paragraph.split('\n')
          return (
            <div key={paraIndex} className="mb-4 ml-4">
              {lines.map((line, lineIndex) => {
                if (line.startsWith('*   **')) {
                  const parts = line.split(': ')
                  const title = parts[0]?.replace(/\*|\s/g, '') || ''
                  const content = parts.slice(1).join(': ') || ''
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
      // 普通文本格式
      return (
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {rawOutput.split('\n').map((line, lineIndex) => (
            <div key={lineIndex}>{line}</div>
          ))}
        </div>
      )
    }
  }
  
  return (
    <div key={index} className="border rounded-lg p-4 mb-4">
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <h4 className="font-medium text-blue-600">{item.batch_id || `批次 ${index + 1}`}</h4>
        <div className="text-sm text-gray-600">
          <span>{item.image_count || 0} 张照片</span>
          <span className="mx-2">•</span>
          <span>{formatDate(item.processed_at)}</span>
        </div>
      </div>

      {/* 分析摘要 */}
      {item.analysis_summary && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">分析摘要</h5>
          <p className="text-sm text-gray-600">{item.analysis_summary}</p>
        </div>
      )}

      {/* 原始输出 */}
      {item.raw_vlm_output && (
        <details className="mt-4">
          <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
            查看详细分析结果
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            {formatRawOutput(item.raw_vlm_output)}
          </div>
        </details>
      )}
    </div>
  )
}

// 主组件
const Phase1Results = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null
  
  return (
    <div className="border rounded p-4 mt-6">
      <h3 className="text-lg font-medium mb-4">详细分析记录</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <Phase1Item key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  )
}

export default Phase1Results