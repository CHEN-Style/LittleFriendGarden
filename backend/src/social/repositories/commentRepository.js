/**
 * Comment Repository - 评论数据访问层
 * 职责：封装所有与 Comment 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建评论
 * @param {Object} commentData - 评论数据
 * @returns {Promise<Object>} 创建的评论
 */
export async function createComment(commentData) {
  try {
    return await prisma.comment.create({
      data: commentData,
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
    throw new DatabaseError(`Failed to create comment: ${error.message}`, { commentData });
  }
}

/**
 * 根据 ID 查找评论
 * @param {string} id - 评论 ID
 * @returns {Promise<Object|null>} 评论对象
 */
export async function findCommentById(id) {
  try {
    return await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            authorUserId: true,
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find comment: ${error.message}`, { id });
  }
}

/**
 * 查找帖子的评论列表（分页）
 * @param {Object} options - 查询选项
 * @param {string} options.postId - 帖子 ID
 * @param {string} [options.parentId] - 父评论 ID（查询回复）
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findCommentsByPostId({ postId, parentId, limit = 50, offset = 0 }) {
  try {
    const where = {
      postId,
      deletedAt: null,
    };

    // 如果指定了 parentId，查询子评论；否则查询顶级评论
    if (parentId !== undefined) {
      where.parentCommentId = parentId;
    } else {
      where.parentCommentId = null;
    }

    const [data, total] = await Promise.all([
      prisma.comment.findMany({
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
              reactions: true,
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find comments: ${error.message}`, { postId });
  }
}

/**
 * 查找用户的评论列表（分页）
 * @param {Object} options - 查询选项
 * @param {string} options.authorId - 作者 ID
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findCommentsByAuthorId({ authorId, limit = 50, offset = 0 }) {
  try {
    const where = {
      authorUserId: authorId,
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find comments by author: ${error.message}`, { authorId });
  }
}

/**
 * 更新评论
 * @param {string} id - 评论 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的评论
 */
export async function updateComment(id, updateData) {
  try {
    return await prisma.comment.update({
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
    throw new DatabaseError(`Failed to update comment: ${error.message}`, { id });
  }
}

/**
 * 软删除评论
 * @param {string} id - 评论 ID
 * @returns {Promise<Object>} 删除的评论
 */
export async function softDeleteComment(id) {
  try {
    return await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete comment: ${error.message}`, { id });
  }
}

/**
 * 增加点赞计数
 * @param {string} id - 评论 ID
 * @returns {Promise<Object>} 更新后的评论
 */
export async function incrementLikeCount(id) {
  try {
    return await prisma.comment.update({
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
 * @param {string} id - 评论 ID
 * @returns {Promise<Object>} 更新后的评论
 */
export async function decrementLikeCount(id) {
  try {
    // 仅当 likeCount > 0 时递减，避免出现负值
    const result = await prisma.comment.updateMany({
      where: { id, likeCount: { gt: 0 } },
      data: { likeCount: { decrement: 1 } },
    });
    return result;
  } catch (error) {
    throw new DatabaseError(`Failed to decrement like count: ${error.message}`, { id });
  }
}

