/**
 * Pet Service - 宠物相关的 API 调用
 */

import { post, get, patch, del } from './api.js';

/**
 * 获取用户的所有宠物
 * @param {string} token - JWT token
 * @returns {Promise<Array>} 宠物列表
 */
export async function getUserPets(token) {
  const response = await get('/pets', token);
  return response.data;
}

/**
 * 获取宠物详情
 * @param {string} petId - 宠物 ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 宠物详情
 */
export async function getPetById(petId, token) {
  const response = await get(`/pets/${petId}`, token);
  return response.data;
}

/**
 * 创建宠物
 * @param {Object} petData - 宠物数据
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 创建的宠物
 */
export async function createPet(petData, token) {
  const response = await post('/pets', petData, token);
  return response.data;
}

/**
 * 更新宠物信息
 * @param {string} petId - 宠物 ID
 * @param {Object} petData - 更新数据
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 更新后的宠物
 */
export async function updatePet(petId, petData, token) {
  const response = await patch(`/pets/${petId}`, petData, token);
  return response.data;
}

/**
 * 删除宠物（软删除）
 * @param {string} petId - 宠物 ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>}
 */
export async function deletePet(petId, token) {
  const response = await del(`/pets/${petId}`, token);
  return response;
}

/**
 * 添加宠物共享成员
 * @param {string} petId - 宠物 ID
 * @param {Object} ownerData - { userId, role, note }
 * @param {string} token - JWT token
 * @returns {Promise<Object>}
 */
export async function addPetOwner(petId, ownerData, token) {
  const response = await post(`/pets/${petId}/owners`, ownerData, token);
  return response.data;
}

/**
 * 移除宠物共享成员
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 用户 ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>}
 */
export async function removePetOwner(petId, userId, token) {
  const response = await del(`/pets/${petId}/owners/${userId}`, token);
  return response;
}

export default {
  getUserPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  addPetOwner,
  removePetOwner,
};

