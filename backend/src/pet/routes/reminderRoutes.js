/**
 * Reminder Routes - 提醒路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as reminderController from '../controllers/reminderController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/reminders/batch
 * @desc    批量创建提醒
 * @access  Private
 */
router.post('/batch', asyncHandler(reminderController.createReminderBatch));

/**
 * @route   POST /api/reminders/batch/complete
 * @desc    批量完成提醒
 * @access  Private
 */
router.post('/batch/complete', asyncHandler(reminderController.batchCompleteReminders));

/**
 * @route   POST /api/reminders/batch/dismiss
 * @desc    批量忽略提醒
 * @access  Private
 */
router.post('/batch/dismiss', asyncHandler(reminderController.batchDismissReminders));

/**
 * @route   GET /api/reminders/pending
 * @desc    获取待处理的提醒
 * @access  Private
 */
router.get('/pending', asyncHandler(reminderController.getPendingReminders));

/**
 * @route   GET /api/reminders/today
 * @desc    获取今日提醒
 * @access  Private
 */
router.get('/today', asyncHandler(reminderController.getTodayReminders));

/**
 * @route   GET /api/reminders/overdue
 * @desc    获取逾期提醒
 * @access  Private
 */
router.get('/overdue', asyncHandler(reminderController.getOverdueReminders));

/**
 * @route   GET /api/reminders/stats
 * @desc    获取提醒统计
 * @access  Private
 */
router.get('/stats', asyncHandler(reminderController.getReminderStats));

/**
 * @route   GET /api/reminders/my
 * @desc    获取当前用户的提醒列表
 * @access  Private
 */
router.get('/my', asyncHandler(reminderController.getUserReminders));

/**
 * @route   GET /api/reminders/:id
 * @desc    获取提醒详情
 * @access  Private
 */
router.get('/:id', asyncHandler(reminderController.getReminderById));

/**
 * @route   PATCH /api/reminders/:id
 * @desc    更新提醒
 * @access  Private
 */
router.patch('/:id', asyncHandler(reminderController.updateReminder));

/**
 * @route   POST /api/reminders/:id/complete
 * @desc    完成提醒
 * @access  Private
 */
router.post('/:id/complete', asyncHandler(reminderController.completeReminder));

/**
 * @route   POST /api/reminders/:id/dismiss
 * @desc    忽略提醒
 * @access  Private
 */
router.post('/:id/dismiss', asyncHandler(reminderController.dismissReminder));

/**
 * @route   DELETE /api/reminders/:id
 * @desc    删除提醒（软删除）
 * @access  Private
 */
router.delete('/:id', asyncHandler(reminderController.deleteReminder));

export default router;

