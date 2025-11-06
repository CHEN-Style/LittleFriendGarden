/**
 * Reminder Repository - 提醒数据访问层
 * 职责：封装所有与 Reminder 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建提醒
 * @param {Object} reminderData - 提醒数据
 * @returns {Promise<Object>} 创建的提醒
 */
export async function createReminder(reminderData) {
  try {
    return await prisma.reminder.create({
      data: reminderData,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create reminder: ${error.message}`, { reminderData });
  }
}

/**
 * 批量创建提醒
 * @param {Array<Object>} reminderDataArray - 提醒数据数组
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createReminderBatch(reminderDataArray) {
  try {
    return await prisma.reminder.createMany({
      data: reminderDataArray,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch create reminders: ${error.message}`, {
      count: reminderDataArray.length,
    });
  }
}

/**
 * 根据 ID 查找提醒
 * @param {string} id - 提醒 ID
 * @returns {Promise<Object|null>} 提醒
 */
export async function findReminderById(id) {
  try {
    return await prisma.reminder.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find reminder: ${error.message}`, { id });
  }
}

/**
 * 根据宠物 ID 查找提醒列表（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {string} options.petId - 宠物 ID
 * @param {string} [options.reminderType] - 提醒类型
 * @param {string} [options.status] - 状态（pending/completed/dismissed）
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findRemindersByPetId({
  petId,
  status,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    // 状态过滤
    if (status) {
      where.status = status;
    }

    // 时间范围过滤
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = startDate;
      if (endDate) where.scheduledAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          pet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.reminder.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find reminders: ${error.message}`, { petId });
  }
}

/**
 * 根据用户 ID 查找提醒列表
 * @param {Object} options - 查询选项
 * @param {string} options.userId - 用户 ID
 * @param {string} [options.status] - 状态
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findRemindersByUserId({ userId, status, startDate, endDate, limit = 50, offset = 0 }) {
  try {
    const where = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = startDate;
      if (endDate) where.scheduledAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          pet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.reminder.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find reminders by user: ${error.message}`, { userId });
  }
}

/**
 * 获取待处理的提醒（使用视图）
 * @param {string} [userId] - 用户 ID（可选）
 * @param {string} [petId] - 宠物 ID（可选）
 * @param {number} [hoursAhead=24] - 提前小时数
 * @returns {Promise<Array>} 待处理提醒列表
 */
export async function getPendingReminders(userId = null, petId = null, hoursAhead = 24) {
  try {
    const now = new Date();
    const until = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return await prisma.reminder.findMany({
      where: {
        ...(userId && { userId }),
        ...(petId && { petId }),
        status: 'pending',
        deletedAt: null,
        scheduledAt: { gte: now, lte: until },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get pending reminders: ${error.message}`, { userId, petId });
  }
}

/**
 * 获取今日提醒
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 今日提醒列表
 */
export async function getTodayReminders(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        deletedAt: null,
        scheduledAt: { gte: today, lt: tomorrow },
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get today's reminders: ${error.message}`, { userId });
  }
}

/**
 * 获取逾期提醒
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 逾期提醒列表
 */
export async function getOverdueReminders(userId) {
  try {
    return await prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        deletedAt: null,
        scheduledAt: { lt: new Date() },
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get overdue reminders: ${error.message}`, { userId });
  }
}

/**
 * 更新提醒
 * @param {string} id - 提醒 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的提醒
 */
export async function updateReminder(id, updateData) {
  try {
    return await prisma.reminder.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update reminder: ${error.message}`, { id });
  }
}

/**
 * 完成提醒
 * @param {string} id - 提醒 ID
 * @returns {Promise<Object>} 更新后的提醒
 */
export async function completeReminder(id) {
  try {
    return await prisma.reminder.update({
      where: { id },
      data: {
        status: 'done',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to complete reminder: ${error.message}`, { id });
  }
}

/**
 * 忽略提醒
 * @param {string} id - 提醒 ID
 * @returns {Promise<Object>} 更新后的提醒
 */
export async function dismissReminder(id) {
  try {
    return await prisma.reminder.update({
      where: { id },
      data: {
        status: 'archived',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to dismiss reminder: ${error.message}`, { id });
  }
}

/**
 * 软删除提醒
 * @param {string} id - 提醒 ID
 * @returns {Promise<Object>} 删除的提醒
 */
export async function softDeleteReminder(id) {
  try {
    return await prisma.reminder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete reminder: ${error.message}`, { id });
  }
}

/**
 * 硬删除提醒（仅用于测试/清理）
 * @param {string} id - 提醒 ID
 * @returns {Promise<Object>} 删除的提醒
 */
export async function hardDeleteReminder(id) {
  try {
    return await prisma.reminder.delete({
      where: { id },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to hard delete reminder: ${error.message}`, { id });
  }
}

/**
 * 批量完成提醒
 * @param {Array<string>} ids - 提醒 ID 数组
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchCompleteReminders(ids) {
  try {
    return await prisma.reminder.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'done',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch complete reminders: ${error.message}`, { count: ids.length });
  }
}

/**
 * 批量忽略提醒
 * @param {Array<string>} ids - 提醒 ID 数组
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchDismissReminders(ids) {
  try {
    return await prisma.reminder.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'archived',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch dismiss reminders: ${error.message}`, { count: ids.length });
  }
}

/**
 * 获取提醒统计信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getReminderStats(userId) {
  try {
    const [total, pending, done, archived, overdue] = await Promise.all([
      prisma.reminder.count({
        where: { userId, deletedAt: null },
      }),
      prisma.reminder.count({
        where: { userId, status: 'pending', deletedAt: null },
      }),
      prisma.reminder.count({
        where: { userId, status: 'done', deletedAt: null },
      }),
      prisma.reminder.count({
        where: { userId, status: 'archived', deletedAt: null },
      }),
      prisma.reminder.count({
        where: {
          userId,
          status: 'pending',
          deletedAt: null,
          scheduledAt: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      pending,
      done,
      archived,
      overdue,
    };
  } catch (error) {
    throw new DatabaseError(`Failed to get reminder stats: ${error.message}`, { userId });
  }
}

