import { BaseError } from './BaseError.js';

/**
 * 认证错误
 * 用于登录失败、token无效等场景
 */
export class AuthError extends BaseError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTH_ERROR', details);
  }
}

/**
 * 授权错误
 * 用于权限不足的场景
 */
export class ForbiddenError extends BaseError {
  constructor(message = 'Access forbidden', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

