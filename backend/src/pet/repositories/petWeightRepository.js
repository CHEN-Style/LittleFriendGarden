/**
 * Pet Weight Repository - 宠物体重记录数据访问层
 * 职责：封装所有与 PetWeight 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建体重记录
 * @param {Object} weightData - 体重数据 { petId, measuredAt, weightKg, source?, note? }
 * @returns {Promise<Object>} 创建的体重记录
 */
export async function createWeight(weightData) {
  try {
    return await prisma.petWeight.create({
      data: weightData,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create weight record: ${error.message}`, { weightData });
  }
}

/**
 * 批量创建体重记录
 * @param {Array<Object>} weightDataArray - 体重数据数组
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createWeightBatch(weightDataArray) {
  try {
    return await prisma.petWeight.createMany({
      data: weightDataArray,
      skipDuplicates: true, // 跳过重复（基于 petId + measuredAt 唯一约束）
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch create weight records: ${error.message}`, {
      count: weightDataArray.length,
    });
  }
}

/**
 * 根据 ID 查找体重记录
 * @param {string} id - 体重记录 ID
 * @returns {Promise<Object|null>} 体重记录
 */
export async function findWeightById(id) {
  try {
    return await prisma.petWeight.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find weight record: ${error.message}`, { id });
  }
}

/**
 * 根据宠物 ID 查找体重记录列表（分页 + 时间范围）
 * @param {Object} options - 查询选项
 * @param {string} options.petId - 宠物 ID
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findWeightsByPetId({ petId, startDate, endDate, limit = 50, offset = 0 }) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    // 时间范围过滤
    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = startDate;
      if (endDate) where.measuredAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.petWeight.findMany({
        where,
        orderBy: { measuredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.petWeight.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find weight records: ${error.message}`, { petId });
  }
}

/**
 * 获取最新体重记录
 * @param {string} petId - 宠物 ID
 * @returns {Promise<Object|null>} 最新体重记录
 */
export async function findLatestWeight(petId) {
  try {
    return await prisma.petWeight.findFirst({
      where: {
        petId,
        deletedAt: null,
      },
      orderBy: { measuredAt: 'desc' },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find latest weight: ${error.message}`, { petId });
  }
}

/**
 * 获取最新体重记录（使用视图）
 * @param {string} petId - 宠物 ID
 * @returns {Promise<Object|null>} 最新体重记录
 */
export async function findLatestWeightFromView(petId) {
  try {
    const result = await prisma.$queryRaw`
      SELECT * FROM pet_latest_weight_v
      WHERE pet_id = ${petId}::uuid
    `;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw new DatabaseError(`Failed to query latest weight view: ${error.message}`, { petId });
  }
}

/**
 * 更新体重记录
 * @param {string} id - 体重记录 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的体重记录
 */
export async function updateWeight(id, updateData) {
  try {
    return await prisma.petWeight.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update weight record: ${error.message}`, { id });
  }
}

/**
 * 软删除体重记录
 * @param {string} id - 体重记录 ID
 * @returns {Promise<Object>} 删除的体重记录
 */
export async function softDeleteWeight(id) {
  try {
    return await prisma.petWeight.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete weight record: ${error.message}`, { id });
  }
}

/**
 * 硬删除体重记录（仅用于测试/清理）
 * @param {string} id - 体重记录 ID
 * @returns {Promise<Object>} 删除的体重记录
 */
export async function hardDeleteWeight(id) {
  try {
    return await prisma.petWeight.delete({
      where: { id },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to hard delete weight record: ${error.message}`, { id });
  }
}

/**
 * 获取体重统计信息（最大/最小/平均值）
 * @param {string} petId - 宠物 ID
 * @param {Date} [startDate] - 开始日期
 * @param {Date} [endDate] - 结束日期
 * @returns {Promise<Object>} 统计数据
 */
export async function getWeightStats(petId, startDate, endDate) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = startDate;
      if (endDate) where.measuredAt.lte = endDate;
    }

    const stats = await prisma.petWeight.aggregate({
      where,
      _avg: { weightKg: true },
      _max: { weightKg: true },
      _min: { weightKg: true },
      _count: true,
    });

    return {
      average: stats._avg.weightKg,
      max: stats._max.weightKg,
      min: stats._min.weightKg,
      count: stats._count,
    };
  } catch (error) {
    throw new DatabaseError(`Failed to get weight stats: ${error.message}`, { petId });
  }
}

