import logger from '../config/logger.js';
import { BaseError } from '../errors/index.js';

/**
 * 全局错误处理中间件
 * 捕获所有错误并返回统一格式的错误响应
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  
  // 如果是自定义的业务错误
  if (err instanceof BaseError) {
    logger.warn({
      message: err.message,
      requestId,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      details: err.details,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    return res.status(err.statusCode).json(err.toJSON());
  }

  // Prisma 错误处理
  if (err.code && err.code.startsWith('P')) {
    const prismaError = handlePrismaError(err);
    logger.error({
      message: 'Prisma error occurred',
      requestId,
      prismaCode: err.code,
      error: prismaError.message,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    return res.status(prismaError.statusCode).json({
      error: {
        name: 'DatabaseError',
        message: prismaError.message,
        code: 'DATABASE_ERROR',
        statusCode: prismaError.statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 未知错误（系统级错误）
  logger.error({
    message: err.message || 'Unknown error occurred',
    requestId,
    error: err.name,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // 生产环境不暴露详细错误信息
  const isProduction = process.env.NODE_ENV === 'production';
  
  return res.status(500).json({
    error: {
      name: 'InternalServerError',
      message: isProduction ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
};

/**
 * 处理 Prisma 特定错误
 */
function handlePrismaError(err) {
  switch (err.code) {
    case 'P2002':
      // 唯一约束冲突
      const target = err.meta?.target || 'field';
      return {
        statusCode: 409,
        message: `A record with this ${target} already exists`,
      };
    
    case 'P2025':
      // 记录未找到
      return {
        statusCode: 404,
        message: 'Record not found',
      };
    
    case 'P2003':
      // 外键约束失败
      return {
        statusCode: 400,
        message: 'Invalid reference to related record',
      };
    
    case 'P2011':
      // 非空约束失败
      return {
        statusCode: 400,
        message: 'Required field is missing',
      };
    
    case 'P2014':
      // 关系违规
      return {
        statusCode: 400,
        message: 'The change violates a required relation',
      };
    
    default:
      return {
        statusCode: 500,
        message: 'Database operation failed',
      };
  }
}

/**
 * 404 Not Found 处理中间件
 * 放在所有路由之后
 */
export const notFoundHandler = (req, res, next) => {
  const requestId = req.id || 'unknown';
  
  logger.warn({
    message: 'Route not found',
    requestId,
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    error: {
      name: 'NotFoundError',
      message: `Cannot ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * 异步路由处理器包装函数
 * 自动捕获 async 函数中的错误并传递给错误处理中间件
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

