/**
 * Storage Utility - 本地存储工具
 * 用于存储用户认证信息
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_info';
const THEME_KEY = '@app_theme';

/**
 * 保存认证信息
 * @param {Object} authData - { tokens, user }
 */
export async function saveAuthData(authData) {
  try {
    const { tokens, user } = authData;
    await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
}

/**
 * 获取访问令牌
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * 获取用户信息
 * @returns {Promise<Object|null>}
 */
export async function getUserInfo() {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * 清除认证信息
 */
export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
}

/**
 * 获取完整的认证数据
 * @returns {Promise<Object|null>} - { tokens: { accessToken }, user }
 */
export async function getAuthData() {
  try {
    const token = await getToken();
    const user = await getUserInfo();
    
    if (!token || !user) {
      return null;
    }
    
    return {
      tokens: {
        accessToken: token,
      },
      user,
    };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
}

/**
 * 检查是否已登录
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}

/**
 * 保存主题设置
 * @param {string} theme - 'light' 或 'dark'
 */
export async function saveTheme(theme) {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
    throw error;
  }
}

/**
 * 获取主题设置
 * @returns {Promise<string|null>} - 'light', 'dark' 或 null
 */
export async function getTheme() {
  try {
    return await AsyncStorage.getItem(THEME_KEY);
  } catch (error) {
    console.error('Error getting theme:', error);
    return null;
  }
}

export default {
  saveAuthData,
  getToken,
  getUserInfo,
  getAuthData,
  clearAuthData,
  isAuthenticated,
  saveTheme,
  getTheme,
};

