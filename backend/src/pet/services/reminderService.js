/**
 * Reminder Service - 提醒业务逻辑层
 * 处理提醒相关的业务逻辑
 */

import * as reminderRepo from '../repositories/reminderRepository.js';
import * as petRepo from '../repositories/petRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 根据简单 RRULE（仅支持 DAILY/WEEKLY/MONTHLY + INTERVAL=1）计算下一次时间
 * @param {Date} baseDate - 当前这条提醒的 scheduledAt
 * @param {string|null} repeatRule - RRULE 字符串，例如 FREQ=DAILY;INTERVAL=1
 * @returns {Date|null} 下一次时间，若无法解析则返回 null
 */
function getNextOccurrence(baseDate, repeatRule) {
  if (!baseDate || !repeatRule) return null;

  const parts = repeatRule.split(';').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    if (k && v) {
      acc[k.toUpperCase()] = v.toUpperCase();
    }
    return acc;
  }, {});

  const freq = parts.FREQ;
  const interval = Number(parts.INTERVAL || '1') || 1;

  const next = new Date(baseDate);

  switch (freq) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval);
      break;
    default:
      return null;
  }

  return next;
}

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
  const {
    petId,
    scheduledAt,
    remindAt,
    dueAt,
    repeatRule,
    timezone,
    title,
    description,
    priority,
    tags,
  } = data;

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
    repeatRule: repeatRule || null,
    timezone: timezone || null,
    userId,
    title,
    description,
    priority,
    scheduledAt: scheduledAtDate,
    dueAt: dueAt ? new Date(dueAt) : null,
    tags: Array.isArray(tags) ? tags : [],
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
    tags: Array.isArray(d.tags) ? d.tags : [],
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

  const { scheduledAt, remindAt, dueAt, title, description, status, priority, tags, repeatRule, timezone } = data;

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
    ...(tags !== undefined && { tags }),
    ...(repeatRule !== undefined && { repeatRule: repeatRule || null }),
    ...(timezone !== undefined && { timezone: timezone || null }),
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
  // 先拿到原始提醒并校验权限
  const reminder = await getReminderById(id, userId);

  // 标记当前这条为完成
  const completed = await reminderRepo.completeReminder(id);

  // 如果没有重复规则，直接返回即可
  if (!reminder.repeatRule) {
    return completed;
  }

  // 只在有 scheduledAt 的情况下生成下一条
  if (!reminder.scheduledAt) {
    return completed;
  }

  const nextScheduledAt = getNextOccurrence(new Date(reminder.scheduledAt), reminder.repeatRule);

  // 如果解析失败，则不再生成下一条，保持向后兼容
  if (!nextScheduledAt) {
    return completed;
  }

  // 如果有 dueAt，则保持相同的间隔
  let nextDueAt = null;
  if (reminder.dueAt) {
    const dueDiff = new Date(reminder.dueAt).getTime() - new Date(reminder.scheduledAt).getTime();
    nextDueAt = new Date(nextScheduledAt.getTime() + dueDiff);
  }

  // 在创建下一条之前，检查是否已经存在同一重复规则下、同一 scheduledAt 的实例，
  // 避免在同一条提醒上多次点击「完成」导致为同一天生成 N 条副本。
  const existingNext = await reminderRepo.findExistingRecurringInstance({
    userId: reminder.userId,
    petId: reminder.petId,
    title: reminder.title,
    scheduledAt: nextScheduledAt,
    repeatRule: reminder.repeatRule,
  });

  if (existingNext) {
    return completed;
  }

  // 创建下一条同配置的提醒（保留 repeatRule，方便继续往后滚动）
  await reminderRepo.createReminder({
    userId: reminder.userId,
    petId: reminder.petId,
    title: reminder.title,
    description: reminder.description,
    priority: reminder.priority,
    tags: reminder.tags,
    scheduledAt: nextScheduledAt,
    dueAt: nextDueAt,
    repeatRule: reminder.repeatRule,
    timezone: reminder.timezone,
    status: 'pending',
  });

  return completed;
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

  // 逐个验证权限并完成，复用单条完成逻辑以保证重复规则的行为一致
  const results = [];
  // 使用 Set 去重，避免重复 ID
  const uniqueIds = Array.from(new Set(ids));
  // 顺序执行，保证同一条的重复生成顺序一致
  // 如果需要极致性能，可以改成分组并行，这里先保持简单和正确
  // eslint-disable-next-line no-restricted-syntax
  for (const id of uniqueIds) {
    // eslint-disable-next-line no-await-in-loop
    const completed = await completeReminder(id, userId);
    results.push(completed);
  }

  return {
    count: results.length,
    items: results,
  };
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

