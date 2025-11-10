/**
 * Comment Routes - 评论路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as commentController from '../controllers/commentController.js';
import * as reactionController from '../controllers/reactionController.js';

const router = express.Router();

/**
 * @route   POST /api/comments
 * @desc    创建评论
 * @access  Private
 */
router.post('/', authenticate, asyncHandler(commentController.createComment));

/**
 * @route   GET /api/comments/:id
 * @desc    获取评论详情
 * @access  Public
 */
router.get('/:id', asyncHandler(commentController.getCommentById));

/**
 * @route   PATCH /api/comments/:id
 * @desc    更新评论
 * @access  Private (仅作者)
 */
router.patch('/:id', authenticate, asyncHandler(commentController.updateComment));

/**
 * @route   DELETE /api/comments/:id
 * @desc    删除评论（软删除）
 * @access  Private (作者或帖子作者)
 */
router.delete('/:id', authenticate, asyncHandler(commentController.deleteComment));

// ==================== 评论子资源路由 ====================

/**
 * @route   POST /api/comments/:commentId/reactions
 * @desc    为评论添加点赞
 * @access  Private
 */
router.post('/:commentId/reactions', authenticate, asyncHandler(reactionController.addCommentReaction));

/**
 * @route   DELETE /api/comments/:commentId/reactions
 * @desc    移除评论点赞
 * @access  Private
 */
router.delete('/:commentId/reactions', authenticate, asyncHandler(reactionController.removeCommentReaction));

/**
 * @route   GET /api/comments/:commentId/reactions
 * @desc    获取评论的点赞列表
 * @access  Public
 */
router.get('/:commentId/reactions', asyncHandler(reactionController.getCommentReactions));

/**
 * @route   GET /api/comments/:commentId/reactions/stats
 * @desc    获取评论的点赞统计
 * @access  Public
 */
router.get('/:commentId/reactions/stats', asyncHandler(reactionController.getCommentReactionStats));

export default router;

