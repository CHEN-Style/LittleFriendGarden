/**
 * Auth Controller - 认证控制器
 * 职责：处理 HTTP 请求和响应，调用 Service 层
 */

import * as authService from '../services/authService.js';
import { ValidationError } from '../../errors/index.js';

/**
 * 用户注册
 * POST /api/auth/register
 * Body: { email?, username?, phoneE164?, password, profile? }
 */
export async function register(req, res) {
  const registerData = req.body;

  // 基础验证
  if (!registerData.password) {
    throw new ValidationError('Password is required');
  }

  const result = await authService.register(registerData);

  req.logger.info('User registered successfully', {
    userId: result.user.id,
    email: result.user.email,
    username: result.user.username,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
}

/**
 * 用户登录
 * POST /api/auth/login
 * Body: { identifier, password }
 */
export async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ValidationError('Identifier and password are required');
  }

  const result = await authService.login({ identifier, password });

  req.logger.info('User logged in successfully', {
    userId: result.user.id,
    identifier,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * Requires: Authentication
 */
export async function getMe(req, res) {
  // req.user 由认证中间件注入
  const userId = req.user.userId;

  const user = await authService.getUserProfile(userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

/**
 * 更新当前用户信息
 * PATCH /api/auth/me
 * Requires: Authentication
 */
export async function updateMe(req, res) {
  // req.user 由认证中间件注入
  const userId = req.user.userId;
  const updateData = req.body;

  const user = await authService.updateUserProfile(userId, updateData);

  req.logger.info('User profile updated', { userId });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
}

/**
 * 登出（客户端删除 token，服务端暂不处理）
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  // 当前实现：JWT 是无状态的，客户端直接删除 token 即可
  // 未来可以实现 token 黑名单或刷新令牌撤销

  req.logger.info('User logged out', { userId: req.user?.userId });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

