/**
 * Reaction Routes - 点赞路由
 * 注意：这个路由文件主要用于独立的用户点赞查询
 * 帖子和评论的点赞路由在 postRoutes 和 commentRoutes 中定义
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import * as reactionController from '../controllers/reactionController.js';

const router = express.Router();

/**
 * @route   GET /api/users/:userId/reactions
 * @desc    获取用户的点赞列表
 * @access  Public
 */
router.get('/users/:userId/reactions', asyncHandler(reactionController.getUserReactions));

export default router;

