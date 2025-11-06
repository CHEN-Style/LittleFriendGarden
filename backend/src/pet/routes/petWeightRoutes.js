/**
 * Pet Weight Routes - 宠物体重记录路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as weightController from '../controllers/petWeightController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/weights/batch
 * @desc    批量创建体重记录
 * @access  Private
 */
router.post('/batch', asyncHandler(weightController.createWeightBatch));

/**
 * @route   GET /api/weights/:id
 * @desc    获取体重记录详情
 * @access  Private
 */
router.get('/:id', asyncHandler(weightController.getWeightById));

/**
 * @route   PATCH /api/weights/:id
 * @desc    更新体重记录
 * @access  Private
 */
router.patch('/:id', asyncHandler(weightController.updateWeight));

/**
 * @route   DELETE /api/weights/:id
 * @desc    删除体重记录（软删除）
 * @access  Private
 */
router.delete('/:id', asyncHandler(weightController.deleteWeight));

export default router;

