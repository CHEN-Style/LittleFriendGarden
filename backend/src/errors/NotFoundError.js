import { BaseError } from './BaseError.js';

/**
 * 资源未找到错误
 * 用于查询资源不存在的场景
 */
export class NotFoundError extends BaseError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

