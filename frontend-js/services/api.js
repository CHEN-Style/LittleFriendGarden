/**
 * API Service - 统一的 API 请求封装
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * 🔧 配置说明
 * 
 * Expo Go 开发模式（手机）：
 * 1. 确保手机和电脑在同一网络（WiFi/热点）
 * 2. 在 Windows 上运行 `ipconfig` 查看你的 IP 地址
 * 3. 将 IP 填入下面的 MANUAL_DEV_IP
 * 4. 确保后端使用 app.listen(PORT, '0.0.0.0') 监听所有接口
 * 
 * Web 浏览器开发模式（电脑）：
 * - 自动使用 localhost（无需配置）
 * 
 * 生产环境：
 * - 设置 PRODUCTION_API_URL 为你的服务器地址
 */

// 手动指定开发 IP（用于 Expo Go 手机端）
const MANUAL_DEV_IP = '172.20.10.2';

// 生产环境 API URL
const PRODUCTION_API_URL = null;

// 后端端口
const BACKEND_PORT = 3000;

const getApiBaseUrl = () => {
  // 生产环境
  if (PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }

  // 检测是否在 Web 浏览器中运行
  if (Platform.OS === 'web') {
    // Web 环境使用 localhost
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('🌐 检测到 Web 环境，使用 localhost');
      return `http://localhost:${BACKEND_PORT}/api`;
    }
    
    // 如果 Web 部署在服务器上，使用当前域名
    return `http://${window.location.hostname}:${BACKEND_PORT}/api`;
  }

  // 移动设备：手动指定的开发 IP（最稳定的方式）
  if (MANUAL_DEV_IP) {
    console.log('📱 检测到移动环境，使用手动指定 IP');
    return `http://${MANUAL_DEV_IP}:${BACKEND_PORT}/api`;
  }

  // 自动检测 Expo 开发服务器 IP
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri && !hostUri.includes('.exp.direct')) {
    const host = hostUri.split(':')[0];
    console.log('📱 使用 Expo 自动检测 IP');
    return `http://${host}:${BACKEND_PORT}/api`;
  }

  // Android 模拟器回退
  if (Platform.OS === 'android') {
    console.log('🤖 检测到 Android 模拟器');
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  // iOS 模拟器回退
  console.log('🍎 检测到 iOS 模拟器');
  return `http://localhost:${BACKEND_PORT}/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log('📡 API URL:', API_BASE_URL);

/**
 * 通用请求函数
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // 网络连接失败
    if (error.message === 'Network request failed') {
      throw new Error('无法连接到服务器\n请检查：手机和电脑是否在同一网络');
    }
    throw error;
  }
}

/**
 * GET 请求
 */
export async function get(endpoint, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(endpoint, { method: 'GET', headers });
}

/**
 * POST 请求
 */
export async function post(endpoint, data = {}, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * PATCH 请求
 */
export async function patch(endpoint, data = {}, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * DELETE 请求
 */
export async function del(endpoint, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(endpoint, { method: 'DELETE', headers });
}

export default {
  get,
  post,
  patch,
  del,
};

