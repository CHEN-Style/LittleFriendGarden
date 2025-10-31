/**
 * 密码工具函数
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 哈希密码
 * @param {string} plainPassword 
 * @returns {Promise<string>} 哈希后的密码
 */
export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param {string} plainPassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

