/**
 * Post Controller - 帖子控制器
 * 处理帖子相关的 HTTP 请求
 */

import * as postService from '../services/postService.js';

/**
 * @route   POST /api/posts
 * @desc    创建帖子
 * @access  Private
 */
export async function createPost(req, res) {
  const userId = req.user.userId;
  const post = await postService.createPost(req.body, userId);

  res.status(201).json({
    success: true,
    data: post,
  });
}

/**
 * @route   GET /api/posts
 * @desc    获取帖子列表
 * @access  Public
 */
export async function getPosts(req, res) {
  const userId = req.user?.userId;
  const { topicId, authorId, visibility, limit, offset } = req.query;

  const options = {
    topicId,
    authorId,
    visibility,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await postService.getPosts(options, userId);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/posts/search
 * @desc    搜索帖子
 * @access  Public
 */
export async function searchPosts(req, res) {
  const { q, limit } = req.query;

  const posts = await postService.searchPosts(q, limit ? parseInt(limit) : 20);

  res.json({
    success: true,
    data: posts,
  });
}

/**
 * @route   GET /api/posts/:id
 * @desc    获取帖子详情
 * @access  Public / Private
 */
export async function getPostById(req, res) {
  const { id } = req.params;
  const userId = req.user?.userId;

  const post = await postService.getPostById(id, userId);

  res.json({
    success: true,
    data: post,
  });
}

/**
 * @route   PATCH /api/posts/:id
 * @desc    更新帖子
 * @access  Private (仅作者)
 */
export async function updatePost(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const post = await postService.updatePost(id, req.body, userId);

  res.json({
    success: true,
    data: post,
  });
}

/**
 * @route   DELETE /api/posts/:id
 * @desc    删除帖子（软删除）
 * @access  Private (仅作者)
 */
export async function deletePost(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await postService.deletePost(id, userId);

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
}

