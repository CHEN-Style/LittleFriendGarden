/**
 * Pet API 完整测试脚本
 * 
 * 使用方法：
 *   node scripts/test-pet-api.cjs
 * 
 * 前提条件：
 *   1. 确保服务器正在运行（默认 http://localhost:3000）
 *   2. 确保数据库已初始化并包含必要的表
 */

const { v4: uuidv4 } = require('uuid');

// 检查 Node.js 版本（需要 18+ 以支持内置 fetch）
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1), 10);
if (majorVersion < 18) {
  console.error('❌ 错误: 需要 Node.js 18+ 版本以支持内置 fetch API');
  console.error(`   当前版本: ${nodeVersion}`);
  process.exit(1);
}

// ============================================
// 配置
// ============================================

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_TIMEOUT = 30000; // 30秒超时

// 测试数据存储
const testData = {
  users: [],
  tokens: [],
  pets: [],
};

// ============================================
// 工具函数
// ============================================

/**
 * 发送 HTTP 请求
 */
async function request(method, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  // 准备 body
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body,
  };
  
  // 移除 options 中的 body 和 headers，避免重复
  const { body: _, headers: __, ...restOptions } = options;
  Object.assign(config, restOptions);

  // 调试：记录请求信息
  if (method === 'POST' && path.includes('/pets')) {
    console.log('DEBUG test script request:');
    console.log('  URL:', url);
    console.log('  Method:', method);
    console.log('  Headers:', JSON.stringify(config.headers, null, 2));
    console.log('  Body:', config.body);
    console.log('  Body type:', typeof config.body);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
      ok: response.ok,
    };
  } catch (error) {
    throw new Error(`请求失败: ${error.message}`);
  }
}

/**
 * 创建测试用户并登录
 */
async function createTestUser(index = 0) {
  const timestamp = Date.now();
  const email = `testuser${index}_${timestamp}@example.com`;
  const username = `testuser${index}_${timestamp}`;
  const password = 'TestPassword123!';

  // 注册用户
  const registerRes = await request('POST', 'auth/register', {
    body: {
      email,
      username,
      password,
      profile: {
        displayName: `Test User ${index}`,
        bio: `这是测试用户 ${index}`,
      },
    },
  });

  if (!registerRes.ok) {
    throw new Error(`注册失败: ${registerRes.status} - ${JSON.stringify(registerRes.data)}`);
  }

  const userId = registerRes.data.data.user.id;
  const accessToken = registerRes.data.data.tokens.accessToken;

  // 登录验证
  const loginRes = await request('POST', 'auth/login', {
    body: {
      identifier: email,
      password,
    },
  });

  if (!loginRes.ok) {
    throw new Error(`登录失败: ${registerRes.status} - ${JSON.stringify(loginRes.data)}`);
  }

  testData.users.push({ id: userId, email, username, password });
  testData.tokens.push(accessToken);

  console.log(`✅ 创建测试用户 ${index}: ${email} (ID: ${userId})`);
  return { userId, accessToken, email, username };
}

/**
 * 断言函数
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

function assertStatus(response, expectedStatus, message) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `状态码错误: 期望 ${expectedStatus}, 实际 ${response.status}. ${message}\n响应: ${JSON.stringify(response.data, null, 2)}`
    );
  }
}

function assertSuccess(response, message) {
  assertStatus(response, 200, message);
  assert(response.data.success === true, `响应应包含 success: true. ${message}`);
}

// ============================================
// 测试用例
// ============================================

/**
 * 测试 1: 创建宠物 - 基础功能
 */
