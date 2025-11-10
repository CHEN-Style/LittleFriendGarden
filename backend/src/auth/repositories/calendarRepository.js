/**
 * Calendar Repository - 日历聚合视图数据访问层
 * 职责：封装日历相关的跨域聚合查询
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 获取用户的日历项目（聚合 user_todos 和 reminders）
 * @param {Object} options - 查询选项
 * @param {string} options.userId - 用户 ID
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {string} [options.itemKind] - 项目类型（'user_todo' | 'pet_reminder'）
 * @param {string} [options.status] - 状态筛选
 * @param {number} [options.limit=100] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getCalendarItems({
  userId,
  startDate,
  endDate,
  itemKind,
  status,
  limit = 100,
  offset = 0,
}) {
  try {
    // 构建查询条件
    const todoWhere = {
      userId,
      deletedAt: null,
    };

    const reminderWhere = {
      userId,
      deletedAt: null,
    };

    // 状态过滤
    if (status) {
      todoWhere.status = status;
      reminderWhere.status = status;
    }

    // 宠物可见性：仅返回用户可见的提醒（宠物为空，或用户是主主人，或在共享成员中）
    reminderWhere.AND = [
      ...(reminderWhere.AND || []),
      {
        OR: [
          { petId: null },
          {
            pet: {
              OR: [
                { primaryOwnerId: userId },
                { owners: { some: { userId } } },
              ],
            },
          },
        ],
      },
    ];

    // 时间范围过滤（使用 scheduledAt）
    if (startDate || endDate) {
      todoWhere.OR = [];
      reminderWhere.OR = [];

      if (startDate && endDate) {
        todoWhere.OR.push(
          { scheduledAt: { gte: startDate, lte: endDate } },
          { dueAt: { gte: startDate, lte: endDate } }
        );
        reminderWhere.OR.push(
          { scheduledAt: { gte: startDate, lte: endDate } },
          { dueAt: { gte: startDate, lte: endDate } }
        );
      } else if (startDate) {
        todoWhere.OR.push({ scheduledAt: { gte: startDate } }, { dueAt: { gte: startDate } });
        reminderWhere.OR.push({ scheduledAt: { gte: startDate } }, { dueAt: { gte: startDate } });
      } else if (endDate) {
        todoWhere.OR.push({ scheduledAt: { lte: endDate } }, { dueAt: { lte: endDate } });
        reminderWhere.OR.push({ scheduledAt: { lte: endDate } }, { dueAt: { lte: endDate } });
      }
    }

    // 并行查询两个数据源
    const [todos, reminders] = await Promise.all([
      itemKind === 'pet_reminder'
        ? []
        : prisma.userTodo.findMany({
            where: todoWhere,
            include: {
              pet: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
          }),
      itemKind === 'user_todo'
        ? []
        : prisma.reminder.findMany({
            where: reminderWhere,
            include: {
              pet: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
          }),
    ]);

    // 转换为统一格式
    const todoItems = todos.map((todo) => ({
      itemId: todo.id,
      itemKind: 'user_todo',
      userId: todo.userId,
      petId: todo.petId,
      pet: todo.pet,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      status: todo.status,
      tags: todo.tags,
      scheduledAt: todo.scheduledAt,
      dueAt: todo.dueAt,
      completedAt: todo.completedAt,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }));

    const reminderItems = reminders.map((reminder) => ({
      itemId: reminder.id,
      itemKind: 'pet_reminder',
      userId: reminder.userId,
      petId: reminder.petId,
      pet: reminder.pet,
      title: reminder.title,
      description: reminder.description,
      priority: reminder.priority,
      status: reminder.status,
      tags: [],
      scheduledAt: reminder.scheduledAt,
      dueAt: reminder.dueAt,
      completedAt: null,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      // 提醒特有字段
      snoozeUntil: reminder.snoozeUntil,
      repeatRule: reminder.repeatRule,
      timezone: reminder.timezone,
    }));

    // 合并并排序
    let allItems = [...todoItems, ...reminderItems];

    // 按优先级和时间排序
    allItems.sort((a, b) => {
      // 优先级排序（urgent > high > medium > low）
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // 时间排序（较早的在前）
      const aTime = a.scheduledAt || a.dueAt || a.createdAt;
      const bTime = b.scheduledAt || b.dueAt || b.createdAt;
      return aTime - bTime;
    });

    // 分页
    const total = allItems.length;
    const data = allItems.slice(offset, offset + limit);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to get calendar items: ${error.message}`, { userId });
  }
}

/**
 * 获取用户今日的日历项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 今日日历项目列表
 */
