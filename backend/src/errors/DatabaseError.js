import { BaseError } from './BaseError.js';

/**
 * 数据库错误
 * 用于数据库操作失败的场景
 */
export class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

