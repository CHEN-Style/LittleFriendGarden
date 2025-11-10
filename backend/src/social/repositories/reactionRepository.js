/**
 * Reaction Repository - 点赞数据访问层
 * 职责：封装所有与 Reaction 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建点赞
 * @param {Object} reactionData - 点赞数据
 * @returns {Promise<Object>} 创建的点赞
 */
export async function createReaction(reactionData) {
  try {
    if (reactionData.postId) {
      return await prisma.postReaction.create({
        data: {
          postId: reactionData.postId,
          userId: reactionData.userId,
          type: reactionData.type,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    }

    if (reactionData.commentId) {
      return await prisma.commentReaction.create({
        data: {
          commentId: reactionData.commentId,
          userId: reactionData.userId,
          type: reactionData.type,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    }

    throw new DatabaseError('Invalid reaction data: missing postId/commentId', { reactionData });
  } catch (error) {
    throw new DatabaseError(`Failed to create reaction: ${error.message}`, { reactionData });
  }
}

/**
 * 查找点赞（通过复合条件）
 * @param {Object} where - 查询条件
 * @returns {Promise<Object|null>} 点赞对象
 */
export async function findReaction(where) {
  try {
    if (where.postId) {
      return await prisma.postReaction.findFirst({
        where: {
          postId: where.postId,
          userId: where.userId,
          ...(where.type ? { type: where.type } : {}),
        },
      });
    }
    if (where.commentId) {
      return await prisma.commentReaction.findFirst({
        where: {
          commentId: where.commentId,
          userId: where.userId,
          ...(where.type ? { type: where.type } : {}),
        },
      });
    }
    throw new DatabaseError('Invalid where: need postId or commentId', { where });
  } catch (error) {
    throw new DatabaseError(`Failed to find reaction: ${error.message}`, { where });
  }
}

/**
 * 查找帖子的点赞列表（分页）
 * @param {Object} options - 查询选项
 * @param {string} options.postId - 帖子 ID
 * @param {string} [options.kind] - 点赞类型
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findReactionsByPostId({ postId, kind, limit = 50, offset = 0 }) {
  try {
    const where = { postId, ...(kind ? { type: kind } : {}) };

    const [data, total] = await Promise.all([
      prisma.postReaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.postReaction.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find reactions by post: ${error.message}`, { postId });
  }
}

/**
 * 查找评论的点赞列表（分页）
 * @param {Object} options - 查询选项
 * @param {string} options.commentId - 评论 ID
 * @param {string} [options.kind] - 点赞类型
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findReactionsByCommentId({ commentId, kind, limit = 50, offset = 0 }) {
  try {
    const where = { commentId, ...(kind ? { type: kind } : {}) };

    const [data, total] = await Promise.all([
      prisma.commentReaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.commentReaction.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find reactions by comment: ${error.message}`, { commentId });
  }
}

/**
 * 查找用户的点赞列表（分页）
 * @param {Object} options - 查询选项
 * @param {string} options.userId - 用户 ID
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findReactionsByUserId({ userId, limit = 50, offset = 0 }) {
  try {
    const where = { userId };

    const [postReactions, commentReactions, postTotal, commentTotal] = await Promise.all([
      prisma.postReaction.findMany({
        where,
        include: {
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.commentReaction.findMany({
        where,
        include: {
          comment: {
            select: {
              id: true,
              text: true,
            },
          },
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.postReaction.count({ where }),
      prisma.commentReaction.count({ where }),
    ]);

    const merged = [...postReactions.map(r => ({ ...r, scope: 'post' })), ...commentReactions.map(r => ({ ...r, scope: 'comment' }))]
      .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))
      .slice(0, limit);

    return { data: merged, total: postTotal + commentTotal };
  } catch (error) {
    throw new DatabaseError(`Failed to find reactions by user: ${error.message}`, { userId });
  }
}

/**
 * 删除点赞
 * @param {string} id - 点赞 ID
 * @returns {Promise<Object>} 删除的点赞
 */
export async function deleteReaction(id) {
  try {
    try {
      return await prisma.postReaction.delete({ where: { id } });
    } catch (_e) {
      return await prisma.commentReaction.delete({ where: { id } });
    }
  } catch (error) {
    throw new DatabaseError(`Failed to delete reaction: ${error.message}`, { id });
  }
}

/**
 * 获取帖子的点赞统计（按类型分组）
 * @param {string} postId - 帖子 ID
 * @returns {Promise<Array>} 统计数据
 */
export async function getPostReactionStats(postId) {
  try {
    return await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { _all: true },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get post reaction stats: ${error.message}`, { postId });
  }
}

/**
 * 获取评论的点赞统计（按类型分组）
 * @param {string} commentId - 评论 ID
 * @returns {Promise<Array>} 统计数据
 */
export async function getCommentReactionStats(commentId) {
  try {
    return await prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { _all: true },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get comment reaction stats: ${error.message}`, { commentId });
  }
}

