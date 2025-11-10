/**
 * Report Controller - 举报控制器
 * 处理举报相关的 HTTP 请求
 */

import * as reportService from '../services/reportService.js';

/**
 * @route   POST /api/reports/posts
 * @desc    举报帖子
 * @access  Private
 */
export async function createPostReport(req, res) {
  const userId = req.user.userId;
  const report = await reportService.createPostReport(req.body, userId);

  res.status(201).json({
    success: true,
    data: report,
  });
}

/**
 * @route   POST /api/reports/comments
 * @desc    举报评论
 * @access  Private
 */
export async function createCommentReport(req, res) {
  const userId = req.user.userId;
  const report = await reportService.createCommentReport(req.body, userId);

  res.status(201).json({
    success: true,
    data: report,
  });
}

/**
 * @route   GET /api/reports/posts
 * @desc    获取帖子举报列表（管理员功能）
 * @access  Private (Admin)
 */
export async function getPostReports(req, res) {
  const { status, postId, limit, offset } = req.query;

  const options = {
    status,
    postId,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reportService.getPostReports(options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/reports/comments
 * @desc    获取评论举报列表（管理员功能）
 * @access  Private (Admin)
 */
export async function getCommentReports(req, res) {
  const { status, commentId, limit, offset } = req.query;

  const options = {
    status,
    commentId,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await reportService.getCommentReports(options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/reports/posts/:id
 * @desc    获取帖子举报详情（管理员功能）
 * @access  Private (Admin)
 */
export async function getPostReportById(req, res) {
  const { id } = req.params;
  const report = await reportService.getPostReportById(id);

  res.json({
    success: true,
    data: report,
  });
}

/**
 * @route   GET /api/reports/comments/:id
 * @desc    获取评论举报详情（管理员功能）
 * @access  Private (Admin)
 */
export async function getCommentReportById(req, res) {
  const { id } = req.params;
  const report = await reportService.getCommentReportById(id);

  res.json({
    success: true,
    data: report,
  });
}

/**
 * @route   PATCH /api/reports/posts/:id
 * @desc    处理帖子举报（管理员功能）
 * @access  Private (Admin)
 */
export async function handlePostReport(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const report = await reportService.handlePostReport(id, req.body, userId);

  res.json({
    success: true,
    data: report,
  });
}

/**
 * @route   PATCH /api/reports/comments/:id
 * @desc    处理评论举报（管理员功能）
 * @access  Private (Admin)
 */
export async function handleCommentReport(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const report = await reportService.handleCommentReport(id, req.body, userId);

  res.json({
    success: true,
    data: report,
  });
}

