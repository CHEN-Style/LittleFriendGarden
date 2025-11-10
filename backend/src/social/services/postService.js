/**
 * Post Service - 帖子业务逻辑层
 * 处理帖子相关的业务逻辑
 */

import * as postRepo from '../repositories/postRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 有效的可见性选项
 */
const VALID_VISIBILITY = ['public', 'friends', 'private'];

/**
 * 创建帖子
 * @param {Object} data - 帖子数据
 * @param {string} userId - 作者 ID
 * @returns {Promise<Object>} 创建的帖子
 */
export async function createPost(data, userId) {
  const { title, text, visibility, topics } = data;

  // 至少需要提供标题或正文其一
  if (!title && !text) {
    throw new ValidationError('Either title or text is required');
  }

  // 验证可见性
  if (visibility && !VALID_VISIBILITY.includes(visibility)) {
    throw new ValidationError(`Invalid visibility. Must be one of: ${VALID_VISIBILITY.join(', ')}`);
  }

  // 创建帖子数据（以 schema 为准）
  const postData = {
    authorUserId: userId,
    title: title || null,
    text: text || null,
    visibility: visibility || 'public',
    topics: topics || [],
    commentCount: 0,
    likeCount: 0,
  };

  const post = await postRepo.createPost(postData);
  return post;
}

/**
 * 获取帖子详情
 * @param {string} id - 帖子 ID
 * @param {string} [userId] - 当前用户 ID（可选）
 * @returns {Promise<Object>} 帖子详情
 */
export async function getPostById(id, userId) {
  const post = await postRepo.findPostById(id);

  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  // 检查可见性权限
  if (post.visibility === 'private' && (!userId || post.authorUserId !== userId)) {
    throw new ForbiddenError('You do not have permission to view this post');
  }

  // friends 可见性检查（这里简化处理，实际需要检查关注关系）
  if (post.visibility === 'friends' && userId !== post.authorUserId) {
    // TODO: 检查用户是否关注作者
    // 暂时允许所有登录用户查看
  }

  return post;
}

/**
 * 获取帖子列表
 * @param {Object} options - 查询选项
 * @param {string} [userId] - 当前用户 ID（用于权限检查）
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPosts(options, userId) {
  // 如果没有指定作者，只返回公开帖子
  if (!options.authorId && !userId) {
    options.visibility = 'public';
  }

  // 如果查询特定作者的帖子，且不是作者本人，只返回公开或 followers 可见的帖子
  if (options.authorId && options.authorId !== userId) {
    // TODO: 检查关注关系
    // 暂时只返回公开帖子
    options.visibility = 'public';
  }

  return await postRepo.findPosts(options);
}

/**
 * 搜索帖子
 * @param {string} keyword - 搜索关键词
 * @param {number} [limit=20] - 结果数量
 * @returns {Promise<Array>} 帖子列表
 */
export async function searchPosts(keyword, limit = 20) {
  if (!keyword || keyword.trim().length === 0) {
    throw new ValidationError('Search keyword is required');
  }

  return await postRepo.searchPosts(keyword.trim(), limit);
}

/**
 * 更新帖子
 * @param {string} id - 帖子 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<Object>} 更新后的帖子
 */
export async function updatePost(id, data, userId) {
  // 检查帖子是否存在
  const post = await postRepo.findPostById(id);

  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  // 只有作者可以修改
  if (post.authorUserId !== userId) {
    throw new ForbiddenError('Only the post author can update this post');
  }

  const { title, text, visibility, topics } = data;

  // 验证可见性
  if (visibility && !VALID_VISIBILITY.includes(visibility)) {
    throw new ValidationError(`Invalid visibility. Must be one of: ${VALID_VISIBILITY.join(', ')}`);
  }

  // 准备更新数据
  const updateData = {
    ...(title !== undefined && { title }),
    ...(text !== undefined && { text }),
    ...(visibility !== undefined && { visibility }),
    ...(topics !== undefined && { topics }),
  };

  return await postRepo.updatePost(id, updateData);
}

/**
 * 删除帖子（软删除）
 * @param {string} id - 帖子 ID
 * @param {string} userId - 请求用户 ID
 * @returns {Promise<void>}
 */
export async function deletePost(id, userId) {
  // 检查帖子是否存在
  const post = await postRepo.findPostById(id);

  if (!post || post.deletedAt) {
    throw new NotFoundError('Post not found');
  }

  // 只有作者可以删除
  if (post.authorUserId !== userId) {
    throw new ForbiddenError('Only the post author can delete this post');
  }

  await postRepo.softDeletePost(id);
}

