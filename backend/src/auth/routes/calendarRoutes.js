/**
 * Calendar Routes - 日历聚合路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as calendarController from '../controllers/calendarController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/calendar/today
 * @desc    获取今日日历项目
 * @access  Private
 */
router.get('/today', asyncHandler(calendarController.getTodayCalendarItems));

/**
 * @route   GET /api/calendar/week
 * @desc    获取本周日历项目
 * @access  Private
 */
router.get('/week', asyncHandler(calendarController.getWeekCalendarItems));

/**
 * @route   GET /api/calendar/overdue
 * @desc    获取逾期日历项目
 * @access  Private
 */
router.get('/overdue', asyncHandler(calendarController.getOverdueCalendarItems));

/**
 * @route   GET /api/calendar/stats
 * @desc    获取日历统计
 * @access  Private
 */
router.get('/stats', asyncHandler(calendarController.getCalendarStats));

/**
 * @route   GET /api/calendar
 * @desc    获取用户的日历项目（聚合待办和提醒）
 * @access  Private
 */
router.get('/', asyncHandler(calendarController.getCalendarItems));

export default router;

