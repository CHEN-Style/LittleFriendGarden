/**
 * User Repository - 用户数据访问层
 * 职责：封装所有与 User 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 根据 email 查找用户
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
export async function findUserByEmail(email) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find user by email: ${error.message}`, { email });
  }
}

/**
 * 根据 username 查找用户
 * @param {string} username 
 * @returns {Promise<Object|null>}
 */
export async function findUserByUsername(username) {
  try {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find user by username: ${error.message}`, { username });
  }
}

/**
 * 根据 ID 查找用户
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function findUserById(id) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find user by id: ${error.message}`, { id });
  }
}

/**
 * 创建用户（含资料）
 * @param {Object} userData - { email?, username?, phoneE164?, passwordHash, profile? }
 * @returns {Promise<Object>} 创建的用户对象
 */
export async function createUser(userData) {
  const { email, username, phoneE164, passwordHash, profile } = userData;

  try {
    return await prisma.user.create({
      data: {
        email,
        username,
        phoneE164,
        passwordHash,
        profile: profile
          ? {
              create: {
                displayName: profile.displayName,
                bio: profile.bio,
                avatarUrl: profile.avatarUrl,
              },
            }
          : undefined,
      },
      include: {
        profile: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create user: ${error.message}`, { email, username });
  }
}

/**
 * 更新用户信息
 * @param {string} id 
 * @param {Object} updateData - 可以包含 profile 字段用于更新用户资料
 * @returns {Promise<Object>}
 */
export async function updateUser(id, updateData) {
  try {
    // 如果 updateData 包含 profile，需要转换为 Prisma 嵌套更新语法
    const data = { ...updateData };
    
    if (data.profile) {
      const profileData = data.profile;
      delete data.profile;
      
      // 使用 upsert：如果 profile 不存在则创建，存在则更新
      data.profile = {
        upsert: {
          create: profileData,
          update: profileData,
        },
      };
    }
    
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        profile: true,
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update user: ${error.message}`, { id });
  }
}

/**
 * 软删除用户
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function softDeleteUser(id) {
  try {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to soft delete user: ${error.message}`, { id });
  }
}

/**
 * 检查 email 是否已存在
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
export async function emailExists(email) {
  try {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  } catch (error) {
    throw new DatabaseError(`Failed to check email existence: ${error.message}`, { email });
  }
}

/**
 * 检查 username 是否已存在
 * @param {string} username 
 * @returns {Promise<boolean>}
 */
export async function usernameExists(username) {
  try {
    const count = await prisma.user.count({
      where: { username },
    });
    return count > 0;
  } catch (error) {
    throw new DatabaseError(`Failed to check username existence: ${error.message}`, { username });
  }
}

