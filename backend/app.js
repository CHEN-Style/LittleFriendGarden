import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './src/config/logger.js';
import {
  requestIdMiddleware,
  requestLogger,
  performanceLogger,
  errorHandler,
  notFoundHandler,
} from './src/middleware/index.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// 基础中间件
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 日志和追踪中间件
// ======================
app.use(requestIdMiddleware);  // 请求ID生成
app.use(performanceLogger);    // 性能监控
app.use(requestLogger);        // 请求日志

// ======================
// 健康检查路由
// ======================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// ======================
// API 路由
// ======================
import authRoutes from './src/auth/routes/authRoutes.js';

app.use('/api/auth', authRoutes);

// ======================
// 错误处理
// ======================
app.use(notFoundHandler);  // 404处理
app.use(errorHandler);     // 全局错误处理

// ======================
// 服务器启动
// ======================
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// 优雅关闭处理
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // 如果10秒内无法关闭，强制退出
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// 监听终止信号
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

export default app;

