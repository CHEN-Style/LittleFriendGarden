/**
 * Report Routes - 举报路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/reports/posts
 * @desc    举报帖子
 * @access  Private
 */
router.post('/posts', asyncHandler(reportController.createPostReport));

/**
 * @route   POST /api/reports/comments
 * @desc    举报评论
 * @access  Private
 */
router.post('/comments', asyncHandler(reportController.createCommentReport));

/**
 * @route   GET /api/reports/posts
 * @desc    获取帖子举报列表（管理员功能）
 * @access  Private (Admin)
 */
router.get('/posts', asyncHandler(reportController.getPostReports));

/**
 * @route   GET /api/reports/comments
 * @desc    获取评论举报列表（管理员功能）
 * @access  Private (Admin)
 */
router.get('/comments', asyncHandler(reportController.getCommentReports));

/**
 * @route   GET /api/reports/posts/:id
 * @desc    获取帖子举报详情（管理员功能）
 * @access  Private (Admin)
 */
router.get('/posts/:id', asyncHandler(reportController.getPostReportById));

/**
 * @route   GET /api/reports/comments/:id
 * @desc    获取评论举报详情（管理员功能）
 * @access  Private (Admin)
 */
router.get('/comments/:id', asyncHandler(reportController.getCommentReportById));

/**
 * @route   PATCH /api/reports/posts/:id
 * @desc    处理帖子举报（管理员功能）
 * @access  Private (Admin)
 */
router.patch('/posts/:id', asyncHandler(reportController.handlePostReport));

/**
 * @route   PATCH /api/reports/comments/:id
 * @desc    处理评论举报（管理员功能）
 * @access  Private (Admin)
 */
router.patch('/comments/:id', asyncHandler(reportController.handleCommentReport));

export default router;

