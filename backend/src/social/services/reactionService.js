/**
 * Reaction Service - 点赞业务逻辑层
 * 处理点赞相关的业务逻辑
 */

import * as reactionRepo from '../repositories/reactionRepository.js';
import * as postRepo from '../repositories/postRepository.js';
import * as commentRepo from '../repositories/commentRepository.js';
import { NotFoundError, ValidationError, ConflictError } from '../../errors/index.js';

/**
 * 有效的点赞类型
 */
const VALID_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

/**
 * 为帖子添加点赞
 * @param {Object} data - 点赞数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的点赞
 */
export async function addPostReaction(data, userId) {
  const { postId, type } = data;

  // 验证必填字段
  if (!postId || !type) {
    throw new ValidationError('postId and type are required');
  }

  // 验证点赞类型
  if (!VALID_TYPES.includes(type)) {
    throw new ValidationError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // 验证帖子是否存在
  const post = await postRepo.findPostById(postId);
  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  // 检查用户是否已经点赞过该帖子
  const existingReaction = await reactionRepo.findReaction({
    postId,
    userId,
    type,
  });

  if (existingReaction) {
    throw new ConflictError('You have already reacted to this post');
  }

  // 创建点赞数据
  const reactionData = {
    postId,
    userId,
    type,
  };

  const reaction = await reactionRepo.createReaction(reactionData);

  // 增加帖子点赞计数
  await postRepo.incrementLikeCount(postId);

  return reaction;
}

/**
 * 为评论添加点赞
 * @param {Object} data - 点赞数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的点赞
 */
export async function addCommentReaction(data, userId) {
  const { commentId, type } = data;

  // 验证必填字段
  if (!commentId || !type) {
    throw new ValidationError('commentId and type are required');
  }

  // 验证点赞类型
  if (!VALID_TYPES.includes(type)) {
    throw new ValidationError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // 验证评论是否存在
  const comment = await commentRepo.findCommentById(commentId);
  if (!comment || comment.deletedAt) {
    throw new NotFoundError('Comment not found');
  }

  // 检查用户是否已经点赞过该评论
  const existingReaction = await reactionRepo.findReaction({
    commentId,
    userId,
    type,
  });

  if (existingReaction) {
    throw new ConflictError('You have already reacted to this comment');
  }

  // 创建点赞数据
  const reactionData = {
    commentId,
    userId,
    type,
  };

  const reaction = await reactionRepo.createReaction(reactionData);

  // 增加评论点赞计数
  await commentRepo.incrementLikeCount(commentId);

  return reaction;
}

/**
 * 移除帖子点赞
 * @param {string} postId - 帖子 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function removePostReaction(postId, userId) {
  // 查找点赞
  const reaction = await reactionRepo.findReaction({
    postId,
    userId,
  });

  if (!reaction) {
    throw new NotFoundError('Reaction not found');
  }

  // 删除点赞
  await reactionRepo.deleteReaction(reaction.id);

  // 减少帖子点赞计数
  await postRepo.decrementLikeCount(postId);
}

/**
 * 移除评论点赞
 * @param {string} commentId - 评论 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function removeCommentReaction(commentId, userId) {
  // 查找点赞
  const reaction = await reactionRepo.findReaction({
    commentId,
    userId,
  });

  if (!reaction) {
    throw new NotFoundError('Reaction not found');
  }

  // 删除点赞
  await reactionRepo.deleteReaction(reaction.id);

  // 减少评论点赞计数
  await commentRepo.decrementLikeCount(commentId);
}

/**
 * 获取帖子的点赞列表
 * @param {string} postId - 帖子 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPostReactions(postId, options) {
  // 验证帖子是否存在
  const post = await postRepo.findPostById(postId);
  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  return await reactionRepo.findReactionsByPostId({
    postId,
    ...options,
  });
}

/**
 * 获取评论的点赞列表
 * @param {string} commentId - 评论 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getCommentReactions(commentId, options) {
  // 验证评论是否存在
  const comment = await commentRepo.findCommentById(commentId);
  if (!comment || comment.deletedAt) {
    throw new NotFoundError('Comment not found');
  }

  return await reactionRepo.findReactionsByCommentId({
    commentId,
    ...options,
  });
}

/**
 * 获取用户的点赞列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getUserReactions(userId, options) {
  return await reactionRepo.findReactionsByUserId({
    userId,
    ...options,
  });
}

/**
 * 获取帖子的点赞统计
 * @param {string} postId - 帖子 ID
 * @returns {Promise<Array>} 统计数据
 */
export async function getPostReactionStats(postId) {
  return await reactionRepo.getPostReactionStats(postId);
}

/**
 * 获取评论的点赞统计
 * @param {string} commentId - 评论 ID
 * @returns {Promise<Array>} 统计数据
 */
export async function getCommentReactionStats(commentId) {
  return await reactionRepo.getCommentReactionStats(commentId);
}

