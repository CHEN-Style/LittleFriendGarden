/**
 * Auth Service - 认证业务逻辑层
 * 职责：处理注册、登录等业务逻辑，协调 Repository 和工具函数
 */

import * as userRepo from '../repositories/userRepository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { ValidationError, ConflictError, AuthError } from '../../errors/index.js';

/**
 * 用户注册
 * @param {Object} registerData - { email?, username?, phoneE164?, password, profile? }
 * @returns {Promise<Object>} { user, tokens }
 */
export async function register(registerData) {
  const { email, username, phoneE164, password, profile } = registerData;

  // 验证：至少提供一种登录凭证
  if (!email && !username && !phoneE164) {
    throw new ValidationError('Must provide at least one of: email, username, or phone number');
  }

  // 验证：密码强度（简单示例）
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // 检查唯一性
  if (email && (await userRepo.emailExists(email))) {
    throw new ConflictError('Email already registered', { field: 'email' });
  }

  if (username && (await userRepo.usernameExists(username))) {
    throw new ConflictError('Username already taken', { field: 'username' });
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 创建用户
  const user = await userRepo.createUser({
    email,
    username,
    phoneE164,
    passwordHash,
    profile: profile
      ? {
          displayName: profile.displayName || username || email?.split('@')[0],
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
        }
      : {
          displayName: username || email?.split('@')[0] || 'User',
        },
  });

  // 生成令牌
  const tokens = generateTokens(user);

  // 返回（不包含敏感信息）
  return {
    user: sanitizeUser(user),
    tokens,
  };
}

/**
 * 用户登录
 * @param {Object} loginData - { identifier, password } identifier 可以是 email 或 username
 * @returns {Promise<Object>} { user, tokens }
 */
export async function login(loginData) {
  const { identifier, password } = loginData;

  // 验证输入
  if (!identifier || !password) {
    throw new ValidationError('Identifier and password are required');
  }

  // 查找用户（尝试 email 和 username）
  let user = null;
  if (identifier.includes('@')) {
    user = await userRepo.findUserByEmail(identifier);
  } else {
    user = await userRepo.findUserByUsername(identifier);
  }

  if (!user) {
    throw new AuthError('Invalid credentials', { code: 'INVALID_CREDENTIALS' });
  }

  // 检查账号状态
  if (!user.isActive) {
    throw new AuthError('Account is inactive', { code: 'ACCOUNT_INACTIVE' });
  }

  if (user.deletedAt) {
    throw new AuthError('Account has been deleted', { code: 'ACCOUNT_DELETED' });
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError('Invalid credentials', { code: 'INVALID_CREDENTIALS' });
  }

  // 生成令牌
  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    tokens,
  };
}

/**
 * 获取用户资料
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export async function getUserProfile(userId) {
  const user = await userRepo.findUserById(userId);

  if (!user) {
    throw new AuthError('User not found', { code: 'USER_NOT_FOUND' });
  }

  return sanitizeUser(user);
}

/**
 * 更新用户资料
 * @param {string} userId 
 * @param {Object} updateData 
 * @returns {Promise<Object>}
 */
export async function updateUserProfile(userId, updateData) {
  // 验证不能修改的字段
  const forbiddenFields = ['id', 'passwordHash', 'createdAt', 'updatedAt', 'deletedAt'];
  const hasForbiddenField = forbiddenFields.some((field) => field in updateData);
  
  if (hasForbiddenField) {
    throw new ValidationError('Cannot update protected fields');
  }

  const user = await userRepo.updateUser(userId, updateData);
  return sanitizeUser(user);
}

// ============================================
// 内部辅助函数
// ============================================

/**
 * 生成访问令牌和刷新令牌
 * @private
 */
function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: user.id }),
  };
}

/**
 * 清理用户对象（移除敏感信息）
 * @private
 */
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

