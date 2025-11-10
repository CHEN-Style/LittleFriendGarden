/**
 * Report Service - 举报业务逻辑层
 * 处理举报相关的业务逻辑
 */

import * as reportRepo from '../repositories/reportRepository.js';
import * as postRepo from '../repositories/postRepository.js';
import * as commentRepo from '../repositories/commentRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 有效的举报原因代码
 */
const VALID_REASON_CODES = ['spam', 'abuse', 'harassment', 'inappropriate', 'copyright', 'other'];

/**
 * 有效的举报状态
 */
const VALID_STATUSES = ['pending', 'reviewing', 'resolved', 'rejected'];

/**
 * 创建帖子举报
 * @param {Object} data - 举报数据
 * @param {string} userId - 举报者 ID
 * @returns {Promise<Object>} 创建的举报
 */
export async function createPostReport(data, userId) {
  const { postId, reasonCode, reasonText } = data;

  // 验证必填字段
  if (!postId || !reasonCode) {
    throw new ValidationError('postId and reasonCode are required');
  }

  // 验证举报原因
  if (!VALID_REASON_CODES.includes(reasonCode)) {
    throw new ValidationError(`Invalid reasonCode. Must be one of: ${VALID_REASON_CODES.join(', ')}`);
  }

  // 验证帖子是否存在
  const post = await postRepo.findPostById(postId);
  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  // 不能举报自己的帖子
  if (post.authorUserId === userId) {
    throw new ValidationError('You cannot report your own post');
  }

  // 创建举报数据
  const reportData = {
    postId,
    reporterId: userId,
    reasonCode,
    reasonText,
    status: 'pending',
  };

  return await reportRepo.createPostReport(reportData);
}

/**
 * 创建评论举报
 * @param {Object} data - 举报数据
 * @param {string} userId - 举报者 ID
 * @returns {Promise<Object>} 创建的举报
 */
export async function createCommentReport(data, userId) {
  const { commentId, reasonCode, reasonText } = data;

  // 验证必填字段
  if (!commentId || !reasonCode) {
    throw new ValidationError('commentId and reasonCode are required');
  }

  // 验证举报原因
  if (!VALID_REASON_CODES.includes(reasonCode)) {
    throw new ValidationError(`Invalid reasonCode. Must be one of: ${VALID_REASON_CODES.join(', ')}`);
  }

  // 验证评论是否存在
  const comment = await commentRepo.findCommentById(commentId);
  if (!comment || comment.deletedAt) {
    throw new NotFoundError('Comment not found');
  }

  // 不能举报自己的评论
  if (comment.authorUserId === userId) {
    throw new ValidationError('You cannot report your own comment');
  }

  // 创建举报数据
  const reportData = {
    commentId,
    reporterId: userId,
    reasonCode,
    reasonText,
    status: 'pending',
  };

  return await reportRepo.createCommentReport(reportData);
}

/**
 * 获取帖子举报详情
 * @param {string} id - 举报 ID
 * @returns {Promise<Object>} 举报详情
 */
export async function getPostReportById(id) {
  const report = await reportRepo.findPostReportById(id);

  if (!report || report.deletedAt) {
    throw new NotFoundError('Report not found');
  }

  return report;
}

/**
 * 获取评论举报详情
 * @param {string} id - 举报 ID
 * @returns {Promise<Object>} 举报详情
 */
export async function getCommentReportById(id) {
  const report = await reportRepo.findCommentReportById(id);

  if (!report || report.deletedAt) {
    throw new NotFoundError('Report not found');
  }

  return report;
}

/**
 * 获取帖子举报列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPostReports(options) {
  return await reportRepo.findPostReports(options);
}

/**
 * 获取评论举报列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getCommentReports(options) {
  return await reportRepo.findCommentReports(options);
}

/**
 * 处理帖子举报（管理员功能）
 * @param {string} id - 举报 ID
 * @param {Object} data - 处理数据
 * @param {string} userId - 管理员 ID
 * @returns {Promise<Object>} 更新后的举报
 */
export async function handlePostReport(id, data, userId) {
  // 检查举报是否存在
  const report = await getPostReportById(id);

  const { status, resolution } = data;

  // 验证状态
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // 准备更新数据
  const updateData = {
    ...(status && { status }),
    ...(resolution !== undefined && { resolution }),
    moderatorId: userId,
  };

  return await reportRepo.updatePostReport(id, updateData);
}

/**
 * 处理评论举报（管理员功能）
 * @param {string} id - 举报 ID
 * @param {Object} data - 处理数据
 * @param {string} userId - 管理员 ID
 * @returns {Promise<Object>} 更新后的举报
 */
export async function handleCommentReport(id, data, userId) {
  // 检查举报是否存在
  const report = await getCommentReportById(id);

  const { status, resolution } = data;

  // 验证状态
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // 准备更新数据
  const updateData = {
    ...(status && { status }),
    ...(resolution !== undefined && { resolution }),
    moderatorId: userId,
  };

  return await reportRepo.updateCommentReport(id, updateData);
}

