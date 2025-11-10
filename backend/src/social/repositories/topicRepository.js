/**
 * Topic Repository - 话题数据访问层
 * 职责：封装所有与 Topic 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建话题
 * @param {Object} topicData - 话题数据
 * @returns {Promise<Object>} 创建的话题
 */
export async function createTopic(topicData) {
  try {
    return await prisma.topic.create({
      data: topicData,
      include: {},
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create topic: ${error.message}`, { topicData });
  }
}

/**
 * 根据 ID 查找话题
 * @param {string} id - 话题 ID
 * @returns {Promise<Object|null>} 话题对象
 */
export async function findTopicById(id) {
  try {
    return await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            postTopics: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find topic: ${error.message}`, { id });
  }
}

/**
 * 根据 slug 查找话题
 * @param {string} slug - 话题 slug
 * @returns {Promise<Object|null>} 话题对象
 */
export async function findTopicBySlug(slug) {
  try {
    return await prisma.topic.findFirst({
      where: { slug },
      include: {
        _count: {
          select: {
            postTopics: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find topic by slug: ${error.message}`, { slug });
  }
}

/**
 * 查找所有话题（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {boolean} [options.isOfficial] - 是否官方话题
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findTopics({ isOfficial, limit = 50, offset = 0 }) {
  try {
    const where = {
      deletedAt: null,
    };

    if (isOfficial !== undefined) {
      where.isOfficial = isOfficial;
    }

    const [data, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        include: {
          _count: {
            select: {
              postTopics: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.topic.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find topics: ${error.message}`);
  }
}

/**
 * 搜索话题（按名称）
 * @param {string} keyword - 搜索关键词
 * @param {number} [limit=20] - 结果数量
 * @returns {Promise<Array>} 话题列表
 */
export async function searchTopics(keyword, limit = 20) {
  try {
    return await prisma.topic.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            postTopics: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to search topics: ${error.message}`, { keyword });
  }
}

/**
 * 更新话题
 * @param {string} id - 话题 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的话题
 */
export async function updateTopic(id, updateData) {
  try {
    return await prisma.topic.update({
      where: { id },
      data: updateData,
      include: {},
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update topic: ${error.message}`, { id });
  }
}

/**
 * 软删除话题
 * @param {string} id - 话题 ID
 * @returns {Promise<Object>} 删除的话题
 */
export async function softDeleteTopic(id) {
  try {
    return await prisma.topic.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete topic: ${error.message}`, { id });
  }
}

