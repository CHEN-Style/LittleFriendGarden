/**
 * 数据库验证脚本
 * 用于快速检查数据库连接和表结构是否正确
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 开始验证数据库...\n');

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    // 2. 检查所有表是否存在
    console.log('2️⃣ 检查表结构...');
    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'user_profiles', model: prisma.userProfile },
      { name: 'user_identities', model: prisma.userIdentity },
      { name: 'user_follows', model: prisma.userFollow },
      { name: 'user_blocks', model: prisma.userBlock },
      { name: 'notifications', model: prisma.notification },
      { name: 'user_todos', model: prisma.userTodo }
    ];

    for (const table of tables) {
      try {
        await table.model.count();
        console.log(`  ✅ ${table.name} 表正常`);
      } catch (error) {
        console.log(`  ❌ ${table.name} 表不存在或有错误`);
        throw error;
      }
    }

    console.log('\n✅ 所有表结构验证通过！');
    console.log('\n🎉 数据库准备就绪，可以开始开发了！');

  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

