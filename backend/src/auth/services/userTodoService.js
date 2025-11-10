/**
 * UserTodo Service - 用户待办业务逻辑层
 * 处理待办相关的业务逻辑
 */

import * as todoRepo from '../repositories/userTodoRepository.js';
import * as userRepo from '../repositories/userRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 有效的状态
 */
const VALID_STATUSES = ['pending', 'done', 'archived'];

/**
 * 有效的优先级
 */
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * 创建待办
 * @param {Object} data - 待办数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的待办
 */
export async function createTodo(data, userId) {
  const { petId, title, description, priority, status, tags, scheduledAt, dueAt } = data;

  // 验证必填字段
  if (!title) {
    throw new ValidationError('Title is required');
  }

  // 验证优先级
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    throw new ValidationError(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  // 验证状态
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // 如果关联了宠物，需要验证宠物的访问权限（这里简化处理，实际应该调用 pet service）
  if (petId) {
    // TODO: 验证宠物是否存在且用户有权限访问
  }

  // 准备待办数据
  const todoData = {
    userId,
    petId: petId || null,
    title,
    description: description || null,
    priority: priority || 'medium',
    status: status || 'pending',
    tags: tags || [],
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    dueAt: dueAt ? new Date(dueAt) : null,
  };

  return await todoRepo.createTodo(todoData);
}

/**
 * 批量创建待办
 * @param {Array<Object>} dataArray - 待办数据数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createTodoBatch(dataArray, userId) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new ValidationError('Invalid data array');
  }

  // 准备数据
  const todoDataArray = dataArray.map((d) => ({
    userId,
    petId: d.petId || null,
    title: d.title,
    description: d.description || null,
    priority: d.priority || 'medium',
    status: d.status || 'pending',
    tags: d.tags || [],
    scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
    dueAt: d.dueAt ? new Date(d.dueAt) : null,
  }));

  const result = await todoRepo.createTodoBatch(todoDataArray);
  return {
    count: result.count,
    message: `Created ${result.count} todos`,
  };
}

/**
 * 获取待办
 * @param {string} id - 待办 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 待办
 */
export async function getTodoById(id, userId) {
  const todo = await todoRepo.findTodoById(id);

  if (!todo || todo.deletedAt) {
    throw new NotFoundError('Todo not found');
  }

  // 检查权限
  if (todo.userId !== userId) {
    throw new ForbiddenError('You do not have access to this todo');
  }

  return todo;
}

/**
 * 获取用户的待办列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getUserTodos(userId, options) {
  return await todoRepo.findTodosByUserId({
    userId,
    ...options,
  });
}

/**
 * 获取今日待办
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 今日待办列表
 */
export async function getTodayTodos(userId) {
  return await todoRepo.getTodayTodos(userId);
}

/**
 * 获取逾期待办
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 逾期待办列表
 */
export async function getOverdueTodos(userId) {
  return await todoRepo.getOverdueTodos(userId);
}

/**
 * 获取待办统计
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getTodoStats(userId) {
  return await todoRepo.getTodoStats(userId);
}

/**
 * 更新待办
 * @param {string} id - 待办 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的待办
 */
export async function updateTodo(id, data, userId) {
  // 检查权限
  await getTodoById(id, userId);

  const { title, description, priority, status, tags, scheduledAt, dueAt } = data;

  // 验证优先级
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    throw new ValidationError(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  // 验证状态
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // 准备更新数据
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (status !== undefined) {
    updateData.status = status;
    // 如果状态改为 done，自动设置 completedAt
    if (status === 'done' && !data.completedAt) {
      updateData.completedAt = new Date();
    }
  }
  if (tags !== undefined) updateData.tags = tags;
  if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null;

  return await todoRepo.updateTodo(id, updateData);
}

/**
 * 完成待办
 * @param {string} id - 待办 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的待办
 */
export async function completeTodo(id, userId) {
  // 检查权限
  await getTodoById(id, userId);

  return await todoRepo.completeTodo(id);
}

/**
 * 归档待办
 * @param {string} id - 待办 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的待办
 */
export async function archiveTodo(id, userId) {
  // 检查权限
  await getTodoById(id, userId);

  return await todoRepo.archiveTodo(id);
}

/**
 * 删除待办（软删除）
 * @param {string} id - 待办 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function deleteTodo(id, userId) {
  // 检查权限
  await getTodoById(id, userId);

  await todoRepo.softDeleteTodo(id);
}

/**
 * 批量完成待办
 * @param {Array<string>} ids - 待办 ID 数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchCompleteTodos(ids, userId) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('Invalid ids array');
  }

  // 验证所有待办的所有权
  await Promise.all(ids.map((id) => getTodoById(id, userId)));

  const result = await todoRepo.batchCompleteTodos(ids);
  return {
    count: result.count,
    message: `Completed ${result.count} todos`,
  };
}

/**
 * 批量归档待办
 * @param {Array<string>} ids - 待办 ID 数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量更新结果
 */
export async function batchArchiveTodos(ids, userId) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError('Invalid ids array');
  }

  // 验证所有待办的所有权
  await Promise.all(ids.map((id) => getTodoById(id, userId)));

  const result = await todoRepo.batchArchiveTodos(ids);
  return {
    count: result.count,
    message: `Archived ${result.count} todos`,
  };
}

