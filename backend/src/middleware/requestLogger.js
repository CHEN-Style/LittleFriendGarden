import expressWinston from 'express-winston';
import { v4 as uuidv4 } from 'uuid';
import logger, { createChildLogger } from '../config/logger.js';

/**
 * 请求 ID 中间件
 * 为每个请求生成唯一ID，用于日志追踪
 */
export const requestIdMiddleware = (req, res, next) => {
  // 从请求头获取或生成新的请求ID
  req.id = req.get('X-Request-ID') || uuidv4();
  
  // 设置响应头，便于客户端追踪
  res.set('X-Request-ID', req.id);
  
  // 创建带请求ID的子logger
  req.logger = createChildLogger(req.id);
  
  next();
};

/**
 * 请求日志中间件
 * 记录所有 HTTP 请求的详细信息
 */
export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: false,
  colorize: false,
  
  // 动态元数据
  dynamicMeta: (req, res) => {
    return {
      requestId: req.id,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
    };
  },
  
  // 忽略的路由（健康检查等）
  ignoreRoute: (req, res) => {
    return req.path === '/health' || req.path === '/ping';
  },
  
  // 请求白名单（记录哪些请求字段）
  requestWhitelist: [
    'url',
    'method',
    'httpVersion',
    'originalUrl',
    'query',
  ],
  
  // 响应白名单（记录哪些响应字段）
  responseWhitelist: [
    'statusCode',
  ],
  
  // Body 黑名单（不记录敏感字段）
  bodyBlacklist: ['password', 'token', 'refreshToken', 'secret'],
  
  // 跳过成功的请求（可选）
  // skip: (req, res) => res.statusCode < 400,
});

/**
 * 错误日志中间件
 * 记录所有错误响应
 */
export const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} - Error',
  
  dynamicMeta: (req, res, err) => {
    return {
      requestId: req.id,
      userId: req.user?.id || 'anonymous',
      error: {
        name: err.name,
        message: err.message,
        code: err.code || err.errorCode,
      },
    };
  },
  
  requestWhitelist: [
    'url',
    'method',
    'httpVersion',
    'originalUrl',
    'query',
  ],
  
  blacklistedMetaFields: ['password', 'token', 'refreshToken', 'secret'],
});

/**
 * 性能监控中间件
 * 记录请求处理时间
 */
export const performanceLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, id } = req;
    const { statusCode } = res;
    
    // 记录慢请求（超过1秒）
    if (duration > 1000) {
      logger.warn({
        message: 'Slow request detected',
        requestId: id,
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
      });
    } else if (duration > 500) {
      logger.info({
        message: 'Request completed',
        requestId: id,
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
      });
    }
  });
  
  next();
};

export default {
  requestIdMiddleware,
  requestLogger,
  errorLogger,
  performanceLogger,
};

