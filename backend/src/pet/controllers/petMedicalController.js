/**
 * Pet Medical Controller - 宠物医疗记录控制器
 * 处理医疗记录相关的 HTTP 请求
 */

import * as medicalService from '../services/petMedicalService.js';

/**
 * @route   POST /api/pets/:petId/medicals
 * @desc    创建医疗记录
 * @access  Private
 */
export async function createMedical(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const medical = await medicalService.createMedical(
    {
      petId,
      ...req.body,
    },
    userId
  );

  res.status(201).json({
    success: true,
    data: medical,
  });
}

/**
 * @route   POST /api/medicals/batch
 * @desc    批量创建医疗记录
 * @access  Private
 */
export async function createMedicalBatch(req, res) {
  const userId = req.user.userId;
  const { medicals } = req.body;

  const result = await medicalService.createMedicalBatch(medicals, userId);

  res.status(201).json({
    success: true,
    data: result,
    message: `Created ${result.count} medical records`,
  });
}

/**
 * @route   GET /api/medicals/:id
 * @desc    获取医疗记录详情
 * @access  Private
 */
export async function getMedicalById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const medical = await medicalService.getMedicalById(id, userId);

  res.json({
    success: true,
    data: medical,
  });
}

/**
 * @route   GET /api/pets/:petId/medicals
 * @desc    获取宠物的医疗记录列表
 * @access  Private
 */
export async function getPetMedicals(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { recordType, startDate, endDate, limit, offset } = req.query;

  const options = {
    recordType,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await medicalService.getPetMedicals(petId, options, userId);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/medicals/my
 * @desc    获取当前用户的医疗记录列表
 * @access  Private
 */
export async function getUserMedicals(req, res) {
  const userId = req.user.userId;

  const { startDate, endDate, limit, offset } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  const result = await medicalService.getUserMedicals(userId, options);

  res.json({
    success: true,
    data: result.data,
    total: result.total,
    limit: options.limit,
    offset: options.offset,
  });
}

/**
 * @route   GET /api/pets/:petId/medicals/vaccines/upcoming
 * @desc    获取即将到期的疫苗
 * @access  Private
 */
export async function getUpcomingVaccines(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { daysAhead } = req.query;

  const vaccines = await medicalService.getUpcomingVaccines(
    petId,
    daysAhead ? parseInt(daysAhead) : 30,
    userId
  );

  res.json({
    success: true,
    data: vaccines,
  });
}

/**
 * @route   GET /api/medicals/vaccines/upcoming
 * @desc    获取所有宠物即将到期的疫苗
 * @access  Private
 */
export async function getAllUpcomingVaccines(req, res) {
  const userId = req.user.userId;

  const { daysAhead } = req.query;

  const vaccines = await medicalService.getUpcomingVaccines(
    null,
    daysAhead ? parseInt(daysAhead) : 30,
    userId
  );

  res.json({
    success: true,
    data: vaccines,
  });
}

/**
 * @route   GET /api/pets/:petId/medicals/vaccines/history
 * @desc    获取疫苗接种历史
 * @access  Private
 */
export async function getVaccineHistory(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const history = await medicalService.getVaccineHistory(petId, userId);

  res.json({
    success: true,
    data: history,
  });
}

/**
 * @route   GET /api/pets/:petId/medicals/stats
 * @desc    获取医疗统计（按类型）
 * @access  Private
 */
export async function getMedicalStatsByType(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const stats = await medicalService.getMedicalStatsByType(petId, options, userId);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * @route   GET /api/pets/:petId/medicals/cost
 * @desc    获取总费用统计
 * @access  Private
 */
export async function getTotalCost(req, res) {
  const { petId } = req.params;
  const userId = req.user.userId;

  const { startDate, endDate } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const cost = await medicalService.getTotalCost(petId, options, userId);

  res.json({
    success: true,
    data: cost,
  });
}

/**
 * @route   PATCH /api/medicals/:id
 * @desc    更新医疗记录
 * @access  Private (仅记录创建者)
 */
export async function updateMedical(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const medical = await medicalService.updateMedical(id, req.body, userId);

  res.json({
    success: true,
    data: medical,
  });
}

/**
 * @route   DELETE /api/medicals/:id
 * @desc    删除医疗记录（软删除）
 * @access  Private (仅记录创建者)
 */
export async function deleteMedical(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  await medicalService.deleteMedical(id, userId);

  res.json({
    success: true,
    message: 'Medical record deleted successfully',
  });
}

