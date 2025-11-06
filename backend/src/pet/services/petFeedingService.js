/**
 * Pet Feeding Service - 宠物喂养记录业务逻辑层
 * 处理喂养记录相关的业务逻辑
 */

import * as feedingRepo from '../repositories/petFeedingRepository.js';
import * as petRepo from '../repositories/petRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 校验用户对宠物的访问权限
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 宠物对象
 */
async function checkPetAccess(petId, userId) {
  const pet = await petRepo.findPetById(petId);

  if (!pet || pet.deletedAt) {
    throw new NotFoundError('Pet not found');
  }

  const hasAccess = pet.owners.some((owner) => owner.userId === userId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this pet');
  }

  return pet;
}

/**
 * 创建喂养记录
 * @param {Object} data - 喂养数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的喂养记录
 */
export async function createFeeding(data, userId) {
  const { petId, fedAt, foodType, amountG, caloriesKcal, note } = data;

  // 验证必填字段
  if (!petId || !fedAt) {
    throw new ValidationError('petId and fedAt are required');
  }

  // 验证数值范围
  if (amountG !== undefined && amountG !== null && (amountG <= 0 || amountG > 9999)) {
    throw new ValidationError('Amount must be between 0 and 9999 grams');
  }

  if (caloriesKcal !== undefined && caloriesKcal !== null && (caloriesKcal <= 0 || caloriesKcal > 9999)) {
    throw new ValidationError('Calories must be between 0 and 9999 kcal');
  }

  // 检查权限
  await checkPetAccess(petId, userId);

  // 创建喂养记录
  const feedingData = {
    petId,
    userId,
    fedAt: new Date(fedAt),
    foodType,
    amountG,
    caloriesKcal,
    note,
  };

  return await feedingRepo.createFeeding(feedingData);
}

/**
 * 批量创建喂养记录
 * @param {Array<Object>} dataArray - 喂养数据数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createFeedingBatch(dataArray, userId) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new ValidationError('Invalid data array');
  }

  // 检查所有宠物的访问权限
  const petIds = [...new Set(dataArray.map((d) => d.petId))];
  await Promise.all(petIds.map((petId) => checkPetAccess(petId, userId)));

  // 准备数据
  const feedingDataArray = dataArray.map((d) => ({
    petId: d.petId,
    userId,
    fedAt: new Date(d.fedAt),
    foodType: d.foodType,
    amountG: d.amountG,
    caloriesKcal: d.caloriesKcal,
    note: d.note,
  }));

  return await feedingRepo.createFeedingBatch(feedingDataArray);
}

/**
 * 获取喂养记录
 * @param {string} id - 喂养记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 喂养记录
 */
export async function getFeedingById(id, userId) {
  const feeding = await feedingRepo.findFeedingById(id);

  if (!feeding || feeding.deletedAt) {
    throw new NotFoundError('Feeding record not found');
  }

  // 检查权限
  await checkPetAccess(feeding.petId, userId);

  return feeding;
}

/**
 * 获取宠物的喂养记录列表
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPetFeedings(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await feedingRepo.findFeedingsByPetId({
    petId,
    ...options,
  });
}

/**
 * 获取用户的喂养记录列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getUserFeedings(userId, options) {
  return await feedingRepo.findFeedingsByUserId({
    userId,
    ...options,
  });
}

/**
 * 获取日喂养汇总
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项 { startDate?, endDate? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 日汇总数据
 */
export async function getDailyFeedingSummary(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await feedingRepo.getDailyFeedingSummary(petId, options.startDate, options.endDate);
}

/**
 * 获取喂养统计
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项 { startDate?, endDate? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getFeedingStats(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await feedingRepo.getFeedingStats(petId, options.startDate, options.endDate);
}

/**
 * 更新喂养记录
 * @param {string} id - 喂养记录 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的喂养记录
 */
export async function updateFeeding(id, data, userId) {
  // 先检查权限
  const feeding = await getFeedingById(id, userId);

  // 只有记录创建者可以修改
  if (feeding.userId !== userId) {
    throw new ForbiddenError('You can only update your own feeding records');
  }

  const { fedAt, foodType, amountG, caloriesKcal, note } = data;

  // 验证数值范围
  if (amountG !== undefined && (amountG <= 0 || amountG > 9999)) {
    throw new ValidationError('Amount must be between 0 and 9999 grams');
  }

  if (caloriesKcal !== undefined && (caloriesKcal <= 0 || caloriesKcal > 9999)) {
    throw new ValidationError('Calories must be between 0 and 9999 kcal');
  }

  // 准备更新数据
  const updateData = {
    ...(fedAt && { fedAt: new Date(fedAt) }),
    ...(foodType !== undefined && { foodType }),
    ...(amountG !== undefined && { amountG }),
    ...(caloriesKcal !== undefined && { caloriesKcal }),
    ...(note !== undefined && { note }),
  };

  return await feedingRepo.updateFeeding(id, updateData);
}

/**
 * 删除喂养记录（软删除）
 * @param {string} id - 喂养记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function deleteFeeding(id, userId) {
  // 先检查权限
  const feeding = await getFeedingById(id, userId);

  // 只有记录创建者可以删除
  if (feeding.userId !== userId) {
    throw new ForbiddenError('You can only delete your own feeding records');
  }

  await feedingRepo.softDeleteFeeding(id);
}