async function testCreatePet() {
  console.log('\n📝 测试 1: 创建宠物 - 基础功能');
  
  const { accessToken } = await createTestUser(0);
  
  const petData = {
    name: '小白',
    species: 'cat',
    breed: '英国短毛猫',
    sex: 'male',
    birthDate: '2023-01-15',
    color: '白色',
    settings: {
      isPublic: false,
      allowComments: true,
    },
  };

  const response = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: petData,
  });

  assertStatus(response, 201, '创建宠物应成功');
  assert(response.data.data.name === petData.name, '宠物名称应匹配');
  assert(response.data.data.species === petData.species, '宠物种类应匹配');
  assert(response.data.data.primaryOwnerId === testData.users[0].id, '主人ID应匹配');
  assert(response.data.data.owners.length > 0, '应自动创建主人关系');

  testData.pets.push(response.data.data.id);
  console.log(`✅ 创建宠物成功: ${response.data.data.name} (ID: ${response.data.data.id})`);
  return response.data.data;
}

/**
 * 测试 2: 创建多个不同物种的宠物
 */
async function testCreateMultiplePets() {
  console.log('\n📝 测试 2: 创建多个不同物种的宠物');

  const accessToken = testData.tokens[0] || (await createTestUser(0)).accessToken;

  const pets = [
    { name: '旺财', species: 'dog', breed: '金毛', sex: 'male', color: '金黄色' },
    { name: '小黄', species: 'bird', breed: '虎皮鹦鹉', sex: 'unknown', color: '黄绿色' },
    { name: '雪球', species: 'rabbit', sex: 'female', color: '纯白' },
    { name: '小绿', species: 'reptile', breed: '绿鬣蜥', sex: 'male' },
    { name: '小金', species: 'fish', breed: '金鱼', sex: 'unknown' },
    { name: '其他宠物', species: 'other', sex: 'unknown' },
  ];

  for (const petData of pets) {
    const response = await request('POST', '/pets', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: petData,
    });

    assertStatus(response, 201, `创建${petData.name}应成功`);
    assert(response.data.data.species === petData.species, `${petData.name}的种类应匹配`);
    testData.pets.push(response.data.data.id);
    console.log(`✅ 创建${petData.species}成功: ${petData.name}`);
  }
}

/**
 * 测试 3: 获取用户的所有宠物
 */
async function testGetUserPets() {
  console.log('\n📝 测试 3: 获取用户的所有宠物');

  const accessToken = testData.tokens[0] || (await createTestUser(0)).accessToken;

  const response = await request('GET', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assertSuccess(response, '获取宠物列表应成功');
  assert(Array.isArray(response.data.data), '返回数据应为数组');
  assert(response.data.count >= testData.pets.length, '宠物数量应匹配');
  console.log(`✅ 获取到 ${response.data.count} 只宠物`);
}

/**
 * 测试 4: 获取宠物详情
 */
async function testGetPetById() {
  console.log('\n📝 测试 4: 获取宠物详情');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  const petId = testData.pets[0];
  const accessToken = testData.tokens[0];

  const response = await request('GET', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assertSuccess(response, '获取宠物详情应成功');
  assert(response.data.data.id === petId, '宠物ID应匹配');
  assert(response.data.data.primaryOwner, '应包含主人信息');
  assert(Array.isArray(response.data.data.owners), '应包含主人列表');
  console.log(`✅ 获取宠物详情成功: ${response.data.data.name}`);
}

/**
 * 测试 5: 更新宠物信息
 */
async function testUpdatePet() {
  console.log('\n📝 测试 5: 更新宠物信息');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  const petId = testData.pets[0];
  const accessToken = testData.tokens[0];

  const updateData = {
    name: '小白白',
    color: '纯白色',
    settings: {
      isPublic: true,
      allowComments: true,
    },
  };

  const response = await request('PATCH', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: updateData,
  });

  assertSuccess(response, '更新宠物应成功');
  assert(response.data.data.name === updateData.name, '名称应已更新');
  assert(response.data.data.color === updateData.color, '颜色应已更新');
  console.log(`✅ 更新宠物成功: ${response.data.data.name}`);
}

/**
 * 测试 6: 添加共享成员
 */
async function testAddPetOwner() {
  console.log('\n📝 测试 6: 添加共享成员');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  // 创建第二个用户
  const { userId: userId2, accessToken: token2 } = await createTestUser(1);
  const petId = testData.pets[0];
  const ownerToken = testData.tokens[0];

  // 添加共享成员
  const response = await request('POST', `/pets/${petId}/owners`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
    body: {
      userId: userId2,
      role: 'family',
      note: '我的家人',
    },
  });

  assertStatus(response, 201, '添加共享成员应成功');
  assert(response.data.data.userId === userId2, '用户ID应匹配');
  assert(response.data.data.role === 'family', '角色应匹配');
  console.log(`✅ 添加共享成员成功: ${userId2} (role: family)`);

  // 验证共享成员可以查看宠物
  const viewResponse = await request('GET', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${token2}`,
    },
  });

  assertSuccess(viewResponse, '共享成员应能查看宠物');
  console.log(`✅ 共享成员可以查看宠物`);
}

/**
 * 测试 7: 共享成员无法修改宠物
 */
async function testSharedMemberCannotUpdate() {
  console.log('\n📝 测试 7: 共享成员无法修改宠物');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  const petId = testData.pets[0];
  
  // 确保有第二个用户（共享成员）
  if (testData.tokens.length < 2) {
    await createTestUser(1);
  }

  const sharedMemberToken = testData.tokens[1];

  const response = await request('PATCH', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${sharedMemberToken}`,
    },
    body: {
      name: '尝试修改',
    },
  });

  assertStatus(response, 403, '共享成员不应能修改宠物');
  console.log(`✅ 共享成员无法修改宠物 (403 Forbidden)`);
}

