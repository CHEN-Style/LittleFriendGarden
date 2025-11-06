/**
 * Pet Routes - 宠物路由
 */

import express from 'express';
import { asyncHandler } from '../../middleware/index.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as petController from '../controllers/petController.js';
import * as weightController from '../controllers/petWeightController.js';
import * as feedingController from '../controllers/petFeedingController.js';
import * as medicalController from '../controllers/petMedicalController.js';
import * as reminderController from '../controllers/reminderController.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   POST /api/pets
 * @desc    创建新宠物
 * @access  Private
 */
router.post('/', asyncHandler(petController.createPet));

/**
 * @route   GET /api/pets
 * @desc    获取当前用户的所有宠物
 * @access  Private
 */
router.get('/', asyncHandler(petController.getUserPets));

/**
 * @route   GET /api/pets/:id
 * @desc    获取宠物详情
 * @access  Private
 */
router.get('/:id', asyncHandler(petController.getPetById));

/**
 * @route   PATCH /api/pets/:id
 * @desc    更新宠物信息
 * @access  Private (仅 primary owner)
 */
router.patch('/:id', asyncHandler(petController.updatePet));

/**
 * @route   DELETE /api/pets/:id
 * @desc    删除宠物（软删除）
 * @access  Private (仅 primary owner)
 */
router.delete('/:id', asyncHandler(petController.deletePet));

/**
 * @route   POST /api/pets/:id/owners
 * @desc    添加宠物共享成员
 * @access  Private (仅 owner)
 */
router.post('/:id/owners', asyncHandler(petController.addPetOwner));

/**
 * @route   DELETE /api/pets/:id/owners/:userId
 * @desc    移除宠物共享成员
 * @access  Private (仅 primary owner)
 */
router.delete('/:id/owners/:userId', asyncHandler(petController.removePetOwner));

// ==================== 宠物子资源路由 ====================

/**
 * @route   GET /api/pets/:petId/weights
 * @desc    获取宠物的体重记录
 * @access  Private
 */
router.get('/:petId/weights', asyncHandler(weightController.getPetWeights));

/**
 * @route   GET /api/pets/:petId/weights/latest
 * @desc    获取最新体重记录
 * @access  Private
 */
router.get('/:petId/weights/latest', asyncHandler(weightController.getLatestWeight));

/**
 * @route   GET /api/pets/:petId/weights/stats
 * @desc    获取体重统计
 * @access  Private
 */
router.get('/:petId/weights/stats', asyncHandler(weightController.getWeightStats));

/**
 * @route   POST /api/pets/:petId/weights
 * @desc    为宠物创建体重记录
 * @access  Private
 */
router.post('/:petId/weights', asyncHandler(weightController.createWeight));

/**
 * @route   GET /api/pets/:petId/feedings
 * @desc    获取宠物的喂养记录
 * @access  Private
 */
router.get('/:petId/feedings', asyncHandler(feedingController.getPetFeedings));

/**
 * @route   POST /api/pets/:petId/feedings
 * @desc    为宠物创建喂养记录
 * @access  Private
 */
router.post('/:petId/feedings', asyncHandler(feedingController.createFeeding));

/**
 * @route   GET /api/pets/:petId/medicals
 * @desc    获取宠物的医疗记录
 * @access  Private
 */
router.get('/:petId/medicals', asyncHandler(medicalController.getPetMedicals));

/**
 * @route   POST /api/pets/:petId/medicals
 * @desc    为宠物创建医疗记录
 * @access  Private
 */
router.post('/:petId/medicals', asyncHandler(medicalController.createMedical));

/**
 * @route   GET /api/pets/:petId/medicals/vaccines/upcoming
 * @desc    获取宠物即将到期的疫苗
 * @access  Private
 */
router.get('/:petId/medicals/vaccines/upcoming', asyncHandler(medicalController.getUpcomingVaccines));

/**
 * @route   GET /api/pets/:petId/medicals/stats
 * @desc    获取医疗统计（按类型）
 * @access  Private
 */
router.get('/:petId/medicals/stats', asyncHandler(medicalController.getMedicalStatsByType));

/**
 * @route   GET /api/pets/:petId/medicals/cost
 * @desc    获取医疗总费用统计
 * @access  Private
 */
router.get('/:petId/medicals/cost', asyncHandler(medicalController.getTotalCost));

/**
 * @route   GET /api/pets/:petId/reminders
 * @desc    获取宠物的提醒
 * @access  Private
 */
router.get('/:petId/reminders', asyncHandler(reminderController.getPetReminders));

/**
 * @route   POST /api/pets/:petId/reminders
 * @desc    为宠物创建提醒
 * @access  Private
 */
router.post('/:petId/reminders', asyncHandler(reminderController.createReminder));

export default router;

