// 通用工具函数，抽离复用逻辑
export const formatDate = (dateString) => {
  if (!dateString) return '未完成'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '无效时间'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 安全获取嵌套对象属性
export const getNestedValue = (obj, path, defaultValue = '未知') => {
  return path.split('.').reduce((acc, curr) => {
    return acc && acc[curr] !== undefined ? acc[curr] : defaultValue
  }, obj)
}

// 格式化JSON字符串
export const formatJson = (data) => {
  try {
    if (typeof data === 'string') {
      // 提取markdown中的JSON内容
      const jsonMatch = data.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.stringify(JSON.parse(jsonMatch[1]), null, 2)
      }
      // 尝试直接解析字符串
      return JSON.stringify(JSON.parse(data), null, 2)
    }
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('JSON格式化失败:', error)
    return JSON.stringify(data || {}, null, 2)
  }
}

// 获取状态对应的样式类
export const getStatusStyle = (status) => {
  const styles = {
    completed: {
      bg: 'bg-green-100 text-green-700',
      dot: 'bg-green-500',
      label: '已完成'
    },
    failed: {
      bg: 'bg-red-100 text-red-700',
      dot: 'bg-red-500',
      label: '失败'
    },
    processing: {
      bg: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-500 animate-pulse',
      label: '处理中'
    },
    pending: {
      bg: 'bg-yellow-100 text-yellow-700',
      dot: 'bg-yellow-500',
      label: '待处理'
    }
  }
  return styles[status] || styles.pending
}