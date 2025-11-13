/**
 * Auth Service - 认证相关的 API 调用
 */

import { post, get } from './api.js';

/**
 * 用户注册
 * @param {Object} registerData - { username, email, phone, password }
 * @returns {Promise<Object>} { user, tokens }
 */
export async function register(registerData) {
  const { username, email, phone, password } = registerData;

  // 转换为后端期望的格式
  const payload = {
    username: username || undefined,
    email: email || undefined,
    phoneE164: phone || undefined, // 后端使用 phoneE164
    password,
  };

  const response = await post('/auth/register', payload);
  return response.data;
}

/**
 * 用户登录
 * @param {Object} loginData - { identifier, password }
 * @returns {Promise<Object>} { user, tokens }
 */
export async function login(loginData) {
  const { identifier, password } = loginData;

  const payload = {
    identifier,
    password,
  };

  const response = await post('/auth/login', payload);
  return response.data;
}

/**
 * 获取当前用户信息
 * @param {string} token - JWT token
 * @returns {Promise<Object>} 用户信息
 */
export async function getCurrentUser(token) {
  const response = await get('/auth/me', token);
  return response.data.user;
}

/**
 * 登出
 * @param {string} token - JWT token
 * @returns {Promise<Object>}
 */
export async function logout(token) {
  const response = await post('/auth/logout', {}, token);
  return response;
}

export default {
  register,
  login,
  getCurrentUser,
  logout,
};

