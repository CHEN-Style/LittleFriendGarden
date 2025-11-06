/**
 * Pet Feeding Routes - 宠物喂养记录路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as feedingController from '../controllers/petFeedingController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/feedings/batch
 * @desc    批量创建喂养记录
 * @access  Private
 */
router.post('/batch', asyncHandler(feedingController.createFeedingBatch));

/**
 * @route   GET /api/feedings/my
 * @desc    获取当前用户的喂养记录列表
 * @access  Private
 */
router.get('/my', asyncHandler(feedingController.getUserFeedings));

/**
 * @route   GET /api/feedings/:id
 * @desc    获取喂养记录详情
 * @access  Private
 */
router.get('/:id', asyncHandler(feedingController.getFeedingById));

/**
 * @route   PATCH /api/feedings/:id
 * @desc    更新喂养记录
 * @access  Private (仅记录创建者)
 */
router.patch('/:id', asyncHandler(feedingController.updateFeeding));

/**
 * @route   DELETE /api/feedings/:id
 * @desc    删除喂养记录（软删除）
 * @access  Private (仅记录创建者)
 */
router.delete('/:id', asyncHandler(feedingController.deleteFeeding));

export default router;

