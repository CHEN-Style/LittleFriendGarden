/**
 * Reminder Controller - 提醒控制器
 * 处理提醒相关的 HTTP 请求
 */

import * as reminderService from '../services/reminderService.js';

/**
 * @route   POST /api/pets/:petId/reminders
 * @desc    创建提醒
 * @access  Private
 */
export async function createReminder(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const reminder = await reminderService.createReminder(
    {
      petId,
      ...req.body,
    },
    userId
  );

  res.status(201).json({
    success: true,
    data: reminder,
  });
}

/**
 * @route   POST /api/reminders/batch
 * @desc    批量创建提醒
 * @access  Private
 */
export async function createReminderBatch(req, res) {
  const userId = req.user.userId;
  const { reminders } = req.body;

  const result = await reminderService.createReminderBatch(reminders, userId);

  res.status(201).json({
    success: true,
    data: result,
    message: `Created ${result.count} reminders`,
  });
}

/**
 * @route   GET /api/reminders/:id
 * @desc    获取提醒详情
 * @access  Private
 */
export async function getReminderById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const reminder = await reminderService.getReminderById(id, userId);

  res.json({
    success: true,
    data: reminder,
  });
}

/**
 * @route   GET /api/pets/:petId/reminders
 * @desc    获取宠物的提醒列表
 * @access  Private
 */
export async function getPetReminders(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { reminderType, status, startDate, endDate, limit, offset } = req.query;

  const options = {
    reminderType,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reminderService.getPetReminders(petId, options, userId);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/reminders/my
 * @desc    获取当前用户的提醒列表
 * @access  Private
 */
export async function getUserReminders(req, res) {
  const userId = req.user.userId;

  const { status, startDate, endDate, limit, offset } = req.query;

  const options = {
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reminderService.getUserReminders(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/reminders/pending
 * @desc    获取待处理的提醒
 * @access  Private
 */
export async function getPendingReminders(req, res) {
  const userId = req.user.userId;

  const { petId, hoursAhead } = req.query;

  const reminders = await reminderService.getPendingReminders(
    userId,
    petId || null,
    hoursAhead ? parseInt(hoursAhead) : 24
  );

  res.json({
    success: true,
    data: reminders,
  });
}

/**
 * @route   GET /api/reminders/today
 * @desc    获取今日提醒
 * @access  Private
 */
export async function getTodayReminders(req, res) {
  const userId = req.user.userId;

  const reminders = await reminderService.getTodayReminders(userId);

  res.json({
    success: true,
    data: reminders,
  });
}

/**
 * @route   GET /api/reminders/overdue
 * @desc    获取逾期提醒
 * @access  Private
 */
export async function getOverdueReminders(req, res) {
  const userId = req.user.userId;

  const reminders = await reminderService.getOverdueReminders(userId);

  res.json({
    success: true,
    data: reminders,
  });
}

/**
 * @route   GET /api/reminders/stats
 * @desc    获取提醒统计
 * @access  Private
 */
export async function getReminderStats(req, res) {
  const userId = req.user.userId;

  const stats = await reminderService.getReminderStats(userId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   PATCH /api/reminders/:id
 * @desc    更新提醒
 * @access  Private
 */
export async function updateReminder(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const reminder = await reminderService.updateReminder(id, req.body, userId);

  res.json({
    success: true,
    data: reminder,
  });
}

/**
 * @route   POST /api/reminders/:id/complete
 * @desc    完成提醒
 * @access  Private
 */
export async function completeReminder(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const reminder = await reminderService.completeReminder(id, userId);

  res.json({
    success: true,
    data: { ...reminder, status: 'completed' },
    message: 'Reminder completed',
  });
}

/**
 * @route   POST /api/reminders/:id/dismiss
 * @desc    忽略提醒
 * @access  Private
 */
export async function dismissReminder(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const reminder = await reminderService.dismissReminder(id, userId);

  res.json({
    success: true,
    data: { ...reminder, status: 'dismissed' },
    message: 'Reminder dismissed',
  });
}

/**
 * @route   POST /api/reminders/batch/complete
 * @desc    批量完成提醒
 * @access  Private
 */
export async function batchCompleteReminders(req, res) {
  const userId = req.user.userId;
  const { ids } = req.body;

  const result = await reminderService.batchCompleteReminders(ids, userId);

  res.json({
    success: true,
    data: result,
    message: `Completed ${result.count} reminders`,
  });
}

/**
 * @route   POST /api/reminders/batch/dismiss
 * @desc    批量忽略提醒
 * @access  Private
 */
export async function batchDismissReminders(req, res) {
  const userId = req.user.userId;
  const { ids } = req.body;

  const result = await reminderService.batchDismissReminders(ids, userId);

  res.json({
    success: true,
    data: result,
    message: `Dismissed ${result.count} reminders`,
  });
}

/**
 * @route   DELETE /api/reminders/:id
 * @desc    删除提醒（软删除）
 * @access  Private
 */
export async function deleteReminder(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await reminderService.deleteReminder(id, userId);

  res.json({
    success: true,
    message: 'Reminder deleted successfully',
  });
}

