import { BaseError } from './BaseError.js';

/**
 * 数据验证错误
 * 用于参数验证失败、数据格式错误等场景
 */
export class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

