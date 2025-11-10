/**
 * UserTodo Controller - 用户待办控制器
 * 处理待办相关的 HTTP 请求
 */

import * as todoService from '../services/userTodoService.js';

/**
 * @route   POST /api/todos
 * @desc    创建待办
 * @access  Private
 */
export async function createTodo(req, res) {
  const userId = req.user.userId;

  const todo = await todoService.createTodo(req.body, userId);

  res.status(201).json({
    success: true,
    data: todo,
  });
}

/**
 * @route   POST /api/todos/batch
 * @desc    批量创建待办
 * @access  Private
 */
export async function createTodoBatch(req, res) {
  const userId = req.user.userId;
  const { todos } = req.body;

  const result = await todoService.createTodoBatch(todos, userId);

  res.status(201).json({
    success: true,
    data: result,
    message: result.message,
  });
}

/**
 * @route   GET /api/todos/:id
 * @desc    获取待办详情
 * @access  Private
 */
export async function getTodoById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const todo = await todoService.getTodoById(id, userId);

  res.json({
    success: true,
    data: todo,
  });
}

/**
 * @route   GET /api/todos
 * @desc    获取当前用户的待办列表
 * @access  Private
 */
export async function getUserTodos(req, res) {
  const userId = req.user.userId;

  const { status, priority, startDate, endDate, limit, offset } = req.query;

  const options = {
    status,
    priority,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await todoService.getUserTodos(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/todos/today
 * @desc    获取今日待办
 * @access  Private
 */
export async function getTodayTodos(req, res) {
  const userId = req.user.userId;

  const todos = await todoService.getTodayTodos(userId);

  res.json({
    success: true,
    data: todos,
  });
}

/**
 * @route   GET /api/todos/overdue
 * @desc    获取逾期待办
 * @access  Private
 */
export async function getOverdueTodos(req, res) {
  const userId = req.user.userId;

  const todos = await todoService.getOverdueTodos(userId);

  res.json({
    success: true,
    data: todos,
  });
}

/**
 * @route   GET /api/todos/stats
 * @desc    获取待办统计
 * @access  Private
 */
export async function getTodoStats(req, res) {
  const userId = req.user.userId;

  const stats = await todoService.getTodoStats(userId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   PATCH /api/todos/:id
 * @desc    更新待办
 * @access  Private
 */
export async function updateTodo(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const todo = await todoService.updateTodo(id, req.body, userId);

  res.json({
    success: true,
    data: todo,
  });
}

/**
 * @route   POST /api/todos/:id/complete
 * @desc    完成待办
 * @access  Private
 */
export async function completeTodo(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const todo = await todoService.completeTodo(id, userId);

  res.json({
    success: true,
    data: todo,
    message: 'Todo completed',
  });
}

/**
 * @route   POST /api/todos/:id/archive
 * @desc    归档待办
 * @access  Private
 */
export async function archiveTodo(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const todo = await todoService.archiveTodo(id, userId);

  res.json({
    success: true,
    data: todo,
    message: 'Todo archived',
  });
}

/**
 * @route   POST /api/todos/batch/complete
 * @desc    批量完成待办
 * @access  Private
 */
export async function batchCompleteTodos(req, res) {
  const userId = req.user.userId;
  const { ids } = req.body;

  const result = await todoService.batchCompleteTodos(ids, userId);

  res.json({
    success: true,
    data: result,
    message: result.message,
  });
}

/**
 * @route   POST /api/todos/batch/archive
 * @desc    批量归档待办
 * @access  Private
 */
export async function batchArchiveTodos(req, res) {
  const userId = req.user.userId;
  const { ids } = req.body;

  const result = await todoService.batchArchiveTodos(ids, userId);

  res.json({
    success: true,
    data: result,
    message: result.message,
  });
}

/**
 * @route   DELETE /api/todos/:id
 * @desc    删除待办（软删除）
 * @access  Private
 */
export async function deleteTodo(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await todoService.deleteTodo(id, userId);

  res.json({
    success: true,
    message: 'Todo deleted successfully',
  });
}

