/**
 * Topic Controller - 话题控制器
 * 处理话题相关的 HTTP 请求
 */

import * as topicService from '../services/topicService.js';

/**
 * @route   POST /api/topics
 * @desc    创建话题
 * @access  Private
 */
export async function createTopic(req, res) {
  const userId = req.user.userId;
  const topic = await topicService.createTopic(req.body, userId);

  res.status(201).json({
    success: true,
    data: topic,
  });
}

/**
 * @route   GET /api/topics
 * @desc    获取话题列表
 * @access  Public
 */
export async function getTopics(req, res) {
  const { isOfficial, limit, offset } = req.query;

  const options = {
    isOfficial: isOfficial === 'true' ? true : isOfficial === 'false' ? false : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await topicService.getTopics(options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/topics/search
 * @desc    搜索话题
 * @access  Public
 */
export async function searchTopics(req, res) {
  const { q, limit } = req.query;

  const topics = await topicService.searchTopics(q, limit ? parseInt(limit) : 20);

  res.json({
    success: true,
    data: topics,
  });
}

/**
 * @route   GET /api/topics/:id
 * @desc    获取话题详情（通过 ID）
 * @access  Public
 */
export async function getTopicById(req, res) {
  const { id } = req.params;
  const topic = await topicService.getTopicById(id);

  res.json({
    success: true,
    data: topic,
  });
}

/**
 * @route   GET /api/topics/slug/:slug
 * @desc    获取话题详情（通过 slug）
 * @access  Public
 */
export async function getTopicBySlug(req, res) {
  const { slug } = req.params;
  const topic = await topicService.getTopicBySlug(slug);

  res.json({
    success: true,
    data: topic,
  });
}

/**
 * @route   PATCH /api/topics/:id
 * @desc    更新话题
 * @access  Private (仅创建者)
 */
export async function updateTopic(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const topic = await topicService.updateTopic(id, req.body, userId);

  res.json({
    success: true,
    data: topic,
  });
}

/**
 * @route   DELETE /api/topics/:id
 * @desc    删除话题（软删除）
 * @access  Private (仅创建者)
 */
export async function deleteTopic(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await topicService.deleteTopic(id, userId);

  res.json({
    success: true,
    message: 'Topic deleted successfully',
  });
}

