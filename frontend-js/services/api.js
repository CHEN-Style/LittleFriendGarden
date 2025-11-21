/**
 * API Service - 统一的 API 请求封装
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * 🔧 配置说明
 * 
 * 开发模式 - 自动适配网络环境：
 * 1. 手机端：自动从 Expo 获取电脑 IP（推荐）
 * 2. Web 端：自动使用 localhost
 * 
 * 如果自动检测失败：
 * - 设置 USE_MANUAL_IP = true
 * - 运行 `ipconfig` 查看电脑 IP，填入 MANUAL_DEV_IP
 * - 确保手机和电脑在同一网络（WiFi/热点）
 * 
 * 生产环境：
 * - 设置 PRODUCTION_API_URL 为你的服务器地址
 */

// 是否使用手动指定的 IP（调试时使用）
const USE_MANUAL_IP = true;

// 手动指定开发 IP（仅当 USE_MANUAL_IP = true 时生效）
const MANUAL_DEV_IP = '192.168.1.190';

// 生产环境 API URL
const PRODUCTION_API_URL = null;

// 后端端口
const BACKEND_PORT = 3000;

const getApiBaseUrl = () => {
  // 生产环境
  if (PRODUCTION_API_URL) {
    console.log('🚀 使用生产环境 API');
    return PRODUCTION_API_URL;
  }

  // 检测是否在 Web 浏览器中运行
  if (Platform.OS === 'web') {
    // Web 环境使用 localhost
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('🌐 [Web] 使用 localhost');
      return `http://localhost:${BACKEND_PORT}/api`;
    }
    
    // 如果 Web 部署在服务器上，使用当前域名
    console.log('🌐 [Web] 使用当前域名:', window.location.hostname);
    return `http://${window.location.hostname}:${BACKEND_PORT}/api`;
  }

  // 移动设备（Expo Go）
  
  // 方式1：使用手动指定的 IP（用于调试或自动检测失败时）
  if (USE_MANUAL_IP && MANUAL_DEV_IP) {
    console.log('📱 [手动] 使用指定 IP:', MANUAL_DEV_IP);
    return `http://${MANUAL_DEV_IP}:${BACKEND_PORT}/api`;
  }

  // 方式2：自动从 Expo 获取开发服务器 IP（推荐）
  // Expo Go 启动时会连接到电脑上的 Metro bundler
  // 我们可以从这个连接信息中提取电脑的 IP 地址
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  
  if (hostUri) {
    // hostUri 格式: "192.168.1.100:8081" 或 "192.168.1.100:19000"
    const host = hostUri.split(':')[0];
    
    // 排除 Expo 隧道地址（.exp.direct）
    if (!hostUri.includes('.exp.direct')) {
      console.log('📱 [自动] 使用 Expo 检测到的电脑 IP:', host);
      console.log('   Expo 连接地址:', hostUri);
      return `http://${host}:${BACKEND_PORT}/api`;
    }
  }

  // 方式3：模拟器回退方案
  if (Platform.OS === 'android') {
    // Android 模拟器使用特殊 IP 访问宿主机
    console.log('🤖 [Android模拟器] 使用 10.0.2.2');
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    // iOS 模拟器可以直接使用 localhost
    console.log('🍎 [iOS模拟器] 使用 localhost');
    return `http://localhost:${BACKEND_PORT}/api`;
  }

  // 最后回退：假设使用 localhost（不太可能到这里）
  console.warn('⚠️ 无法自动检测 IP，使用 localhost（可能无法连接）');
  console.warn('💡 请设置 USE_MANUAL_IP = true 并配置 MANUAL_DEV_IP');
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
    if (error.message === 'Network request failed' || error.message.includes('Failed to fetch')) {
      const errorMsg = [
        '❌ 无法连接到后端服务器',
        '',
        '请检查：',
        '1. 后端服务器是否已启动（npm start）',
        '2. 手机和电脑是否在同一 WiFi/热点',
        '3. 电脑防火墙是否允许端口 3000',
        '',
        `正在尝试连接: ${API_BASE_URL}`,
        '',
        '💡 如果自动检测失败：',
        '- 打开 frontend-js/services/api.js',
        '- 设置 USE_MANUAL_IP = true',
        '- 运行 ipconfig 查看电脑 IP',
        '- 填入 MANUAL_DEV_IP'
      ].join('\n');
      throw new Error(errorMsg);
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

