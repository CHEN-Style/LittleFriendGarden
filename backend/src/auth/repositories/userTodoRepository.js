/**
 * UserTodo Repository - 用户待办数据访问层
 * 职责：封装所有与 UserTodo 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建待办
 * @param {Object} todoData - 待办数据
 * @returns {Promise<Object>} 创建的待办
 */
export async function createTodo(todoData) {
  try {
    return await prisma.userTodo.create({
      data: todoData,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create todo: ${error.message}`, { todoData });
  }
}

/**
 * 批量创建待办
 * @param {Array<Object>} todoDataArray - 待办数据数组
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createTodoBatch(todoDataArray) {
  try {
    return await prisma.userTodo.createMany({
      data: todoDataArray,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch create todos: ${error.message}`, {
      count: todoDataArray.length,
    });
  }
}

/**
 * 根据 ID 查找待办
 * @param {string} id - 待办 ID
 * @returns {Promise<Object|null>} 待办
 */
export async function findTodoById(id) {
  try {
    return await prisma.userTodo.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find todo: ${error.message}`, { id });
  }
}

/**
 * 根据用户 ID 查找待办列表（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {string} options.userId - 用户 ID
 * @param {string} [options.status] - 状态（pending/done/archived）
 * @param {string} [options.priority] - 优先级（low/medium/high/urgent）
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findTodosByUserId({
  userId,
  status,
  priority,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}) {
  try {
    const where = {
      userId,
      deletedAt: null,
    };

    // 状态过滤
    if (status) {
      where.status = status;
    }

    // 优先级过滤
    if (priority) {
      where.priority = priority;
    }

    // 时间范围过滤（按 scheduledAt 过滤）
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = startDate;
      if (endDate) where.scheduledAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.userTodo.findMany({
        where,
        include: {
          pet: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.userTodo.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find todos by user: ${error.message}`, { userId });
  }
}

/**
 * 获取今日待办
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 今日待办列表
 */
export async function getTodayTodos(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.userTodo.findMany({
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
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get today's todos: ${error.message}`, { userId });
  }
}

/**
 * 获取逾期待办
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 逾期待办列表
 */
export async function getOverdueTodos(userId) {
  try {
    return await prisma.userTodo.findMany({
      where: {
        userId,
        status: 'pending',
        deletedAt: null,
        dueAt: { lt: new Date() },
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ dueAt: 'asc' }],
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get overdue todos: ${error.message}`, { userId });
  }
}

/**
 * 获取待办统计信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getTodoStats(userId) {
  try {
    const [total, pending, done, archived, overdue] = await Promise.all([
      prisma.userTodo.count({
        where: { userId, deletedAt: null },
      }),
      prisma.userTodo.count({
        where: { userId, status: 'pending', deletedAt: null },
      }),
      prisma.userTodo.count({
        where: { userId, status: 'done', deletedAt: null },
      }),
      prisma.userTodo.count({
        where: { userId, status: 'archived', deletedAt: null },
      }),
      prisma.userTodo.count({
        where: {
          userId,
          status: 'pending',
          deletedAt: null,
          dueAt: { lt: new Date() },
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
    throw new DatabaseError(`Failed to get todo stats: ${error.message}`, { userId });
  }
}

/**
 * 更新待办
 * @param {string} id - 待办 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的待办
 */
export async function updateTodo(id, updateData) {
  try {
    return await prisma.userTodo.update({
      where: { id },
      data: updateData,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update todo: ${error.message}`, { id });
  }
}

/**
 * 完成待办
 * @param {string} id - 待办 ID
 * @returns {Promise<Object>} 更新后的待办
 */
export async function completeTodo(id) {
  try {
    return await prisma.userTodo.update({
      where: { id },
      data: {
        status: 'done',
        completedAt: new Date(),
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to complete todo: ${error.message}`, { id });
  }
}

/**
 * 归档待办
 * @param {string} id - 待办 ID
 * @returns {Promise<Object>} 更新后的待办
 */
export async function archiveTodo(id) {
  try {
    return await prisma.userTodo.update({
      where: { id },
      data: {
        status: 'archived',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to archive todo: ${error.message}`, { id });
  }
}

/**
 * 软删除待办
 * @param {string} id - 待办 ID
 * @returns {Promise<Object>} 删除的待办
 */
export async function softDeleteTodo(id) {
  try {
    return await prisma.userTodo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete todo: ${error.message}`, { id });
  }
}

/**
 * 硬删除待办（仅用于测试/清理）
 * @param {string} id - 待办 ID
 * @returns {Promise<Object>} 删除的待办
 */
export async function hardDeleteTodo(id) {
  try {
    return await prisma.userTodo.delete({
      where: { id },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to hard delete todo: ${error.message}`, { id });
  }
}

/**
 * 批量完成待办
 * @param {Array<string>} ids - 待办 ID 数组
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchCompleteTodos(ids) {
  try {
    return await prisma.userTodo.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'done',
        completedAt: new Date(),
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch complete todos: ${error.message}`, { count: ids.length });
  }
}

/**
 * 批量归档待办
 * @param {Array<string>} ids - 待办 ID 数组
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchArchiveTodos(ids) {
  try {
    return await prisma.userTodo.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'archived',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch archive todos: ${error.message}`, { count: ids.length });
  }
}

