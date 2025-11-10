/**
 * Report Repository - 举报数据访问层
 * 职责：封装所有与 Report 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建帖子举报
 * @param {Object} reportData - 举报数据
 * @returns {Promise<Object>} 创建的举报
 */
export async function createPostReport(reportData) {
  try {
    return await prisma.postReport.create({
      data: reportData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create post report: ${error.message}`, { reportData });
  }
}

/**
 * 创建评论举报
 * @param {Object} reportData - 举报数据
 * @returns {Promise<Object>} 创建的举报
 */
export async function createCommentReport(reportData) {
  try {
    return await prisma.commentReport.create({
      data: reportData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        comment: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create comment report: ${error.message}`, { reportData });
  }
}

/**
 * 根据 ID 查找帖子举报
 * @param {string} id - 举报 ID
 * @returns {Promise<Object|null>} 举报对象
 */
export async function findPostReportById(id) {
  try {
    return await prisma.postReport.findUnique({
      where: { id },
      include: {
        reporter: {
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
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find post report: ${error.message}`, { id });
  }
}

/**
 * 根据 ID 查找评论举报
 * @param {string} id - 举报 ID
 * @returns {Promise<Object|null>} 举报对象
 */
export async function findCommentReportById(id) {
  try {
    return await prisma.commentReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        comment: {
          select: {
            id: true,
            text: true,
            authorUserId: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find comment report: ${error.message}`, { id });
  }
}

/**
 * 查找帖子举报列表（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 状态
 * @param {string} [options.postId] - 帖子 ID
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findPostReports({ status, postId, limit = 50, offset = 0 }) {
  try {
    const where = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (postId) {
      where.postId = postId;
    }

    const [data, total] = await Promise.all([
      prisma.postReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.postReport.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find post reports: ${error.message}`);
  }
}

/**
 * 查找评论举报列表（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {string} [options.status] - 状态
 * @param {string} [options.commentId] - 评论 ID
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findCommentReports({ status, commentId, limit = 50, offset = 0 }) {
  try {
    const where = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (commentId) {
      where.commentId = commentId;
    }

    const [data, total] = await Promise.all([
      prisma.commentReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
            },
          },
          comment: {
            select: {
              id: true,
              text: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.commentReport.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find comment reports: ${error.message}`);
  }
}

/**
 * 更新帖子举报
 * @param {string} id - 举报 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的举报
 */
export async function updatePostReport(id, updateData) {
  try {
    return await prisma.postReport.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update post report: ${error.message}`, { id });
  }
}

/**
 * 更新评论举报
 * @param {string} id - 举报 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的举报
 */
export async function updateCommentReport(id, updateData) {
  try {
    return await prisma.commentReport.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
        comment: {
          select: {
            id: true,
            text: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update comment report: ${error.message}`, { id });
  }
}

