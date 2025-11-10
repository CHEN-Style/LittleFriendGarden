/**
 * Post Routes - 帖子路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as postController from '../controllers/postController.js';
import * as commentController from '../controllers/commentController.js';
import * as reactionController from '../controllers/reactionController.js';

const router = express.Router();

// 可选认证中间件（用于公开路由，但允许登录用户）
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
};

/**
 * @route   GET /api/posts/search
 * @desc    搜索帖子
 * @access  Public
 */
router.get('/search', asyncHandler(postController.searchPosts));

/**
 * @route   POST /api/posts
 * @desc    创建帖子
 * @access  Private
 */
router.post('/', authenticate, asyncHandler(postController.createPost));

/**
 * @route   GET /api/posts
 * @desc    获取帖子列表
 * @access  Public
 */
router.get('/', optionalAuth, asyncHandler(postController.getPosts));

/**
 * @route   GET /api/posts/:id
 * @desc    获取帖子详情
 * @access  Public / Private
 */
router.get('/:id', optionalAuth, asyncHandler(postController.getPostById));

/**
 * @route   PATCH /api/posts/:id
 * @desc    更新帖子
 * @access  Private (仅作者)
 */
router.patch('/:id', authenticate, asyncHandler(postController.updatePost));

/**
 * @route   DELETE /api/posts/:id
 * @desc    删除帖子（软删除）
 * @access  Private (仅作者)
 */
router.delete('/:id', authenticate, asyncHandler(postController.deletePost));

// ==================== 帖子子资源路由 ====================

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    获取帖子的评论列表
 * @access  Public
 */
router.get('/:postId/comments', asyncHandler(commentController.getPostComments));

/**
 * @route   POST /api/posts/:postId/reactions
 * @desc    为帖子添加点赞
 * @access  Private
 */
router.post('/:postId/reactions', authenticate, asyncHandler(reactionController.addPostReaction));

/**
 * @route   DELETE /api/posts/:postId/reactions
 * @desc    移除帖子点赞
 * @access  Private
 */
router.delete('/:postId/reactions', authenticate, asyncHandler(reactionController.removePostReaction));

/**
 * @route   GET /api/posts/:postId/reactions
 * @desc    获取帖子的点赞列表
 * @access  Public
 */
router.get('/:postId/reactions', asyncHandler(reactionController.getPostReactions));

/**
 * @route   GET /api/posts/:postId/reactions/stats
 * @desc    获取帖子的点赞统计
 * @access  Public
 */
router.get('/:postId/reactions/stats', asyncHandler(reactionController.getPostReactionStats));

export default router;

