import { BaseError } from './BaseError.js';

/**
 * 冲突错误
 * 用于资源已存在、唯一约束冲突等场景
 */
export class ConflictError extends BaseError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

