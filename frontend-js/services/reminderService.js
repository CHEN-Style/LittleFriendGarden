/**
 * Reminder Service - 提醒相关 API
 */

import { get, post, patch } from './api.js';

/**
 * 为宠物创建提醒
 * @param {Object} reminderData - 提醒数据，必须包含 petId
 * @param {string} token - JWT access token
 * @returns {Promise<Object>} 创建成功后的提醒对象
 */
export async function createReminder(reminderData, token) {
  const { petId, ...rest } = reminderData || {};

  if (!petId) {
    throw new Error('创建提醒时缺少 petId，请选择宠物后再试');
  }

  const response = await post(`/pets/${petId}/reminders`, rest, token);
  return response.data;
}

/**
 * 完成提醒
 * @param {string} id - 提醒 ID
 * @param {string} token - JWT access token
 * @returns {Promise<Object>} 更新后的提醒对象
 */
export async function completeReminder(id, token) {
  const response = await post(`/reminders/${id}/complete`, {}, token);
  return response.data;
}

/**
 * 更新提醒
 * @param {string} id - 提醒 ID
 * @param {Object} data - 更新数据（例如 { status: 'pending' }）
 * @param {string} token - JWT access token
 * @returns {Promise<Object>} 更新后的提醒对象
 */
export async function updateReminder(id, data, token) {
  const response = await patch(`/reminders/${id}`, data, token);
  return response.data;
}

/**
 * 获取今日提醒（当前用户）
 * @param {string} token - JWT access token
 * @returns {Promise<Array>} 今日提醒列表
 */
export async function getTodayReminders(token) {
  const response = await get('/reminders/today', token);
  return response.data || [];
}

/**
 * 获取当前用户的提醒列表
 * @param {Object} params - 查询参数 { status, startDate, endDate, limit, offset }
 * @param {string} token - JWT access token
 * @returns {Promise<Array>} 提醒列表
 */
export async function getUserReminders(params = {}, token) {
  const queryParts = [];

  if (params.status) {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.startDate) {
    queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
  }
  if (params.endDate) {
    queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
  }
  if (typeof params.limit === 'number') {
    queryParts.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }
  if (typeof params.offset === 'number') {
    queryParts.push(`offset=${encodeURIComponent(String(params.offset))}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await get(`/reminders/my${queryString}`, token);
  return response.data || [];
}

export default {
  createReminder,
  completeReminder,
  updateReminder,
  getTodayReminders,
  getUserReminders,
};

