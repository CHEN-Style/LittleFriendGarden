/**
 * Pet Weight Controller - 宠物体重记录控制器
 * 处理体重记录相关的 HTTP 请求
 */

import * as weightService from '../services/petWeightService.js';

/**
 * @route   POST /api/pets/:petId/weights
 * @desc    创建体重记录
 * @access  Private
 */
export async function createWeight(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const weight = await weightService.createWeight(
    {
      petId,
      ...req.body,
    },
    userId
  );

  res.status(201).json({
    success: true,
    data: weight,
  });
}

/**
 * @route   POST /api/weights/batch
 * @desc    批量创建体重记录
 * @access  Private
 */
export async function createWeightBatch(req, res) {
  const userId = req.user.userId;
  const { weights } = req.body;

  const result = await weightService.createWeightBatch(weights, userId);

  res.status(201).json({
    success: true,
    data: result,
    message: `Created ${result.count} weight records`,
  });
}

/**
 * @route   GET /api/weights/:id
 * @desc    获取体重记录详情
 * @access  Private
 */
export async function getWeightById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const weight = await weightService.getWeightById(id, userId);

  res.json({
    success: true,
    data: weight,
  });
}

/**
 * @route   GET /api/pets/:petId/weights
 * @desc    获取宠物的体重记录列表
 * @access  Private
 */
export async function getPetWeights(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate, limit, offset } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await weightService.getPetWeights(petId, options, userId);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/pets/:petId/weights/latest
 * @desc    获取最新体重记录
 * @access  Private
 */
export async function getLatestWeight(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const weight = await weightService.getLatestWeight(petId, userId);

  res.json({
    success: true,
    data: weight,
  });
}

/**
 * @route   GET /api/pets/:petId/weights/stats
 * @desc    获取体重统计
 * @access  Private
 */
export async function getWeightStats(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const stats = await weightService.getWeightStats(petId, options, userId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   PATCH /api/weights/:id
 * @desc    更新体重记录
 * @access  Private
 */
export async function updateWeight(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const weight = await weightService.updateWeight(id, req.body, userId);

  res.json({
    success: true,
    data: weight,
  });
}

/**
 * @route   DELETE /api/weights/:id
 * @desc    删除体重记录（软删除）
 * @access  Private
 */
export async function deleteWeight(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await weightService.deleteWeight(id, userId);

  res.json({
    success: true,
    message: 'Weight record deleted successfully',
  });
}

