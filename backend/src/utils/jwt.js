/**
 * JWT 工具函数
 */

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { AuthError } from '../errors/index.js';

/**
 * 生成访问令牌
 * @param {Object} payload - { userId, email?, username? }
 * @returns {string} JWT token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.accessTokenExpiry,
    issuer: jwtConfig.options.issuer,
    audience: jwtConfig.options.audience,
  });
}

/**
 * 生成刷新令牌
 * @param {Object} payload - { userId }
 * @returns {string} JWT token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
    issuer: jwtConfig.options.issuer,
    audience: jwtConfig.options.audience,
  });
}

/**
 * 验证令牌
 * @param {string} token 
 * @returns {Object} decoded payload
 * @throws {AuthError}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.options.issuer,
      audience: jwtConfig.options.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthError('Token expired', { code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AuthError('Invalid token', { code: 'INVALID_TOKEN' });
    }
    throw new AuthError('Token verification failed', { originalError: error.message });
  }
}

/**
 * 从 Authorization header 提取 token
 * @param {string} authHeader - "Bearer <token>"
 * @returns {string|null}
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer "
}

