/**
 * Topic Routes - 话题路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as topicController from '../controllers/topicController.js';

const router = express.Router();

/**
 * @route   GET /api/topics/search
 * @desc    搜索话题
 * @access  Public
 */
router.get('/search', asyncHandler(topicController.searchTopics));

/**
 * @route   GET /api/topics/slug/:slug
 * @desc    根据 slug 获取话题详情
 * @access  Public
 */
router.get('/slug/:slug', asyncHandler(topicController.getTopicBySlug));

/**
 * @route   POST /api/topics
 * @desc    创建话题
 * @access  Private
 */
router.post('/', authenticate, asyncHandler(topicController.createTopic));

/**
 * @route   GET /api/topics
 * @desc    获取话题列表
 * @access  Public
 */
router.get('/', asyncHandler(topicController.getTopics));

/**
 * @route   GET /api/topics/:id
 * @desc    获取话题详情
 * @access  Public
 */
router.get('/:id', asyncHandler(topicController.getTopicById));

/**
 * @route   PATCH /api/topics/:id
 * @desc    更新话题
 * @access  Private (仅创建者)
 */
router.patch('/:id', authenticate, asyncHandler(topicController.updateTopic));

/**
 * @route   DELETE /api/topics/:id
 * @desc    删除话题（软删除）
 * @access  Private (仅创建者)
 */
router.delete('/:id', authenticate, asyncHandler(topicController.deleteTopic));

export default router;

