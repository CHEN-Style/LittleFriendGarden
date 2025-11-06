/**
 * Pet Feeding Controller - 宠物喂养记录控制器
 * 处理喂养记录相关的 HTTP 请求
 */

import * as feedingService from '../services/petFeedingService.js';

/**
 * @route   POST /api/pets/:petId/feedings
 * @desc    创建喂养记录
 * @access  Private
 */
export async function createFeeding(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const feeding = await feedingService.createFeeding(
    {
      petId,
      ...req.body,
    },
    userId
  );

  res.status(201).json({
    success: true,
    data: feeding,
  });
}

/**
 * @route   POST /api/feedings/batch
 * @desc    批量创建喂养记录
 * @access  Private
 */
export async function createFeedingBatch(req, res) {
  const userId = req.user.userId;
  const { feedings } = req.body;

  const result = await feedingService.createFeedingBatch(feedings, userId);

  res.status(201).json({
    success: true,
    data: result,
    message: `Created ${result.count} feeding records`,
  });
}

/**
 * @route   GET /api/feedings/:id
 * @desc    获取喂养记录详情
 * @access  Private
 */
export async function getFeedingById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const feeding = await feedingService.getFeedingById(id, userId);

  res.json({
    success: true,
    data: feeding,
  });
}

/**
 * @route   GET /api/pets/:petId/feedings
 * @desc    获取宠物的喂养记录列表
 * @access  Private
 */
export async function getPetFeedings(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate, limit, offset } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await feedingService.getPetFeedings(petId, options, userId);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/feedings/my
 * @desc    获取当前用户的喂养记录列表
 * @access  Private
 */
export async function getUserFeedings(req, res) {
  const userId = req.user.userId;

  const { startDate, endDate, limit, offset } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await feedingService.getUserFeedings(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/pets/:petId/feedings/summary
 * @desc    获取日喂养汇总
 * @access  Private
 */
export async function getDailyFeedingSummary(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const summary = await feedingService.getDailyFeedingSummary(petId, options, userId);

  res.json({
    success: true,
    data: summary,
  });
}

/**
 * @route   GET /api/pets/:petId/feedings/stats
 * @desc    获取喂养统计
 * @access  Private
 */
export async function getFeedingStats(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const stats = await feedingService.getFeedingStats(petId, options, userId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   PATCH /api/feedings/:id
 * @desc    更新喂养记录
 * @access  Private (仅记录创建者)
 */
export async function updateFeeding(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const feeding = await feedingService.updateFeeding(id, req.body, userId);

  res.json({
    success: true,
    data: feeding,
  });
}

/**
 * @route   DELETE /api/feedings/:id
 * @desc    删除喂养记录（软删除）
 * @access  Private (仅记录创建者)
 */
export async function deleteFeeding(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await feedingService.deleteFeeding(id, userId);

  res.json({
    success: true,
    message: 'Feeding record deleted successfully',
  });
}

