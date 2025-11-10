/**
 * Reaction Controller - 点赞控制器
 * 处理点赞相关的 HTTP 请求
 */

import * as reactionService from '../services/reactionService.js';

/**
 * @route   POST /api/posts/:postId/reactions
 * @desc    为帖子添加点赞
 * @access  Private
 */
export async function addPostReaction(req, res) {
  const { postId } = req.params;
  const userId = req.user.userId;

  const reaction = await reactionService.addPostReaction(
    {
      postId,
      ...req.body,
    },
    userId
  );

  res.status(201).json({
    success: true,
    data: reaction,
  });
}

/**
 * @route   DELETE /api/posts/:postId/reactions
 * @desc    移除帖子点赞
 * @access  Private
 */
export async function removePostReaction(req, res) {
  const { postId } = req.params;
  const userId = req.user.userId;

  await reactionService.removePostReaction(postId, userId);

  res.json({
    success: true,
    message: 'Reaction removed successfully',
  });
}

/**
 * @route   GET /api/posts/:postId/reactions
 * @desc    获取帖子的点赞列表
 * @access  Public
 */
export async function getPostReactions(req, res) {
  const { postId } = req.params;
  const { kind, limit, offset } = req.query;

  const options = {
    kind,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reactionService.getPostReactions(postId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/posts/:postId/reactions/stats
 * @desc    获取帖子的点赞统计
 * @access  Public
 */
export async function getPostReactionStats(req, res) {
  const { postId } = req.params;

  const stats = await reactionService.getPostReactionStats(postId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   POST /api/comments/:commentId/reactions
 * @desc    为评论添加点赞
 * @access  Private
 */
export async function addCommentReaction(req, res) {
  const { commentId } = req.params;
  const userId = req.user.userId;

  const reaction = await reactionService.addCommentReaction(
    {
      commentId,
      ...req.body,
    },
    userId
  );

  res.status(201).json({
    success: true,
    data: reaction,
  });
}

/**
 * @route   DELETE /api/comments/:commentId/reactions
 * @desc    移除评论点赞
 * @access  Private
 */
export async function removeCommentReaction(req, res) {
  const { commentId } = req.params;
  const userId = req.user.userId;

  await reactionService.removeCommentReaction(commentId, userId);

  res.json({
    success: true,
    message: 'Reaction removed successfully',
  });
}

/**
 * @route   GET /api/comments/:commentId/reactions
 * @desc    获取评论的点赞列表
 * @access  Public
 */
export async function getCommentReactions(req, res) {
  const { commentId } = req.params;
  const { kind, limit, offset } = req.query;

  const options = {
    kind,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reactionService.getCommentReactions(commentId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/comments/:commentId/reactions/stats
 * @desc    获取评论的点赞统计
 * @access  Public
 */
export async function getCommentReactionStats(req, res) {
  const { commentId } = req.params;

  const stats = await reactionService.getCommentReactionStats(commentId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   GET /api/users/:userId/reactions
 * @desc    获取用户的点赞列表
 * @access  Public
 */
export async function getUserReactions(req, res) {
  const { userId } = req.params;
  const { limit, offset } = req.query;

  const options = {
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reactionService.getUserReactions(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

