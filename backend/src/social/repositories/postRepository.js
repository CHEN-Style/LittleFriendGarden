/**
 * Post Repository - 帖子数据访问层
 * 职责：封装所有与 Post 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建帖子
 * @param {Object} postData - 帖子数据
 * @returns {Promise<Object>} 创建的帖子
 */
export async function createPost(postData) {
  try {
    return await prisma.post.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create post: ${error.message}`, { postData });
  }
}

/**
 * 根据 ID 查找帖子
 * @param {string} id - 帖子 ID
 * @returns {Promise<Object|null>} 帖子对象
 */
export async function findPostById(id) {
  try {
    return await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find post: ${error.message}`, { id });
  }
}

/**
 * 查找帖子列表（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {string} [options.topicId] - 话题 ID
 * @param {string} [options.authorId] - 作者 ID
 * @param {string} [options.visibility] - 可见性
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findPosts({ topicId, authorId, visibility, limit = 50, offset = 0 }) {
  try {
    const where = {
      deletedAt: null,
    };

    if (topicId) {
      where.postTopics = { some: { topicId } };
    }

    if (authorId) {
      where.authorUserId = authorId;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find posts: ${error.message}`);
  }
}

/**
 * 搜索帖子（按标题和内容）
 * @param {string} keyword - 搜索关键词
 * @param {number} [limit=20] - 结果数量
 * @returns {Promise<Array>} 帖子列表
 */
export async function searchPosts(keyword, limit = 20) {
  try {
    return await prisma.post.findMany({
      where: {
        deletedAt: null,
        visibility: 'public',
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { text: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to search posts: ${error.message}`, { keyword });
  }
}

/**
 * 更新帖子
 * @param {string} id - 帖子 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的帖子
 */
export async function updatePost(id, updateData) {
  try {
    return await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update post: ${error.message}`, { id });
  }
}

/**
 * 软删除帖子
 * @param {string} id - 帖子 ID
 * @returns {Promise<Object>} 删除的帖子
 */
export async function softDeletePost(id) {
  try {
    return await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete post: ${error.message}`, { id });
  }
}

/**
 * 增加评论计数
 * @param {string} id - 帖子 ID
 * @returns {Promise<Object>} 更新后的帖子
 */
export async function incrementCommentCount(id) {
  try {
    return await prisma.post.update({
      where: { id },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to increment comment count: ${error.message}`, { id });
  }
}

/**
 * 减少评论计数
 * @param {string} id - 帖子 ID
 * @returns {Promise<Object>} 更新后的帖子
 */
export async function decrementCommentCount(id) {
  try {
    return await prisma.post.update({
      where: { id },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to decrement comment count: ${error.message}`, { id });
  }
}

/**
 * 增加点赞计数
 * @param {string} id - 帖子 ID
 * @returns {Promise<Object>} 更新后的帖子
 */
export async function incrementLikeCount(id) {
  try {
    return await prisma.post.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to increment like count: ${error.message}`, { id });
  }
}

/**
 * 减少点赞计数
 * @param {string} id - 帖子 ID
 * @returns {Promise<Object>} 更新后的帖子
 */
export async function decrementLikeCount(id) {
  try {
    // 仅当 likeCount > 0 时递减，避免出现负值
    const result = await prisma.post.updateMany({
      where: { id, likeCount: { gt: 0 } },
      data: { likeCount: { decrement: 1 } },
    });
    return result;
  } catch (error) {
    throw new DatabaseError(`Failed to decrement like count: ${error.message}`, { id });
  }
}

