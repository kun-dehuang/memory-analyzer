import React from 'react'
import { formatDate, getStatusStyle } from '../utils/helpers.js'

const BasicInfo = ({ record }) => {
  const statusStyle = getStatusStyle(record?.status)
  
  return (
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
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusStyle.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
            {statusStyle.label}
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
            <span className="text-xl font-bold text-gray-900">{record?.image_count || 0}</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm text-gray-500 mb-1">创建时间</div>
          <div className="text-sm font-medium text-gray-900">{formatDate(record?.created_at)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm text-gray-500 mb-1">完成时间</div>
          <div className="text-sm font-medium text-gray-900">{formatDate(record?.completed_at)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-sm text-gray-500 mb-1">时间范围</div>
          <div className="text-sm font-medium text-gray-900">
            {record?.time_range ? (
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
  )
}

export default BasicInfo