export async function getTodayCalendarItems(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await getCalendarItems({
      userId,
      startDate: today,
      endDate: tomorrow,
      status: 'pending',
      limit: 1000, // 今日项目不分页
      offset: 0,
    });

    return result.data;
  } catch (error) {
    throw new DatabaseError(`Failed to get today's calendar items: ${error.message}`, { userId });
  }
}

/**
 * 获取用户本周的日历项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 本周日历项目列表
 */
export async function getWeekCalendarItems(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取本周的开始（周一）
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today);
    weekStart.setDate(diff);
    
    // 获取本周的结束（周日）
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const result = await getCalendarItems({
      userId,
      startDate: weekStart,
      endDate: weekEnd,
      limit: 1000, // 本周项目不分页
      offset: 0,
    });

    return result.data;
  } catch (error) {
    throw new DatabaseError(`Failed to get week calendar items: ${error.message}`, { userId });
  }
}

/**
 * 获取逾期的日历项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 逾期日历项目列表
 */
export async function getOverdueCalendarItems(userId) {
  try {
    const now = new Date();

    // 获取逾期的 todos
    const overdueTodos = await prisma.userTodo.findMany({
      where: {
        userId,
        status: 'pending',
        deletedAt: null,
        dueAt: { lt: now },
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    // 获取逾期的 reminders
    const overdueReminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        deletedAt: null,
        dueAt: { lt: now },
        AND: [
          {
            OR: [
              { petId: null },
              {
                pet: {
                  OR: [
                    { primaryOwnerId: userId },
                    { owners: { some: { userId } } },
                  ],
                },
              },
            ],
          },
        ],
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    // 转换为统一格式并合并
    const todoItems = overdueTodos.map((todo) => ({
      itemId: todo.id,
      itemKind: 'user_todo',
      userId: todo.userId,
      petId: todo.petId,
      pet: todo.pet,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      status: todo.status,
      tags: todo.tags,
      scheduledAt: todo.scheduledAt,
      dueAt: todo.dueAt,
      completedAt: todo.completedAt,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }));

    const reminderItems = overdueReminders.map((reminder) => ({
      itemId: reminder.id,
      itemKind: 'pet_reminder',
      userId: reminder.userId,
      petId: reminder.petId,
      pet: reminder.pet,
      title: reminder.title,
      description: reminder.description,
      priority: reminder.priority,
      status: reminder.status,
      tags: [],
      scheduledAt: reminder.scheduledAt,
      dueAt: reminder.dueAt,
      completedAt: null,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      snoozeUntil: reminder.snoozeUntil,
      repeatRule: reminder.repeatRule,
      timezone: reminder.timezone,
    }));

    return [...todoItems, ...reminderItems];
  } catch (error) {
    throw new DatabaseError(`Failed to get overdue calendar items: ${error.message}`, { userId });
  }
}

/**
 * 获取日历统计信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getCalendarStats(userId) {
  try {
    const [todoStats, reminderStats] = await Promise.all([
      prisma.userTodo.groupBy({
        by: ['status'],
        where: { userId, deletedAt: null },
        _count: true,
      }),
      prisma.reminder.groupBy({
        by: ['status'],
        where: { userId, deletedAt: null },
        _count: true,
      }),
    ]);

    // 获取逾期数量
    const now = new Date();
    const [overdueTodoCount, overdueReminderCount] = await Promise.all([
      prisma.userTodo.count({
        where: {
          userId,
          status: 'pending',
          deletedAt: null,
          dueAt: { lt: now },
        },
      }),
      prisma.reminder.count({
        where: {
          userId,
          status: 'pending',
          deletedAt: null,
          dueAt: { lt: now },
        },
      }),
    ]);

    // 合并统计
    const statsByStatus = {};
    todoStats.forEach((stat) => {
      statsByStatus[stat.status] = (statsByStatus[stat.status] || 0) + stat._count;
    });
    reminderStats.forEach((stat) => {
      statsByStatus[stat.status] = (statsByStatus[stat.status] || 0) + stat._count;
    });

    return {
      total: Object.values(statsByStatus).reduce((sum, count) => sum + count, 0),
      pending: statsByStatus.pending || 0,
      done: statsByStatus.done || 0,
      archived: statsByStatus.archived || 0,
      overdue: overdueTodoCount + overdueReminderCount,
      byType: {
        todos: todoStats.reduce((sum, stat) => sum + stat._count, 0),
        reminders: reminderStats.reduce((sum, stat) => sum + stat._count, 0),
      },
    };
  } catch (error) {
    throw new DatabaseError(`Failed to get calendar stats: ${error.message}`, { userId });
  }
}

