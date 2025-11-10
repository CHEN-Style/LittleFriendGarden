/**
 * Topic Service - 话题业务逻辑层
 * 处理话题相关的业务逻辑
 */

import * as topicRepo from '../repositories/topicRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 创建话题
 * @param {Object} data - 话题数据
 * @param {string} userId - 创建者 ID
 * @returns {Promise<Object>} 创建的话题
 */
export async function createTopic(data, userId) {
  const { name, slug: inputSlug, description, isOfficial } = data;

  // 验证必填字段
  if (!name) {
    throw new ValidationError('name is required');
  }

  // 生成 slug（若未提供）
  const toSlug = (text) => {
    if (!text) return '';
    const lowered = String(text).toLowerCase();
    // 将非字母数字替换为连字符，压缩多余连字符
    const basic = lowered
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
    return basic || `topic-${Date.now()}`;
  };

  let slug = inputSlug && String(inputSlug).trim().length > 0 ? String(inputSlug).toLowerCase() : toSlug(name);

  // 验证 slug 格式（小写字母、数字、连字符）
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new ValidationError('slug must contain only lowercase letters, numbers, and hyphens');
  }

  // 确保 slug 唯一（若冲突则追加短后缀）
  let suffix = 0;
  // 最多尝试 10 次以避免极端情况
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 检查 slug 是否已存在
    // eslint-disable-next-line no-await-in-loop
    const existing = await topicRepo.findTopicBySlug(slug);
    if (!existing) break;
    suffix += 1;
    const base = slug.replace(/-\d+$/, '');
    slug = `${base}-${suffix}`;
    if (suffix > 10) {
      slug = `${toSlug(name)}-${Date.now()}`;
      break;
    }
  }

  // 仅写入 schema 中存在的字段
  const topicData = {
    name,
    slug,
    description,
    isOfficial: isOfficial || false,
  };

  return await topicRepo.createTopic(topicData);
}

/**
 * 获取话题详情
 * @param {string} id - 话题 ID
 * @returns {Promise<Object>} 话题详情
 */
export async function getTopicById(id) {
  const topic = await topicRepo.findTopicById(id);

  if (!topic || topic.deletedAt) {
    throw new NotFoundError('Topic not found');
  }

  return topic;
}

/**
 * 根据 slug 获取话题详情
 * @param {string} slug - 话题 slug
 * @returns {Promise<Object>} 话题详情
 */
export async function getTopicBySlug(slug) {
  const topic = await topicRepo.findTopicBySlug(slug);

  if (!topic || topic.deletedAt) {
    throw new NotFoundError('Topic not found');
  }

  return topic;
}

/**
 * 获取话题列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getTopics(options) {
  return await topicRepo.findTopics(options);
}

/**
 * 搜索话题
 * @param {string} keyword - 搜索关键词
 * @param {number} [limit=20] - 结果数量
 * @returns {Promise<Array>} 话题列表
 */
export async function searchTopics(keyword, limit = 20) {
  if (!keyword || keyword.trim().length === 0) {
    throw new ValidationError('Search keyword is required');
  }

  return await topicRepo.searchTopics(keyword.trim(), limit);
}

/**
 * 更新话题
 * @param {string} id - 话题 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<Object>} 更新后的话题
 */
export async function updateTopic(id, data, userId) {
  // 检查话题是否存在
  const topic = await getTopicById(id);

  // 只有创建者可以修改（或者是管理员，这里简化处理）
  if (topic.creatorId !== userId) {
    throw new ForbiddenError('Only the topic creator can update this topic');
  }

  const { name, description, icon, coverUrl } = data;

  // 准备更新数据
  const updateData = {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    ...(coverUrl !== undefined && { coverUrl }),
  };

  return await topicRepo.updateTopic(id, updateData);
}

/**
 * 删除话题（软删除）
 * @param {string} id - 话题 ID
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<void>}
 */
export async function deleteTopic(id, userId) {
  // 检查话题是否存在
  const topic = await getTopicById(id);

  // 只有创建者可以删除（或者是管理员）
  if (topic.creatorId !== userId) {
    throw new ForbiddenError('Only the topic creator can delete this topic');
  }

  await topicRepo.softDeleteTopic(id);
}

