/**
 * Pet Feeding Repository - 宠物喂养记录数据访问层
 * 职责：封装所有与 PetFeeding 相关的数据库操作
 */

import { prisma } from '../../../lib/prisma.js';
import { DatabaseError } from '../../errors/index.js';

/**
 * 创建喂养记录
 * @param {Object} feedingData - 喂养数据
 * @returns {Promise<Object>} 创建的喂养记录
 */
export async function createFeeding(feedingData) {
  try {
    return await prisma.petFeeding.create({
      data: feedingData,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to create feeding record: ${error.message}`, { feedingData });
  }
}

/**
 * 批量创建喂养记录
 * @param {Array<Object>} feedingDataArray - 喂养数据数组
 * @returns {Promise<Object>} 批量创建结果
 */
export async function createFeedingBatch(feedingDataArray) {
  try {
    return await prisma.petFeeding.createMany({
      data: feedingDataArray,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to batch create feeding records: ${error.message}`, {
      count: feedingDataArray.length,
    });
  }
}

/**
 * 根据 ID 查找喂养记录
 * @param {string} id - 喂养记录 ID
 * @returns {Promise<Object|null>} 喂养记录
 */
export async function findFeedingById(id) {
  try {
    return await prisma.petFeeding.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to find feeding record: ${error.message}`, { id });
  }
}

/**
 * 根据宠物 ID 查找喂养记录列表（分页 + 时间范围）
 * @param {Object} options - 查询选项
 * @param {string} options.petId - 宠物 ID
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findFeedingsByPetId({ petId, startDate, endDate, limit = 50, offset = 0 }) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    // 时间范围过滤
    if (startDate || endDate) {
      where.fedAt = {};
      if (startDate) where.fedAt.gte = startDate;
      if (endDate) where.fedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.petFeeding.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { fedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.petFeeding.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find feeding records: ${error.message}`, { petId });
  }
}

/**
 * 根据用户 ID 查找喂养记录列表
 * @param {Object} options - 查询选项
 * @param {string} options.userId - 用户 ID
 * @param {Date} [options.startDate] - 开始日期
 * @param {Date} [options.endDate] - 结束日期
 * @param {number} [options.limit=50] - 每页数量
 * @param {number} [options.offset=0] - 偏移量
 * @returns {Promise<Object>} { data: Array, total: number }
 */
export async function findFeedingsByUserId({ userId, startDate, endDate, limit = 50, offset = 0 }) {
  try {
    const where = {
      userId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.fedAt = {};
      if (startDate) where.fedAt.gte = startDate;
      if (endDate) where.fedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.petFeeding.findMany({
        where,
        include: {
          pet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { fedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.petFeeding.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    throw new DatabaseError(`Failed to find feeding records by user: ${error.message}`, { userId });
  }
}

/**
 * 获取日喂养汇总（使用视图）
 * @param {string} petId - 宠物 ID
 * @param {Date} [startDate] - 开始日期
 * @param {Date} [endDate] - 结束日期
 * @returns {Promise<Array>} 日汇总数据
 */
export async function getDailyFeedingSummary(petId, startDate, endDate) {
  try {
    let query = `
      SELECT * FROM pet_daily_feed_summary_v
      WHERE pet_id = $1::uuid
    `;
    const params = [petId];

    if (startDate && endDate) {
      query += ` AND d_utc >= $2::date AND d_utc <= $3::date`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND d_utc >= $2::date`;
      params.push(startDate);
    } else if (endDate) {
      query += ` AND d_utc <= $2::date`;
      params.push(endDate);
    }

    query += ` ORDER BY d_utc DESC`;

    return await prisma.$queryRawUnsafe(query, ...params);
  } catch (error) {
    throw new DatabaseError(`Failed to get daily feeding summary: ${error.message}`, { petId });
  }
}

/**
 * 更新喂养记录
 * @param {string} id - 喂养记录 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的喂养记录
 */
export async function updateFeeding(id, updateData) {
  try {
    return await prisma.petFeeding.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    throw new DatabaseError(`Failed to update feeding record: ${error.message}`, { id });
  }
}

/**
 * 软删除喂养记录
 * @param {string} id - 喂养记录 ID
 * @returns {Promise<Object>} 删除的喂养记录
 */
export async function softDeleteFeeding(id) {
  try {
    return await prisma.petFeeding.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to delete feeding record: ${error.message}`, { id });
  }
}

/**
 * 硬删除喂养记录（仅用于测试/清理）
 * @param {string} id - 喂养记录 ID
 * @returns {Promise<Object>} 删除的喂养记录
 */
export async function hardDeleteFeeding(id) {
  try {
    return await prisma.petFeeding.delete({
      where: { id },
    });
  } catch (error) {
    throw new DatabaseError(`Failed to hard delete feeding record: ${error.message}`, { id });
  }
}

/**
 * 获取喂养统计信息
 * @param {string} petId - 宠物 ID
 * @param {Date} [startDate] - 开始日期
 * @param {Date} [endDate] - 结束日期
 * @returns {Promise<Object>} 统计数据
 */
export async function getFeedingStats(petId, startDate, endDate) {
  try {
    const where = {
      petId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.fedAt = {};
      if (startDate) where.fedAt.gte = startDate;
      if (endDate) where.fedAt.lte = endDate;
    }

    const stats = await prisma.petFeeding.aggregate({
      where,
      _sum: {
        amountG: true,
        caloriesKcal: true,
      },
      _avg: {
        amountG: true,
        caloriesKcal: true,
      },
      _count: true,
    });

    return {
      totalAmount: stats._sum.amountG,
      totalCalories: stats._sum.caloriesKcal,
      averageAmount: stats._avg.amountG,
      averageCalories: stats._avg.caloriesKcal,
      count: stats._count,
    };
  } catch (error) {
    throw new DatabaseError(`Failed to get feeding stats: ${error.message}`, { petId });
  }
}

