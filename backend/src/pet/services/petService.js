/**
 * Pet Service - 宠物业务逻辑层
 * 处理宠物相关的业务逻辑，协调 Repository 和工具函数
 */

import * as petRepo from '../repositories/petRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 创建宠物
 * @param {Object} data - 宠物数据
 * @param {string} userId - 创建者 ID
 * @returns {Promise<Object>} 创建的宠物
 */
export async function createPet(data, userId) {
  // 验证输入参数
  console.log('DEBUG petService.createPet:');
  console.log('  data:', data);
  console.log('  typeof data:', typeof data);
  console.log('  Array.isArray(data):', Array.isArray(data));
  console.log('  userId:', userId);
  
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.log('  ❌ Validation failed: Invalid pet data provided');
    throw new ValidationError('Invalid pet data provided');
  }

  const { name, species, breed, sex, birthDate, color, settings } = data;

  // 验证必填字段
  if (!name || !species) {
    throw new ValidationError('Name and species are required');
  }

  // 验证 species 枚举
  validateSpecies(species);

  // 验证 sex 枚举（如果提供）
  if (sex) {
    validateSex(sex);
  }

  // 准备宠物数据
  const petData = {
    name,
    species,
    breed,
    sex,
    birthDate: birthDate ? new Date(birthDate) : null,
    color,
    primaryOwnerId: userId,
    settings: settings || {},
  };

  // 创建宠物（触发器会自动将 primary_owner_id 添加到 pet_owners 表）
  const pet = await petRepo.createPet(petData);

  return pet;
}

/**
 * 获取用户的所有宠物
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 宠物列表
 */
export async function getUserPets(userId) {
  const pets = await petRepo.findPetsByUserId(userId);
  return pets;
}

/**
 * 根据 ID 获取宠物详情
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<Object>} 宠物详情
 */
export async function getPetById(petId, userId) {
  const pet = await petRepo.findPetById(petId);

  if (!pet || pet.deletedAt) {
    throw new NotFoundError('Pet not found');
  }

  // 检查用户是否有权限访问此宠物
  const hasAccess = pet.owners.some((owner) => owner.userId === userId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this pet');
  }

  return pet;
}

/**
 * 更新宠物信息
 * @param {string} petId - 宠物 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<Object>} 更新后的宠物
 */
export async function updatePet(petId, data, userId) {
  // 先检查权限
  const pet = await getPetById(petId, userId);

  // 只有 primary owner 可以修改
  if (pet.primaryOwnerId !== userId) {
    throw new ForbiddenError('Only the primary owner can update pet information');
  }

  const { name, species, breed, sex, birthDate, color, settings } = data;

  // 验证枚举值
  if (species) {
    validateSpecies(species);
  }

  if (sex) {
    validateSex(sex);
  }

  // 准备更新数据
  const updateData = {
    ...(name && { name }),
    ...(species && { species }),
    ...(breed !== undefined && { breed }),
    ...(sex !== undefined && { sex }),
    ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
    ...(color !== undefined && { color }),
    ...(settings && { settings }),
  };

  // 更新宠物
  const updatedPet = await petRepo.updatePet(petId, updateData);

  return updatedPet;
}

/**
 * 删除宠物（软删除）
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<void>}
 */
export async function deletePet(petId, userId) {
  // 先检查权限
  const pet = await getPetById(petId, userId);

  // 只有 primary owner 可以删除
  if (pet.primaryOwnerId !== userId) {
    throw new ForbiddenError('Only the primary owner can delete the pet');
  }

  // 软删除
  await petRepo.softDeletePet(petId);
}

/**
 * 添加宠物共享成员
 * @param {string} petId - 宠物 ID
 * @param {string} targetUserId - 要添加的用户 ID
 * @param {string} role - 角色 ('owner' | 'family' | 'viewer')
 * @param {string} requestUserId - 请求用户 ID
 * @param {string} note - 备注
 * @returns {Promise<Object>} 添加的成员关系
 */
export async function addPetOwner(petId, targetUserId, role, requestUserId, note) {
  // 检查权限
  const pet = await getPetById(petId, requestUserId);

  // 只有 primary owner 和 owner 角色可以添加成员
  const requesterOwnership = pet.owners.find((o) => o.userId === requestUserId);
  if (pet.primaryOwnerId !== requestUserId && requesterOwnership?.role !== 'owner') {
    throw new ForbiddenError('Only owners can add new members');
  }

  // 验证角色
  validateRole(role);

  // 检查目标用户是否存在
  const targetUser = await petRepo.findUserById(targetUserId);

  if (!targetUser) {
    throw new NotFoundError('Target user not found');
  }

  // 添加成员（如果已存在则更新）
  const ownership = await petRepo.upsertPetOwner(petId, targetUserId, role, note);

  return ownership;
}

/**
 * 移除宠物共享成员
 * @param {string} petId - 宠物 ID
 * @param {string} targetUserId - 要移除的用户 ID
 * @param {string} requestUserId - 请求用户 ID
 * @returns {Promise<void>}
 */
export async function removePetOwner(petId, targetUserId, requestUserId) {
  // 检查权限
  const pet = await getPetById(petId, requestUserId);

  // 不能移除 primary owner
  if (targetUserId === pet.primaryOwnerId) {
    throw new ForbiddenError('Cannot remove the primary owner');
  }

  // 只有 primary owner 可以移除成员
  if (pet.primaryOwnerId !== requestUserId) {
    throw new ForbiddenError('Only the primary owner can remove members');
  }

  // 移除成员
  await petRepo.deletePetOwner(petId, targetUserId);
}

// ============================================
// 内部辅助函数
// ============================================

/**
 * 验证 species 枚举
 * @private
 */
function validateSpecies(species) {
  const validSpecies = ['cat', 'dog', 'bird', 'rabbit', 'reptile', 'fish', 'other'];
  if (!validSpecies.includes(species)) {
    throw new ValidationError(`Invalid species. Must be one of: ${validSpecies.join(', ')}`);
  }
}

/**
 * 验证 sex 枚举
 * @private
 */
function validateSex(sex) {
  const validSex = ['male', 'female', 'unknown'];
  if (!validSex.includes(sex)) {
    throw new ValidationError(`Invalid sex. Must be one of: ${validSex.join(', ')}`);
  }
}

/**
 * 验证 role 枚举
 * @private
 */
function validateRole(role) {
  const validRoles = ['owner', 'family', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
}

