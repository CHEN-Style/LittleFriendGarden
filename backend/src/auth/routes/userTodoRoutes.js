/**
 * UserTodo Routes - 用户待办路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as todoController from '../controllers/userTodoController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/todos/batch
 * @desc    批量创建待办
 * @access  Private
 */
router.post('/batch', asyncHandler(todoController.createTodoBatch));

/**
 * @route   POST /api/todos/batch/complete
 * @desc    批量完成待办
 * @access  Private
 */
router.post('/batch/complete', asyncHandler(todoController.batchCompleteTodos));

/**
 * @route   POST /api/todos/batch/archive
 * @desc    批量归档待办
 * @access  Private
 */
router.post('/batch/archive', asyncHandler(todoController.batchArchiveTodos));

/**
 * @route   GET /api/todos/today
 * @desc    获取今日待办
 * @access  Private
 */
router.get('/today', asyncHandler(todoController.getTodayTodos));

/**
 * @route   GET /api/todos/overdue
 * @desc    获取逾期待办
 * @access  Private
 */
router.get('/overdue', asyncHandler(todoController.getOverdueTodos));

/**
 * @route   GET /api/todos/stats
 * @desc    获取待办统计
 * @access  Private
 */
router.get('/stats', asyncHandler(todoController.getTodoStats));

/**
 * @route   GET /api/todos/:id
 * @desc    获取待办详情
 * @access  Private
 */
router.get('/:id', asyncHandler(todoController.getTodoById));

/**
 * @route   GET /api/todos
 * @desc    获取当前用户的待办列表
 * @access  Private
 */
router.get('/', asyncHandler(todoController.getUserTodos));

/**
 * @route   POST /api/todos
 * @desc    创建待办
 * @access  Private
 */
router.post('/', asyncHandler(todoController.createTodo));

/**
 * @route   PATCH /api/todos/:id
 * @desc    更新待办
 * @access  Private
 */
router.patch('/:id', asyncHandler(todoController.updateTodo));

/**
 * @route   POST /api/todos/:id/complete
 * @desc    完成待办
 * @access  Private
 */
router.post('/:id/complete', asyncHandler(todoController.completeTodo));

/**
 * @route   POST /api/todos/:id/archive
 * @desc    归档待办
 * @access  Private
 */
router.post('/:id/archive', asyncHandler(todoController.archiveTodo));

/**
 * @route   DELETE /api/todos/:id
 * @desc    删除待办（软删除）
 * @access  Private
 */
router.delete('/:id', asyncHandler(todoController.deleteTodo));

export default router;

