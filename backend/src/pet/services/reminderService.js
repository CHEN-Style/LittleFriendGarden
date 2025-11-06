/**
 * Reminder Service - 提醒业务逻辑层
 * 处理提醒相关的业务逻辑
 */

import * as reminderRepo from '../repositories/reminderRepository.js';
import * as petRepo from '../repositories/petRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 有效的提醒类型
 */
const VALID_REMINDER_TYPES = [
  'vaccine',
  'medication',
  'checkup',
  'grooming',
  'feeding',
  'exercise',
  'other',
];

/**
 * 有效的提醒状态
 */
const VALID_STATUSES = ['pending', 'done', 'archived'];

/**
 * 校验用户对宠物的访问权限
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 宠物对象
 */
async function checkPetAccess(petId, userId) {
  const pet = await petRepo.findPetById(petId);

  if (!pet || pet.deletedAt) {
    throw new NotFoundError('Pet not found');
  }

  const hasAccess = pet.owners.some((owner) => owner.userId === userId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this pet');
  }

  return pet;
}

/**
 * 创建提醒
 * @param {Object} data - 提醒数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的提醒
 */
export async function createReminder(data, userId) {
  const { petId, scheduledAt, remindAt, dueAt, title, description, priority } = data;

  const effectiveScheduled = scheduledAt || remindAt;

  // 验证必填字段
  if (!petId || !effectiveScheduled || !title) {
    throw new ValidationError('petId, scheduledAt, and title are required');
  }

  // 验证提醒时间（不能是过去时间）
  const scheduledAtDate = new Date(effectiveScheduled);
  if (isNaN(scheduledAtDate.getTime())) {
    throw new ValidationError('scheduledAt is invalid');
  }
  if (scheduledAtDate < new Date()) {
    throw new ValidationError('Reminder time cannot be in the past');
  }

  // 检查权限
  await checkPetAccess(petId, userId);

  // 创建提醒
  const reminderData = {
    petId,
    userId,
    title,
    description,
    priority,
    scheduledAt: scheduledAtDate,
    dueAt: dueAt ? new Date(dueAt) : null,
    status: 'pending',
  };

  return await reminderRepo.createReminder(reminderData);
}

/**
 * 批量创建提醒
 * @param {Array<Object>} dataArray - 提醒数据数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createReminderBatch(dataArray, userId) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new ValidationError('Invalid data array');
  }

  // 检查所有宠物的访问权限
  const petIds = [...new Set(dataArray.map((d) => d.petId))];
  await Promise.all(petIds.map((petId) => checkPetAccess(petId, userId)));

  // 准备数据
  const reminderDataArray = dataArray.map((d) => ({
    petId: d.petId,
    userId,
    title: d.title,
    description: d.description,
    priority: d.priority,
    scheduledAt: new Date(d.scheduledAt || d.remindAt),
    dueAt: d.dueAt ? new Date(d.dueAt) : null,
    status: 'pending',
  }));

  return await reminderRepo.createReminderBatch(reminderDataArray);
}

/**
 * 获取提醒
 * @param {string} id - 提醒 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 提醒
 */
export async function getReminderById(id, userId) {
  const reminder = await reminderRepo.findReminderById(id);

  if (!reminder || reminder.deletedAt) {
    throw new NotFoundError('Reminder not found');
  }

  // 检查权限（只有创建者可以查看）
  if (reminder.userId !== userId) {
    throw new ForbiddenError('You do not have access to this reminder');
  }

  return reminder;
}

/**
 * 获取宠物的提醒列表
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPetReminders(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await reminderRepo.findRemindersByPetId({
    petId,
    ...options,
  });
}

/**
 * 获取用户的提醒列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getUserReminders(userId, options) {
  return await reminderRepo.findRemindersByUserId({
    userId,
    ...options,
  });
}

/**
 * 获取待处理的提醒
 * @param {string} userId - 用户 ID
 * @param {string} [petId] - 宠物 ID（可选）
 * @param {number} [hoursAhead=24] - 提前小时数
 * @returns {Promise<Array>} 待处理提醒列表
 */
export async function getPendingReminders(userId, petId = null, hoursAhead = 24) {
  if (petId) {
    await checkPetAccess(petId, userId);
  }

  return await reminderRepo.getPendingReminders(userId, petId, hoursAhead);
}

/**
 * 获取今日提醒
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 今日提醒列表
 */
export async function getTodayReminders(userId) {
  return await reminderRepo.getTodayReminders(userId);
}

/**
 * 获取逾期提醒
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 逾期提醒列表
 */
export async function getOverdueReminders(userId) {
  return await reminderRepo.getOverdueReminders(userId);
}

/**
 * 更新提醒
 * @param {string} id - 提醒 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的提醒
 */
export async function updateReminder(id, data, userId) {
  // 先检查权限
  await getReminderById(id, userId);

  const { scheduledAt, remindAt, dueAt, title, description, status, priority } = data;

  // 验证状态
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // 准备更新数据
  const updateData = {
    ...((scheduledAt || remindAt) && { scheduledAt: new Date(scheduledAt || remindAt) }),
    ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(priority !== undefined && { priority }),
    ...(status && { status }),
  };

  return await reminderRepo.updateReminder(id, updateData);
}

/**
 * 完成提醒
 * @param {string} id - 提醒 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的提醒
 */
export async function completeReminder(id, userId) {
  // 先检查权限
  await getReminderById(id, userId);

  return await reminderRepo.completeReminder(id);
}

/**
 * 忽略提醒
 * @param {string} id - 提醒 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的提醒
 */
export async function dismissReminder(id, userId) {
  // 先检查权限
  await getReminderById(id, userId);

  return await reminderRepo.dismissReminder(id);
}

/**
 * 批量完成提醒
 * @param {Array<string>} ids - 提醒 ID 数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchCompleteReminders(ids, userId) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('Invalid ids array');
  }

  // 验证所有提醒的权限
  await Promise.all(ids.map((id) => getReminderById(id, userId)));

  return await reminderRepo.batchCompleteReminders(ids);
}

/**
 * 批量忽略提醒
 * @param {Array<string>} ids - 提醒 ID 数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchDismissReminders(ids, userId) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('Invalid ids array');
  }

  // 验证所有提醒的权限
  await Promise.all(ids.map((id) => getReminderById(id, userId)));

  return await reminderRepo.batchDismissReminders(ids);
}

/**
 * 删除提醒（软删除）
 * @param {string} id - 提醒 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function deleteReminder(id, userId) {
  // 先检查权限
  await getReminderById(id, userId);

  await reminderRepo.softDeleteReminder(id);
}

/**
 * 获取提醒统计
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getReminderStats(userId) {
  return await reminderRepo.getReminderStats(userId);
}

