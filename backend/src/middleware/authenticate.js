/**
 * JWT 认证中间件
 * 验证请求中的 JWT token，并将用户信息注入到 req.user
 */

import { extractTokenFromHeader, verifyToken } from '../utils/jwt.js';
import { AuthError } from '../errors/index.js';

/**
 * 认证中间件 - 验证 JWT token
 * 将解码的用户信息附加到 req.user
 * 
 * @throws {AuthError} 如果 token 缺失或无效
 */
export function authenticate(req, res, next) {
  try {
    // 1. 从 Authorization header 提取 token
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthError('Authentication required', { 
        code: 'NO_TOKEN',
        statusCode: 401,
      });
    }

    // 2. 验证 token
    const decoded = verifyToken(token);

    // 3. 将用户信息注入到 req.user
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    // 4. 继续下一个中间件
    next();
  } catch (error) {
    // 如果是 AuthError，直接传递
    if (error.name === 'AuthError') {
      next(error);
    } else {
      // 其他错误转换为 AuthError
      next(new AuthError('Authentication failed', { 
        code: 'AUTH_FAILED',
        statusCode: 401,
        originalError: error.message,
      }));
    }
  }
}

/**
 * 可选认证中间件 - 尝试验证 token，但不强制要求
 * 如果 token 存在且有效，将用户信息附加到 req.user
 * 如果 token 不存在或无效，继续执行但不注入 req.user
 */
export function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
      };
    }

    next();
  } catch (error) {
    // 可选认证失败不抛出错误，只是不注入用户信息
    next();
  }
}

