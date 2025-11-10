/**
 * Calendar Service - 日历聚合业务逻辑层
 * 处理跨域日历聚合相关的业务逻辑
 */

import * as calendarRepo from '../repositories/calendarRepository.js';
import { ValidationError } from '../../errors/index.js';

/**
 * 有效的项目类型
 */
const VALID_ITEM_KINDS = ['user_todo', 'pet_reminder'];

/**
 * 有效的状态
 */
const VALID_STATUSES = ['pending', 'done', 'archived'];

/**
 * 获取用户的日历项目
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getCalendarItems(userId, options) {
  const { itemKind, status, startDate, endDate, limit, offset } = options;

  // 验证 itemKind
  if (itemKind && !VALID_ITEM_KINDS.includes(itemKind)) {
    throw new ValidationError(`Invalid itemKind. Must be one of: ${VALID_ITEM_KINDS.join(', ')}`);
  }

  // 验证状态
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return await calendarRepo.getCalendarItems({
    userId,
    itemKind,
    status,
    startDate,
    endDate,
    limit,
    offset,
  });
}

/**
 * 获取今日日历项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 今日日历项目列表
 */
export async function getTodayCalendarItems(userId) {
  return await calendarRepo.getTodayCalendarItems(userId);
}

/**
 * 获取本周日历项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 本周日历项目列表
 */
export async function getWeekCalendarItems(userId) {
  return await calendarRepo.getWeekCalendarItems(userId);
}

/**
 * 获取逾期日历项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 逾期日历项目列表
 */
export async function getOverdueCalendarItems(userId) {
  return await calendarRepo.getOverdueCalendarItems(userId);
}

/**
 * 获取日历统计
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getCalendarStats(userId) {
  return await calendarRepo.getCalendarStats(userId);
}

