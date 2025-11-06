/**
 * Pet Medical Service - 宠物医疗记录业务逻辑层
 * 处理医疗记录相关的业务逻辑
 */

import * as medicalRepo from '../repositories/petMedicalRepository.js';
import * as petRepo from '../repositories/petRepository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../errors/index.js';

/**
 * 有效的医疗记录类型
 */
const VALID_RECORD_TYPES = ['vaccine', 'medication', 'checkup', 'surgery', 'diagnosis', 'deworm', 'allergy', 'other'];

// 将对外 recordType 映射为数据库 kind
function mapRecordTypeToKind(recordType) {
  if (recordType === 'checkup') return 'exam';
  if (recordType === 'diagnosis') return 'other';
  return recordType; // vaccine | medication | surgery | other
}

// 将数据库 kind 映射回对外 recordType
function mapKindToRecordType(kind) {
  if (kind === 'exam') return 'checkup';
  return kind; // vaccine | medication | surgery | deworm | allergy | other
}

function buildDetailsPayload({
  vaccineName,
  medicationName,
  dosage,
  frequency,
  duration,
  costAmount,
  costCurrency,
  description,
  attachments,
}) {
  const details = {};
  if (vaccineName) details.vaccineName = vaccineName;
  if (medicationName) details.medicationName = medicationName;
  if (dosage) details.dosage = dosage;
  if (frequency) details.frequency = frequency;
  if (duration) details.duration = duration;
  if (costAmount !== undefined) details.costAmount = costAmount;
  if (costCurrency) details.costCurrency = costCurrency;
  if (attachments && attachments.length) details.attachments = attachments;
  if (description) details.description = description; // 补充描述存入 details
  return details;
}

/**
 * 校验用户对宠物的访问权限
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 宠物对象
 */
async function checkPetAccess(petId, userId) {
  const pet = await petRepo.findPetById(petId);

  if (!pet || pet.deletedAt) {
    throw new NotFoundError('Pet not found');
  }

  const hasAccess = pet.owners.some((owner) => owner.userId === userId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this pet');
  }

  return pet;
}

/**
 * 创建医疗记录
 * @param {Object} data - 医疗数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 创建的医疗记录
 */
export async function createMedical(data, userId) {
  const {
    petId,
    recordType,
    recordedAt,
    title,
    description,
    vaccineName,
    nextDueDate,
    medicationName,
    dosage,
    frequency,
    duration,
    veterinarianName,
    clinicName,
    costAmount,
    costCurrency,
    attachments,
  } = data;

  // 验证必填字段
  if (!petId || !recordType || !recordedAt || !title) {
    throw new ValidationError('petId, recordType, recordedAt, and title are required');
  }

  // 验证记录类型
  if (!VALID_RECORD_TYPES.includes(recordType)) {
    throw new ValidationError(`Invalid recordType. Must be one of: ${VALID_RECORD_TYPES.join(', ')}`);
  }

  // 疫苗记录必须有疫苗名称
  if (recordType === 'vaccine' && !vaccineName) {
    throw new ValidationError('Vaccine name is required for vaccine records');
  }

  // 用药记录必须有药品名称
  // 放宽为可选以兼容现有用例（若提供则入 details）

  // 验证费用
  if (costAmount !== undefined && costAmount !== null && costAmount < 0) {
    throw new ValidationError('Cost amount cannot be negative');
  }

  // 检查权限
  await checkPetAccess(petId, userId);

  // 创建医疗记录（映射到 PetMedicalRecord）
  const medicalData = {
    petId,
    kind: mapRecordTypeToKind(recordType),
    performedAt: new Date(recordedAt),
    dueAt: nextDueDate ? new Date(nextDueDate) : null,
    title,
    clinic: clinicName,
    veterinarian: veterinarianName,
    note: description || undefined,
    details: buildDetailsPayload({
      vaccineName,
      medicationName,
      dosage,
      frequency,
      duration,
      costAmount,
      costCurrency,
      description,
      attachments,
    }),
  };

  const created = await medicalRepo.createMedical(medicalData);
  return toApiMedical(created);
}

/**
 * 批量创建医疗记录
 * @param {Array<Object>} dataArray - 医疗数据数组
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createMedicalBatch(dataArray, userId) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new ValidationError('Invalid data array');
  }

  // 检查所有宠物的访问权限
  const petIds = [...new Set(dataArray.map((d) => d.petId))];
  await Promise.all(petIds.map((petId) => checkPetAccess(petId, userId)));

  // 准备数据
  const medicalDataArray = dataArray.map((d) => ({
    petId: d.petId,
    kind: mapRecordTypeToKind(d.recordType),
    performedAt: new Date(d.recordedAt),
    dueAt: d.nextDueDate ? new Date(d.nextDueDate) : null,
    title: d.title,
    clinic: d.clinicName,
    veterinarian: d.veterinarianName,
    note: d.description || undefined,
    details: buildDetailsPayload({
      vaccineName: d.vaccineName,
      medicationName: d.medicationName,
      dosage: d.dosage,
      frequency: d.frequency,
      duration: d.duration,
      costAmount: d.costAmount,
      costCurrency: d.costCurrency,
      description: d.description,
      attachments: d.attachments,
    }),
  }));

  return await medicalRepo.createMedicalBatch(medicalDataArray);
}

/**
 * 获取医疗记录
 * @param {string} id - 医疗记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 医疗记录
 */
