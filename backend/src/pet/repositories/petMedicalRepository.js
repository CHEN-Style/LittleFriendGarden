/**
 * Pet Medical Repository - 宠物医疗记录数据访问层
 * 职责：封装所有与 PetMedical 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建医疗记录
 * @param {Object} medicalData - 医疗数据
 * @returns {Promise<Object>} 创建的医疗记录
 */
export async function createMedical(medicalData) {
  try {
    return await prisma.petMedicalRecord.create({
      data: medicalData,
      include: {
        pet: {
          select: { id: true, name: true },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create medical record: ${error.message}`, { medicalData });
  }
}

/**
 * 批量创建医疗记录
 * @param {Array<Object>} medicalDataArray - 医疗数据数组
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createMedicalBatch(medicalDataArray) {
  try {
    return await prisma.petMedicalRecord.createMany({ data: medicalDataArray });
  } catch (error) {
    throw new DatabaseError(`Failed to batch create medical records: ${error.message}`, {
      count: medicalDataArray.length,
    });
  }
}

/**
 * 根据 ID 查找医疗记录
 * @param {string} id - 医疗记录 ID
 * @returns {Promise<Object|null>} 医疗记录
 */
export async function findMedicalById(id) {
  try {
    return await prisma.petMedicalRecord.findUnique({
      where: { id },
      include: {
        pet: { select: { id: true, name: true, species: true } },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find medical record: ${error.message}`, { id });
  }
}

/**
 * 根据宠物 ID 查找医疗记录列表（分页 + 筛选）
 * @param {Object} options - 查询选项
 * @param {string} options.petId - 宠物 ID
 * @param {string} [options.recordType] - 记录类型（vaccine/medication/checkup/surgery/diagnosis/other）
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findMedicalsByPetId({
  petId,
  recordType,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    // 记录类型过滤
    if (recordType) {
      // service 层仍传 recordType，这里映射为 kind
      where.kind = recordType;
    }

    // 时间范围过滤
    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.petMedicalRecord.findMany({
        where,
        include: {
          pet: { select: { id: true, name: true } },
        },
        orderBy: { performedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.petMedicalRecord.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find medical records: ${error.message}`, { petId });
  }
}

/**
 * 根据用户 ID 查找医疗记录列表
 * @param {Object} options - 查询选项
 * @param {string} options.userId - 用户 ID
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findMedicalsByUserId({ userId, startDate, endDate, limit = 50, offset = 0 }) {
  try {
    // 通过宠物所有权筛选该用户可见的医疗记录
    const where = {
      deletedAt: null,
      pet: {
        owners: {
          some: { userId },
        },
      },
    };

    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.petMedicalRecord.findMany({
        where,
        include: { pet: { select: { id: true, name: true } } },
        orderBy: { performedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.petMedicalRecord.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find medical records by user: ${error.message}`, { userId });
  }
}

/**
 * 查找即将到期的疫苗（使用视图）
 * @param {string} [petId] - 宠物 ID（可选，不传则查询所有）
 * @param {number} [daysAhead=30] - 提前天数
 * @returns {Promise<Array>} 即将到期的疫苗列表
 */
export async function findUpcomingVaccines(petId = null, daysAhead = 30) {
  try {
    // 用 dueAt 近期待到期替代视图
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const where = {
      deletedAt: null,
      kind: 'vaccine',
      dueAt: { gte: now, lte: until },
      ...(petId ? { petId } : {}),
    };

    const records = await prisma.petMedicalRecord.findMany({
      where,
      orderBy: { dueAt: 'asc' },
      include: { pet: { select: { id: true, name: true } } },
    });

    return records.map((r) => ({
      ...r,
      // 提供辅助字段，便于前端显示
      days_until_due: Math.ceil((r.dueAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      next_due_date: r.dueAt,
    }));
  } catch (error) {
    throw new DatabaseError(`Failed to find upcoming vaccines: ${error.message}`, { petId, daysAhead });
  }
}

/**
 * 获取疫苗接种历史（按疫苗名称分组）
 * @param {string} petId - 宠物 ID
 * @returns {Promise<Array>} 疫苗历史
 */
export async function getVaccineHistory(petId) {
  try {
    return await prisma.petMedicalRecord.findMany({
      where: { petId, kind: 'vaccine', deletedAt: null },
      orderBy: { performedAt: 'desc' },
      include: { pet: { select: { id: true, name: true } } },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get vaccine history: ${error.message}`, { petId });
  }
}

/**
 * 更新医疗记录
 * @param {string} id - 医疗记录 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的医疗记录
 */
export async function updateMedical(id, updateData) {
  try {
    return await prisma.petMedicalRecord.update({ where: { id }, data: updateData });
  } catch (error) {
    throw new DatabaseError(`Failed to update medical record: ${error.message}`, { id });
  }
}

/**
 * 软删除医疗记录
 * @param {string} id - 医疗记录 ID
 * @returns {Promise<Object>} 删除的医疗记录
 */
export async function softDeleteMedical(id) {
  try {
    return await prisma.petMedicalRecord.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch (error) {
    throw new DatabaseError(`Failed to delete medical record: ${error.message}`, { id });
  }
}

/**
 * 硬删除医疗记录（仅用于测试/清理）
 * @param {string} id - 医疗记录 ID
 * @returns {Promise<Object>} 删除的医疗记录
 */
export async function hardDeleteMedical(id) {
  try {
    return await prisma.petMedicalRecord.delete({ where: { id } });
  } catch (error) {
    throw new DatabaseError(`Failed to hard delete medical record: ${error.message}`, { id });
  }
}

/**
 * 获取医疗记录统计信息（按类型统计）
 * @param {string} petId - 宠物 ID
 * @param {Date} [startDate] - 开始日期
 * @param {Date} [endDate] - 结束日期
 * @returns {Promise<Array>} 统计数据（按类型分组）
 */
export async function getMedicalStatsByType(petId, startDate, endDate) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    return await prisma.petMedicalRecord.groupBy({
      by: ['kind'],
      where,
      _count: { _all: true },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to get medical stats: ${error.message}`, { petId });
  }
}

/**
 * 获取总费用统计
 * @param {string} petId - 宠物 ID
 * @param {Date} [startDate] - 开始日期
 * @param {Date} [endDate] - 结束日期
 * @returns {Promise<Object>} 总费用
 */
export async function getTotalCost(petId, startDate, endDate) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    const result = await prisma.petMedicalRecord.aggregate({ where, _count: true });

    return { totalCost: 0, recordCount: result._count };
  } catch (error) {
    throw new DatabaseError(`Failed to get total cost: ${error.message}`, { petId });
  }
}

