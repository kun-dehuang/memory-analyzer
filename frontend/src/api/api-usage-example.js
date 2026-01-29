// API使用示例
// 此文件展示了如何在前端组件中使用API

import { authAPI, promptAPI, memoryAPI } from './api';

// 1. 登录示例
const loginExample = async () => {
  try {
    const response = await authAPI.login({
      username: 'user123',
      password: 'password123'
    });
    
    // 保存token到本地存储
    localStorage.setItem('token', response.token);
    
    console.log('登录成功:', response);
    // 跳转到首页或其他页面
  } catch (error) {
    console.error('登录失败:', error);
    // 显示错误信息给用户
  }
};

// 2. 获取提示词组列表示例
const getPromptGroupsExample = async () => {
  try {
    const promptGroups = await promptAPI.getPromptGroups();
    console.log('提示词组列表:', promptGroups);
    // 显示提示词组列表给用户
  } catch (error) {
    console.error('获取提示词组失败:', error);
    // 显示错误信息给用户
  }
};

// 3. 创建记忆记录示例
const createMemoryRecordExample = async () => {
  try {
    const recordData = {
      userId: 1,
      content: '这是一段需要分析的记忆内容',
      promptGroupId: 1
    };
    
    const response = await memoryAPI.createMemoryRecord(recordData);
    console.log('创建记忆记录成功:', response);
    // 跳转到记忆记录详情页面或刷新列表
  } catch (error) {
    console.error('创建记忆记录失败:', error);
    // 显示错误信息给用户
  }
};

// 4. 获取当前用户信息示例
const getCurrentUserExample = async () => {
  try {
    const userInfo = await authAPI.getCurrentUser();
    console.log('当前用户信息:', userInfo);
    // 使用用户信息更新UI
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 显示错误信息给用户
  }
};

// 导出示例函数供参考
export {
  loginExample,
  getPromptGroupsExample,
  createMemoryRecordExample,
  getCurrentUserExample
};
