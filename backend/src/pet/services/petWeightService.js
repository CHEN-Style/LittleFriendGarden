/**
 * Pet Weight Service - 宠物体重记录业务逻辑层
 * 处理体重记录相关的业务逻辑，协调 Repository 和权限校验
 */

import * as weightRepo from '../repositories/petWeightRepository.js';
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
 * 创建体重记录
 * @param {Object} data - 体重数据 { petId, measuredAt, weightKg, source?, note? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的体重记录
 */
export async function createWeight(data, userId) {
  const { petId, measuredAt, weightKg, source, note } = data;

  // 验证必填字段
  if (!petId || !measuredAt || weightKg === undefined || weightKg === null) {
    throw new ValidationError('petId, measuredAt, and weightKg are required');
  }

  // 验证体重值（触发数据库 CHECK 约束，但提前验证可提供更好的错误消息）
  if (weightKg <= 0 || weightKg > 999.99) {
    throw new ValidationError('Weight must be between 0 and 999.99 kg');
  }

  // 验证 source 枚举
  if (source && !['home_scale', 'vet_visit', 'estimate'].includes(source)) {
    throw new ValidationError('Invalid source. Must be: home_scale, vet_visit, or estimate');
  }

  // 检查权限
  await checkPetAccess(petId, userId);

  // 创建体重记录
  const weightData = {
    petId,
    measuredAt: new Date(measuredAt),
    weightKg,
    source,
    note,
  };

  return await weightRepo.createWeight(weightData);
}

/**
 * 批量创建体重记录
 * @param {Array<Object>} dataArray - 体重数据数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createWeightBatch(dataArray, userId) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new ValidationError('Invalid data array');
  }

  // 检查所有宠物的访问权限
  const petIds = [...new Set(dataArray.map((d) => d.petId))];
  await Promise.all(petIds.map((petId) => checkPetAccess(petId, userId)));

  // 准备数据
  const weightDataArray = dataArray.map((d) => ({
    petId: d.petId,
    measuredAt: new Date(d.measuredAt),
    weightKg: d.weightKg,
    source: d.source,
    note: d.note,
  }));

  return await weightRepo.createWeightBatch(weightDataArray);
}

/**
 * 获取体重记录
 * @param {string} id - 体重记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 体重记录
 */
export async function getWeightById(id, userId) {
  const weight = await weightRepo.findWeightById(id);

  if (!weight || weight.deletedAt) {
    throw new NotFoundError('Weight record not found');
  }

  // 检查权限
  await checkPetAccess(weight.petId, userId);

  return weight;
}

/**
 * 获取宠物的体重记录列表
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项 { startDate?, endDate?, limit?, offset? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPetWeights(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await weightRepo.findWeightsByPetId({
    petId,
    ...options,
  });
}

/**
 * 获取最新体重
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object|null>} 最新体重记录
 */
export async function getLatestWeight(petId, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await weightRepo.findLatestWeight(petId);
}

/**
 * 获取体重统计
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项 { startDate?, endDate? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 统计数据
 */
export async function getWeightStats(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await weightRepo.getWeightStats(petId, options.startDate, options.endDate);
}

/**
 * 更新体重记录
 * @param {string} id - 体重记录 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的体重记录
 */
export async function updateWeight(id, data, userId) {
  // 先检查权限
  const weight = await getWeightById(id, userId);

  const { measuredAt, weightKg, source, note } = data;

  // 验证体重值
  if (weightKg !== undefined && (weightKg <= 0 || weightKg > 999.99)) {
    throw new ValidationError('Weight must be between 0 and 999.99 kg');
  }

  // 验证 source 枚举
  if (source && !['home_scale', 'vet_visit', 'estimate'].includes(source)) {
    throw new ValidationError('Invalid source. Must be: home_scale, vet_visit, or estimate');
  }

  // 准备更新数据
  const updateData = {
    ...(measuredAt && { measuredAt: new Date(measuredAt) }),
    ...(weightKg !== undefined && { weightKg }),
    ...(source !== undefined && { source }),
    ...(note !== undefined && { note }),
  };

  return await weightRepo.updateWeight(id, updateData);
}

/**
 * 删除体重记录（软删除）
 * @param {string} id - 体重记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function deleteWeight(id, userId) {
  // 先检查权限
  await getWeightById(id, userId);

  await weightRepo.softDeleteWeight(id);
}

