/**
 * Comment Controller - 评论控制器
 * 处理评论相关的 HTTP 请求
 */

import * as commentService from '../services/commentService.js';

/**
 * @route   POST /api/comments
 * @desc    创建评论
 * @access  Private
 */
export async function createComment(req, res) {
  const userId = req.user.userId;
  const comment = await commentService.createComment(req.body, userId);

  res.status(201).json({
    success: true,
    data: comment,
  });
}

/**
 * @route   GET /api/comments/:id
 * @desc    获取评论详情
 * @access  Public
 */
export async function getCommentById(req, res) {
  const { id } = req.params;
  const comment = await commentService.getCommentById(id);

  res.json({
    success: true,
    data: comment,
  });
}

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    获取帖子的评论列表
 * @access  Public
 */
export async function getPostComments(req, res) {
  const { postId } = req.params;
  const { parentId, limit, offset } = req.query;

  const options = {
    parentId: parentId || undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await commentService.getPostComments(postId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/users/:userId/comments
 * @desc    获取用户的评论列表
 * @access  Public
 */
export async function getUserComments(req, res) {
  const { userId } = req.params;
  const { limit, offset } = req.query;

  const options = {
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await commentService.getUserComments(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   PATCH /api/comments/:id
 * @desc    更新评论
 * @access  Private (仅作者)
 */
export async function updateComment(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const comment = await commentService.updateComment(id, req.body, userId);

  res.json({
    success: true,
    data: comment,
  });
}

/**
 * @route   DELETE /api/comments/:id
 * @desc    删除评论（软删除）
 * @access  Private (作者或帖子作者)
 */
export async function deleteComment(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await commentService.deleteComment(id, userId);

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
}

