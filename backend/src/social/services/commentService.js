/**
 * Comment Service - 评论业务逻辑层
 * 处理评论相关的业务逻辑
 */

import * as commentRepo from '../repositories/commentRepository.js';
import * as postRepo from '../repositories/postRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 创建评论
 * @param {Object} data - 评论数据
 * @param {string} userId - 作者 ID
 * @returns {Promise<Object>} 创建的评论
 */
export async function createComment(data, userId) {
  const { postId, parentCommentId, text } = data;

  // 验证必填字段
  if (!postId || !text) {
    throw new ValidationError('postId and text are required');
  }

  // 验证内容长度
  if (text.length > 2000) {
    throw new ValidationError('Comment content cannot exceed 2000 characters');
  }

  // 验证帖子是否存在
  const post = await postRepo.findPostById(postId);
  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  // 检查帖子是否允许评论
  if (post.allowComments === false) {
    throw new ForbiddenError('Comments are disabled for this post');
  }

  // 如果是回复评论，验证父评论是否存在
  if (parentCommentId) {
    const parentComment = await commentRepo.findCommentById(parentCommentId);
    if (!parentComment || parentComment.deletedAt) {
      throw new NotFoundError('Parent comment not found');
    }

    // 确保父评论属于同一个帖子
    if (parentComment.postId !== postId) {
      throw new ValidationError('Parent comment does not belong to the specified post');
    }
  }

  // 创建评论数据
  const commentData = {
    postId,
    authorUserId: userId,
    parentCommentId: parentCommentId || null,
    text,
    likeCount: 0,
  };

  const comment = await commentRepo.createComment(commentData);

  // 增加帖子评论计数
  await postRepo.incrementCommentCount(postId);

  return comment;
}

/**
 * 获取评论详情
 * @param {string} id - 评论 ID
 * @returns {Promise<Object>} 评论详情
 */
export async function getCommentById(id) {
  const comment = await commentRepo.findCommentById(id);

  if (!comment || comment.deletedAt) {
    throw new NotFoundError('Comment not found');
  }

  return comment;
}

/**
 * 获取帖子的评论列表
 * @param {string} postId - 帖子 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPostComments(postId, options) {
  // 验证帖子是否存在
  const post = await postRepo.findPostById(postId);
  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  return await commentRepo.findCommentsByPostId({
    postId,
    ...options,
  });
}

/**
 * 获取用户的评论列表
 * @param {string} authorId - 作者 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getUserComments(authorId, options) {
  return await commentRepo.findCommentsByAuthorId({
    authorId,
    ...options,
  });
}

/**
 * 更新评论
 * @param {string} id - 评论 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<Object>} 更新后的评论
 */
export async function updateComment(id, data, userId) {
  // 检查评论是否存在
  const comment = await commentRepo.findCommentById(id);

  if (!comment || comment.deletedAt) {
    throw new NotFoundError('Comment not found');
  }

  // 只有作者可以修改
  if (comment.authorUserId !== userId) {
    throw new ForbiddenError('Only the comment author can update this comment');
  }

  const { text } = data;

  // 验证内容长度
  if (text && text.length > 2000) {
    throw new ValidationError('Comment content cannot exceed 2000 characters');
  }

  // 准备更新数据
  const updateData = {
    ...(text !== undefined && { text }),
  };

  return await commentRepo.updateComment(id, updateData);
}

/**
 * 删除评论（软删除）
 * @param {string} id - 评论 ID
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<void>}
 */
export async function deleteComment(id, userId) {
  // 检查评论是否存在
  const comment = await commentRepo.findCommentById(id);

  if (!comment || comment.deletedAt) {
    throw new NotFoundError('Comment not found');
  }

  // 只有作者或帖子作者可以删除
  if (comment.authorUserId !== userId && comment.post.authorUserId !== userId) {
    throw new ForbiddenError('Only the comment author or post author can delete this comment');
  }

  await commentRepo.softDeleteComment(id);

  // 减少帖子评论计数
  await postRepo.decrementCommentCount(comment.postId);
}

