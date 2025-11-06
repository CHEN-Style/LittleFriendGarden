/**
 * Pet Medical Routes - 宠物医疗记录路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as medicalController from '../controllers/petMedicalController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/medicals/batch
 * @desc    批量创建医疗记录
 * @access  Private
 */
router.post('/batch', asyncHandler(medicalController.createMedicalBatch));

/**
 * @route   GET /api/medicals/vaccines/upcoming
 * @desc    获取所有宠物即将到期的疫苗
 * @access  Private
 */
router.get('/vaccines/upcoming', asyncHandler(medicalController.getAllUpcomingVaccines));

/**
 * @route   GET /api/medicals/my
 * @desc    获取当前用户的医疗记录列表
 * @access  Private
 */
router.get('/my', asyncHandler(medicalController.getUserMedicals));

/**
 * @route   GET /api/medicals/:id
 * @desc    获取医疗记录详情
 * @access  Private
 */
router.get('/:id', asyncHandler(medicalController.getMedicalById));

/**
 * @route   PATCH /api/medicals/:id
 * @desc    更新医疗记录
 * @access  Private (仅记录创建者)
 */
router.patch('/:id', asyncHandler(medicalController.updateMedical));

/**
 * @route   DELETE /api/medicals/:id
 * @desc    删除医疗记录（软删除）
 * @access  Private (仅记录创建者)
 */
router.delete('/:id', asyncHandler(medicalController.deleteMedical));

export default router;