/**
 * 测试 8: 移除共享成员
 */
async function testRemovePetOwner() {
  console.log('\n📝 测试 8: 移除共享成员');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  // 确保有第二个用户
  if (testData.tokens.length < 2) {
    await createTestUser(1);
  }

  const petId = testData.pets[0];
  const userId2 = testData.users[1].id;
  const ownerToken = testData.tokens[0];

  // 先添加成员（如果还没添加）
  try {
    await request('POST', `/pets/${petId}/owners`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
      body: {
        userId: userId2,
        role: 'family',
      },
    });
  } catch {
    // 可能已经存在，忽略
  }

  // 移除成员
  const response = await request('DELETE', `/pets/${petId}/owners/${userId2}`, {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
  });

  assertSuccess(response, '移除共享成员应成功');
  console.log(`✅ 移除共享成员成功`);

  // 验证成员无法再访问
  const viewResponse = await request('GET', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${testData.tokens[1]}`,
    },
  });

  assertStatus(viewResponse, 403, '移除后的成员不应能访问宠物');
  console.log(`✅ 移除后的成员无法访问宠物 (403 Forbidden)`);
}

/**
 * 测试 9: 删除宠物（软删除）
 */
async function testDeletePet() {
  console.log('\n📝 测试 9: 删除宠物（软删除）');

  // 创建一个新宠物用于删除测试
  const accessToken = testData.tokens[0];
  const createResponse = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: '待删除的宠物',
      species: 'cat',
    },
  });

  assertStatus(createResponse, 201, '创建待删除宠物应成功');
  const petId = createResponse.data.data.id;

  // 删除宠物
  const deleteResponse = await request('DELETE', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assertSuccess(deleteResponse, '删除宠物应成功');
  console.log(`✅ 删除宠物成功`);

  // 验证无法再访问
  const viewResponse = await request('GET', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assertStatus(viewResponse, 404, '已删除的宠物不应能找到');
  console.log(`✅ 已删除的宠物无法访问 (404 Not Found)`);
}

/**
 * 测试 10: 验证错误 - 缺少必填字段
 */
async function testValidationErrors() {
  console.log('\n📝 测试 10: 验证错误 - 缺少必填字段');

  // 确保有可用的 token
  const accessToken = testData.tokens[0] || (await createTestUser(0)).accessToken;

  // 缺少 name
  const response1 = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      species: 'cat',
    },
  });

  assertStatus(response1, 400, '缺少name应返回400');
  console.log(`✅ 缺少name验证通过 (400 Bad Request)`);

  // 缺少 species
  const response2 = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: '测试宠物',
    },
  });

  assertStatus(response2, 400, '缺少species应返回400');
  console.log(`✅ 缺少species验证通过 (400 Bad Request)`);
}

/**
 * 测试 11: 验证错误 - 无效的枚举值
 */
async function testInvalidEnumValues() {
  console.log('\n📝 测试 11: 验证错误 - 无效的枚举值');

  // 确保有可用的 token
  const accessToken = testData.tokens[0] || (await createTestUser(0)).accessToken;

  // 无效的 species
  const response1 = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: '测试宠物',
      species: 'dragon',
    },
  });

  assertStatus(response1, 400, '无效species应返回400');
  console.log(`✅ 无效species验证通过 (400 Bad Request)`);

  // 无效的 sex
  const response2 = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: '测试宠物',
      species: 'cat',
      sex: 'other',
    },
  });

  assertStatus(response2, 400, '无效sex应返回400');
  console.log(`✅ 无效sex验证通过 (400 Bad Request)`);

  // 无效的 role
  const petId = testData.pets[0];
  const userId2 = testData.users[1]?.id || testData.users[0].id;

  const response3 = await request('POST', `/pets/${petId}/owners`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      userId: userId2,
      role: 'invalid_role',
    },
  });

  assertStatus(response3, 400, '无效role应返回400');
  console.log(`✅ 无效role验证通过 (400 Bad Request)`);
}

/**
 * 测试 12: 认证错误 - 未认证访问
 */
async function testUnauthorizedAccess() {
  console.log('\n📝 测试 12: 认证错误 - 未认证访问');

  const response = await request('GET', '/pets');

  assertStatus(response, 401, '未认证访问应返回401');
  console.log(`✅ 未认证访问验证通过 (401 Unauthorized)`);
}

/**
 * 测试 13: 权限错误 - 非主人无法修改
 */
async function testNonOwnerCannotUpdate() {
  console.log('\n📝 测试 13: 权限错误 - 非主人无法修改');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  // 创建第三个用户（不是主人）
  const { accessToken: token3 } = await createTestUser(2);
  const petId = testData.pets[0];

  const response = await request('PATCH', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${token3}`,
    },
    body: {
      name: '尝试修改',
    },
  });

  assertStatus(response, 403, '非主人不应能修改宠物');
  console.log(`✅ 非主人无法修改宠物 (403 Forbidden)`);
}

