/**
 * Todo Service - 用户待办任务相关 API
 */

import { post } from './api.js';

/**
 * 创建单条待办任务
 * @param {Object} todoData
 * @param {string} token - JWT access token
 * @returns {Promise<Object>} 创建成功后的任务对象
 */
export async function createTodo(todoData, token) {
  const response = await post('/todos', todoData, token);
  return response.data;
}

export default {
  createTodo,
};


