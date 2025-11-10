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
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// 日志和追踪中间件
// ======================
app.use(requestIdMiddleware);  // 请求ID生成
app.use(performanceLogger);    // 性能监控

// 调试：检查 body parser 是否工作
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/pets')) {
    console.log('DEBUG app.js middleware:');
    console.log('  req.method:', req.method);
    console.log('  req.path:', req.path);
    console.log('  req.body:', req.body);
    console.log('  typeof req.body:', typeof req.body);
    console.log('  Content-Type:', req.get('Content-Type'));
  }
  next();
});

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
import userTodoRoutes from './src/auth/routes/userTodoRoutes.js';
import calendarRoutes from './src/auth/routes/calendarRoutes.js';
import petRoutes from './src/pet/routes/petRoutes.js';
import petWeightRoutes from './src/pet/routes/petWeightRoutes.js';
import petFeedingRoutes from './src/pet/routes/petFeedingRoutes.js';
import petMedicalRoutes from './src/pet/routes/petMedicalRoutes.js';
import reminderRoutes from './src/pet/routes/reminderRoutes.js';

// 社交功能路由
import topicRoutes from './src/social/routes/topicRoutes.js';
import postRoutes from './src/social/routes/postRoutes.js';
import commentRoutes from './src/social/routes/commentRoutes.js';
import reactionRoutes from './src/social/routes/reactionRoutes.js';
import reportRoutes from './src/social/routes/reportRoutes.js';

// 认证与账号域
app.use('/api/auth', authRoutes);
app.use('/api/todos', userTodoRoutes);
app.use('/api/calendar', calendarRoutes);

// 宠物域
app.use('/api/pets', petRoutes);
app.use('/api/weights', petWeightRoutes);
app.use('/api/feedings', petFeedingRoutes);
app.use('/api/medicals', petMedicalRoutes);
app.use('/api/reminders', reminderRoutes);

// 社交功能
app.use('/api/topics', topicRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/reports', reportRoutes);

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