/**
 * 测试 14: 权限错误 - 非主人无法删除
 */
async function testNonOwnerCannotDelete() {
  console.log('\n📝 测试 14: 权限错误 - 非主人无法删除');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  // 使用第三个用户（不是主人）
  if (testData.tokens.length < 3) {
    await createTestUser(2);
  }

  const token3 = testData.tokens[2];
  const petId = testData.pets[0];

  const response = await request('DELETE', `/pets/${petId}`, {
    headers: {
      Authorization: `Bearer ${token3}`,
    },
  });

  assertStatus(response, 403, '非主人不应能删除宠物');
  console.log(`✅ 非主人无法删除宠物 (403 Forbidden)`);
}

/**
 * 测试 15: 资源不存在错误
 */
async function testNotFound() {
  console.log('\n📝 测试 15: 资源不存在错误');

  const fakePetId = uuidv4();
  const accessToken = testData.tokens[0] || (await createTestUser(0)).accessToken;

  const response = await request('GET', `/pets/${fakePetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assertStatus(response, 404, '不存在的宠物应返回404');
  console.log(`✅ 资源不存在验证通过 (404 Not Found)`);
}

/**
 * 测试 16: 不能移除主主人
 */
async function testCannotRemovePrimaryOwner() {
  console.log('\n📝 测试 16: 不能移除主主人');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  const petId = testData.pets[0];
  const primaryOwnerId = testData.users[0].id;
  const accessToken = testData.tokens[0];

  const response = await request('DELETE', `/pets/${petId}/owners/${primaryOwnerId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assertStatus(response, 403, '不应能移除主主人');
  console.log(`✅ 不能移除主主人验证通过 (403 Forbidden)`);
}

/**
 * 测试 17: 只有主主人可以移除成员
 */
async function testOnlyPrimaryOwnerCanRemove() {
  console.log('\n📝 测试 17: 只有主主人可以移除成员');

  if (testData.pets.length === 0) {
    throw new Error('没有可用的宠物进行测试');
  }

  // 确保有第二个用户
  if (testData.tokens.length < 2) {
    await createTestUser(1);
  }

  const petId = testData.pets[0];
  const userId2 = testData.users[1].id;
  const ownerToken = testData.tokens[0];
  const sharedToken = testData.tokens[1];

  // 先添加成员
  try {
    await request('POST', `/pets/${petId}/owners`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
      body: {
        userId: userId2,
        role: 'family',
      },
    });
  } catch {
    // 可能已经存在
  }

  // 共享成员尝试移除另一个成员（应该失败）
  const response = await request('DELETE', `/pets/${petId}/owners/${userId2}`, {
    headers: {
      Authorization: `Bearer ${sharedToken}`,
    },
  });

  assertStatus(response, 403, '共享成员不应能移除其他成员');
  console.log(`✅ 只有主主人可以移除成员验证通过 (403 Forbidden)`);
}

// ============================================
// 主测试函数
// ============================================

async function runAllTests() {
  console.log('🚀 开始 Pet API 完整测试\n');
  console.log(`📍 API 地址: ${BASE_URL}`);
  console.log(`⏱️  超时设置: ${TEST_TIMEOUT}ms\n`);

  const tests = [
    { name: '创建宠物 - 基础功能', fn: testCreatePet },
    { name: '创建多个不同物种的宠物', fn: testCreateMultiplePets },
    { name: '获取用户的所有宠物', fn: testGetUserPets },
    { name: '获取宠物详情', fn: testGetPetById },
    { name: '更新宠物信息', fn: testUpdatePet },
    { name: '添加共享成员', fn: testAddPetOwner },
    { name: '共享成员无法修改宠物', fn: testSharedMemberCannotUpdate },
    { name: '移除共享成员', fn: testRemovePetOwner },
    { name: '删除宠物（软删除）', fn: testDeletePet },
    { name: '验证错误 - 缺少必填字段', fn: testValidationErrors },
    { name: '验证错误 - 无效的枚举值', fn: testInvalidEnumValues },
    { name: '认证错误 - 未认证访问', fn: testUnauthorizedAccess },
    { name: '权限错误 - 非主人无法修改', fn: testNonOwnerCannotUpdate },
    { name: '权限错误 - 非主人无法删除', fn: testNonOwnerCannotDelete },
    { name: '资源不存在错误', fn: testNotFound },
    { name: '不能移除主主人', fn: testCannotRemovePrimaryOwner },
    { name: '只有主主人可以移除成员', fn: testOnlyPrimaryOwnerCanRemove },
  ];

  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  for (const test of tests) {
    try {
      const startTime = Date.now();
      await Promise.race([
        test.fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`测试超时 (>${TEST_TIMEOUT}ms)`)), TEST_TIMEOUT)
        ),
      ]);
      const duration = Date.now() - startTime;
      results.passed++;
      console.log(`\n⏱️  耗时: ${duration}ms`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        test: test.name,
        error: error.message,
      });
      console.error(`\n❌ 测试失败: ${test.name}`);
      console.error(`   错误: ${error.message}`);
    }
  }

  // 输出测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`📈 总计: ${results.passed + results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch((error) => {
  console.error('\n❌ 测试执行失败:', error);
  process.exit(1);
});

