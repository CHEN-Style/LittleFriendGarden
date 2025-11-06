/**
 * Pet Controller - 宠物控制器
 * 处理宠物相关的 HTTP 请求
 */

import * as petService from '../services/petService.js';

/**
 * @route   POST /api/pets
 * @desc    创建新宠物
 * @access  Private
 */
export async function createPet(req, res) {
  const userId = req.user.userId;
  const pet = await petService.createPet(req.body, userId);

  res.status(201).json({
    success: true,
    data: pet,
  });
}

/**
 * @route   GET /api/pets
 * @desc    获取当前用户的所有宠物
 * @access  Private
 */
export async function getUserPets(req, res) {
  const userId = req.user.userId;
  const pets = await petService.getUserPets(userId);

  res.json({
    success: true,
    data: pets,
    count: pets.length,
  });
}

/**
 * @route   GET /api/pets/:id
 * @desc    获取宠物详情
 * @access  Private
 */
export async function getPetById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const pet = await petService.getPetById(id, userId);

  res.json({
    success: true,
    data: pet,
  });
}

/**
 * @route   PATCH /api/pets/:id
 * @desc    更新宠物信息
 * @access  Private (仅 primary owner)
 */
export async function updatePet(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const pet = await petService.updatePet(id, req.body, userId);

  res.json({
    success: true,
    data: pet,
  });
}

/**
 * @route   DELETE /api/pets/:id
 * @desc    删除宠物（软删除）
 * @access  Private (仅 primary owner)
 */
export async function deletePet(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await petService.deletePet(id, userId);

  res.json({
    success: true,
    message: 'Pet deleted successfully',
  });
}

/**
 * @route   POST /api/pets/:id/owners
 * @desc    添加宠物共享成员
 * @access  Private (仅 owner)
 */
export async function addPetOwner(req, res) {
  const { id: petId } = req.params;
  const { userId: targetUserId, role, note } = req.body;
  const requestUserId = req.user.userId;

  const ownership = await petService.addPetOwner(
    petId,
    targetUserId,
    role,
    requestUserId,
    note
  );

  res.status(201).json({
    success: true,
    data: ownership,
  });
}

/**
 * @route   DELETE /api/pets/:id/owners/:userId
 * @desc    移除宠物共享成员
 * @access  Private (仅 primary owner)
 */
export async function removePetOwner(req, res) {
  const { id: petId, userId: targetUserId } = req.params;
  const requestUserId = req.user.userId;

  await petService.removePetOwner(petId, targetUserId, requestUserId);

  res.json({
    success: true,
    message: 'Pet owner removed successfully',
  });
}

