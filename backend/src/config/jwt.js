/**
 * JWT 配置
 */

export const jwtConfig = {
  // 从环境变量读取，默认值仅用于开发
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1d', // 访问令牌 1 天
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // 刷新令牌 7 天
  
  // JWT 选项
  options: {
    issuer: 'little-friend-garden',
    audience: 'little-friend-garden-api',
  },
};

// 开发环境警告
if (process.env.NODE_ENV !== 'production' && jwtConfig.secret === 'your-secret-key-change-in-production') {
  console.warn('⚠️  WARNING: Using default JWT secret! Set JWT_SECRET in production.');
}

