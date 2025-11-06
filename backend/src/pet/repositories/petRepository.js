/**
 * Pet Repository - 宠物数据访问层
 * 职责：封装所有与 Pet 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建宠物
 * @param {Object} petData - 宠物数据
 * @returns {Promise<Object>} 创建的宠物
 */
export async function createPet(petData) {
  try {
    return await prisma.pet.create({
      data: petData,
      include: {
        primaryOwner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        owners: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create pet: ${error.message}`, { petData });
  }
}

/**
 * 根据用户ID查找所有宠物
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 宠物列表
 */
export async function findPetsByUserId(userId) {
  try {
    return await prisma.pet.findMany({
      where: {
        deletedAt: null,
        owners: {
          some: {
            userId,
          },
        },
      },
      include: {
        primaryOwner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        owners: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        avatarAsset: {
          select: {
            id: true,
            storageUrl: true,
            mimeType: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find pets by user: ${error.message}`, { userId });
  }
}

/**
 * 根据ID查找宠物
 * @param {string} petId - 宠物ID
 * @returns {Promise<Object|null>} 宠物对象或null
 */
export async function findPetById(petId) {
  try {
    return await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        primaryOwner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        owners: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        avatarAsset: {
          select: {
            id: true,
            storageUrl: true,
            mimeType: true,
            pixelWidth: true,
            pixelHeight: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find pet by id: ${error.message}`, { petId });
  }
}

/**
 * 更新宠物信息
 * @param {string} petId - 宠物ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的宠物
 */
export async function updatePet(petId, updateData) {
  try {
    return await prisma.pet.update({
      where: { id: petId },
      data: updateData,
      include: {
        primaryOwner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        owners: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        avatarAsset: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update pet: ${error.message}`, { petId });
  }
}

/**
 * 软删除宠物
 * @param {string} petId - 宠物ID
 * @returns {Promise<Object>} 删除后的宠物
 */
export async function softDeletePet(petId) {
  try {
    return await prisma.pet.update({
      where: { id: petId },
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to soft delete pet: ${error.message}`, { petId });
  }
}

/**
 * 查找用户是否存在
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 用户对象或null
 */
export async function findUserById(userId) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find user: ${error.message}`, { userId });
  }
}

/**
 * 创建或更新宠物共享成员
 * @param {string} petId - 宠物ID
 * @param {string} userId - 用户ID
 * @param {string} role - 角色
 * @param {string} note - 备注
 * @returns {Promise<Object>} 宠物所有者关系
 */
export async function upsertPetOwner(petId, userId, role, note) {
  try {
    return await prisma.petOwner.upsert({
      where: {
        petId_userId: {
          petId,
          userId,
        },
      },
      create: {
        petId,
        userId,
        role,
        note,
      },
      update: {
        role,
        note,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to upsert pet owner: ${error.message}`, { petId, userId });
  }
}

/**
 * 删除宠物共享成员
 * @param {string} petId - 宠物ID
 * @param {string} userId - 用户ID
 * @returns {Promise<void>}
 */
export async function deletePetOwner(petId, userId) {
  try {
    await prisma.petOwner.delete({
      where: {
        petId_userId: {
          petId,
          userId,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete pet owner: ${error.message}`, { petId, userId });
  }
}

