/**
 * Calendar Controller - 日历聚合控制器
 * 处理日历相关的 HTTP 请求
 */

import * as calendarService from '../services/calendarService.js';

/**
 * @route   GET /api/calendar
 * @desc    获取用户的日历项目（聚合待办和提醒）
 * @access  Private
 */
export async function getCalendarItems(req, res) {
  const userId = req.user.userId;

  const { itemKind, status, startDate, endDate, limit, offset } = req.query;

  const options = {
    itemKind,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 100,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await calendarService.getCalendarItems(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/calendar/today
 * @desc    获取今日日历项目
 * @access  Private
 */
export async function getTodayCalendarItems(req, res) {
  const userId = req.user.userId;

  const items = await calendarService.getTodayCalendarItems(userId);

  res.json({
    success: true,
    data: items,
  });
}

/**
 * @route   GET /api/calendar/week
 * @desc    获取本周日历项目
 * @access  Private
 */
export async function getWeekCalendarItems(req, res) {
  const userId = req.user.userId;

  const items = await calendarService.getWeekCalendarItems(userId);

  res.json({
    success: true,
    data: items,
  });
}

/**
 * @route   GET /api/calendar/overdue
 * @desc    获取逾期日历项目
 * @access  Private
 */
export async function getOverdueCalendarItems(req, res) {
  const userId = req.user.userId;

  const items = await calendarService.getOverdueCalendarItems(userId);

  res.json({
    success: true,
    data: items,
  });
}

/**
 * @route   GET /api/calendar/stats
 * @desc    获取日历统计
 * @access  Private
 */
export async function getCalendarStats(req, res) {
  const userId = req.user.userId;

  const stats = await calendarService.getCalendarStats(userId);

  res.json({
    success: true,
    data: stats,
  });
}