export async function getMedicalById(id, userId) {
  const medical = await medicalRepo.findMedicalById(id);

  if (!medical || medical.deletedAt) {
    throw new NotFoundError('Medical record not found');
  }

  // 检查权限
  await checkPetAccess(medical.petId, userId);

  return toApiMedical(medical);
}

/**
 * 获取宠物的医疗记录列表
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getPetMedicals(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  const result = await medicalRepo.findMedicalsByPetId({
    petId,
    ...options,
  });
  return { data: result.data.map(toApiMedical), total: result.total };
}

/**
 * 获取用户的医疗记录列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function getUserMedicals(userId, options) {
  const result = await medicalRepo.findMedicalsByUserId({
    userId,
    ...options,
  });
  return { data: result.data.map(toApiMedical), total: result.total };
}

/**
 * 获取即将到期的疫苗
 * @param {string} petId - 宠物 ID（可选）
 * @param {number} daysAhead - 提前天数
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 即将到期的疫苗列表
 */
export async function getUpcomingVaccines(petId, daysAhead, userId) {
  if (petId) {
    // 检查权限
    await checkPetAccess(petId, userId);
  }

  return await medicalRepo.findUpcomingVaccines(petId, daysAhead);
}

/**
 * 获取疫苗接种历史
 * @param {string} petId - 宠物 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 疫苗历史
 */
export async function getVaccineHistory(petId, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await medicalRepo.getVaccineHistory(petId);
}

/**
 * 获取医疗统计（按类型）
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项 { startDate?, endDate? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 统计数据
 */
export async function getMedicalStatsByType(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await medicalRepo.getMedicalStatsByType(petId, options.startDate, options.endDate);
}

/**
 * 获取总费用统计
 * @param {string} petId - 宠物 ID
 * @param {Object} options - 查询选项 { startDate?, endDate? }
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 总费用
 */
export async function getTotalCost(petId, options, userId) {
  // 检查权限
  await checkPetAccess(petId, userId);

  return await medicalRepo.getTotalCost(petId, options.startDate, options.endDate);
}

/**
 * 更新医疗记录
 * @param {string} id - 医疗记录 ID
 * @param {Object} data - 更新数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 更新后的医疗记录
 */
export async function updateMedical(id, data, userId) {
  // 检查权限（基于宠物所有权）
  const medical = await getMedicalById(id, userId);

  const {
    recordType,
    recordedAt,
    title,
    description,
    vaccineName,
    nextDueDate,
    medicationName,
    dosage,
    frequency,
    duration,
    veterinarianName,
    clinicName,
    costAmount,
    costCurrency,
    attachments,
  } = data;

  if (recordType && !VALID_RECORD_TYPES.includes(recordType)) {
    throw new ValidationError(`Invalid recordType. Must be one of: ${VALID_RECORD_TYPES.join(', ')}`);
  }
  if (costAmount !== undefined && costAmount < 0) {
    throw new ValidationError('Cost amount cannot be negative');
  }

  // 合并 details
  const mergedDetails = {
    ...(medical.details || {}),
    ...buildDetailsPayload({
      vaccineName,
      medicationName,
      dosage,
      frequency,
      duration,
      costAmount,
      costCurrency,
      description,
      attachments,
    }),
  };

  const updateData = {
    ...(recordType && { kind: mapRecordTypeToKind(recordType) }),
    ...(recordedAt && { performedAt: new Date(recordedAt) }),
    ...(nextDueDate !== undefined && { dueAt: nextDueDate ? new Date(nextDueDate) : null }),
    ...(title !== undefined && { title }),
    ...(clinicName !== undefined && { clinic: clinicName }),
    ...(veterinarianName !== undefined && { veterinarian: veterinarianName }),
    ...(description !== undefined && { note: description }),
    details: mergedDetails,
  };

  const updated = await medicalRepo.updateMedical(id, updateData);
  return toApiMedical(updated);
}

/**
 * 删除医疗记录（软删除）
 * @param {string} id - 医疗记录 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
export async function deleteMedical(id, userId) {
  // 基于宠物所有权校验权限
  await getMedicalById(id, userId);
  await medicalRepo.softDeleteMedical(id);
}

// 将存储实体映射为 API 输出（兼容旧字段）
function toApiMedical(medical) {
  const details = medical.details || {};
  return {
    id: medical.id,
    petId: medical.petId,
    recordType: mapKindToRecordType(medical.kind),
    recordedAt: medical.performedAt || null,
    nextDueDate: medical.dueAt || null,
    title: medical.title || null,
    description: medical.note ?? details.description ?? null,
    veterinarianName: medical.veterinarian || null,
    clinicName: medical.clinic || null,
    costAmount: details.costAmount ?? null,
    costCurrency: details.costCurrency ?? null,
    // 兼容性附加字段
    vaccineName: details.vaccineName ?? null,
    medicationName: details.medicationName ?? null,
    dosage: details.dosage ?? null,
    frequency: details.frequency ?? null,
    duration: details.duration ?? null,
    attachments: details.attachments ?? null,
    createdAt: medical.createdAt,
    updatedAt: medical.updatedAt,
  };
}

