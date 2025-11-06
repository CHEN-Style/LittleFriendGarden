/**
 * Pet Weight API 完整测试脚本
 * 
 * 测试所有体重记录相关的API端点
 */

const http = require('http');
const https = require('https');

// 配置
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  debug: process.env.DEBUG === 'true'
};

// 测试统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 请求工具
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: config.timeout
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.debug) {
      console.log('DEBUG test script request:');
      console.log('  URL:', url.href);
      console.log('  Method:', method);
      console.log('  Headers:', JSON.stringify(options.headers, null, 2));
      if (data) {
        console.log('  Body:', JSON.stringify(data));
        console.log('  Body type:', typeof data);
      }
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试辅助函数
async function createTestUser(index = 0) {
  const timestamp = Date.now();
  const userData = {
    username: `testuser${index}_${timestamp}`,
    email: `testuser${index}_${timestamp}@example.com`,
    password: 'Test123456!'
  };

  const registerRes = await makeRequest('POST', 'auth/register', userData);
  if (registerRes.status !== 201) {
    throw new Error(`Failed to create user: ${JSON.stringify(registerRes.data)}`);
  }

  const loginRes = await makeRequest('POST', 'auth/login', {
    email: userData.email,
    password: userData.password
  });

  if (loginRes.status !== 200) {
    throw new Error(`Failed to login: ${JSON.stringify(loginRes.data)}`);
  }

  return {
    user: registerRes.data.data,
    token: loginRes.data.data.accessToken
  };
}

async function createTestPet(token, petData = {}) {
  const defaultPetData = {
    name: '测试宠物',
    species: 'cat',
    sex: 'male'
  };

  const res = await makeRequest('POST', 'pets', { ...defaultPetData, ...petData }, token);
  if (res.status !== 201) {
    throw new Error(`Failed to create pet: ${JSON.stringify(res.data)}`);
  }

  return res.data.data;
}

// 测试用例
async function test1_createWeightRecord() {
  log('\n📝 测试 1: 添加体重记录 - 基础功能', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(0);
    log(`✅ 创建测试用户: ${user.email} (ID: ${user.id})`, 'green');

    const pet = await createTestPet(token, { name: '小白' });
    log(`✅ 创建测试宠物: ${pet.name} (ID: ${pet.id})`, 'green');

    const weightData = {
      petId: pet.id,
      weight: 5.2,
      unit: 'kg',
      measuredAt: new Date().toISOString(),
      note: '第一次称重记录'
    };

    const res = await makeRequest('POST', '/weights', weightData, token);

    if (res.status === 201 && res.data.success) {
      const weight = res.data.data;
      log(`✅ 创建体重记录成功: ${weight.weight}${weight.unit} (ID: ${weight.id})`, 'green');
      stats.passed++;
      return { user, token, pet, weight };
    } else {
      log(`❌ 创建体重记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test2_getWeightRecords() {
  log('\n📝 测试 2: 获取宠物的体重记录列表', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(1);
    const pet = await createTestPet(token, { name: '小黑' });

    // 创建多条体重记录
    const weights = [];
    for (let i = 0; i < 3; i++) {
      const weightData = {
        petId: pet.id,
        weight: 5.0 + i * 0.2,
        unit: 'kg',
        measuredAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        note: `第${i + 1}周的体重`
      };
      const res = await makeRequest('POST', 'weights', weightData, token);
      weights.push(res.data.data);
    }

    log(`✅ 创建了 ${weights.length} 条体重记录`, 'green');

    // 获取体重记录列表
    const res = await makeRequest('GET', `/weights/pet/${pet.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      const records = res.data.data;
      log(`✅ 获取到 ${records.length} 条体重记录`, 'green');
      
      if (records.length === 3) {
        stats.passed++;
      } else {
        log(`❌ 记录数量不匹配，期望 3，实际 ${records.length}`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 获取体重记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test3_updateWeightRecord() {
  log('\n📝 测试 3: 更新体重记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(2);
    const pet = await createTestPet(token);

    const weightData = {
      petId: pet.id,
      weight: 5.0,
      unit: 'kg',
      measuredAt: new Date().toISOString()
    };

    const createRes = await makeRequest('POST', 'weights', weightData, token);
    const weight = createRes.data.data;

    // 更新体重记录
    const updateData = {
      weight: 5.3,
      note: '更新后的备注'
    };

    const res = await makeRequest('PATCH', `/weights/${weight.id}`, updateData, token);

    if (res.status === 200 && res.data.success) {
      const updated = res.data.data;
      if (updated.weight === 5.3 && updated.note === '更新后的备注') {
        log(`✅ 更新体重记录成功: ${updated.weight}${updated.unit}`, 'green');
        stats.passed++;
      } else {
        log(`❌ 更新的数据不正确`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 更新体重记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test4_deleteWeightRecord() {
  log('\n📝 测试 4: 删除体重记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(3);
    const pet = await createTestPet(token);

    const weightData = {
      petId: pet.id,
      weight: 5.0,
      unit: 'kg',
      measuredAt: new Date().toISOString()
    };

    const createRes = await makeRequest('POST', 'weights', weightData, token);
    const weight = createRes.data.data;

    // 删除体重记录
    const res = await makeRequest('DELETE', `/weights/${weight.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      log(`✅ 删除体重记录成功`, 'green');

      // 验证已删除
      const getRes = await makeRequest('GET', `/weights/${weight.id}`, null, token);
      if (getRes.status === 404) {
        log(`✅ 已删除的记录无法访问 (404 Not Found)`, 'green');
        stats.passed++;
      } else {
        log(`❌ 已删除的记录仍可访问`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 删除体重记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test5_batchImportWeights() {
  log('\n📝 测试 5: 批量导入体重记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(4);
    const pet = await createTestPet(token);

    const batchData = {
      petId: pet.id,
      records: [
        { weight: 5.0, unit: 'kg', measuredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), note: '两周前' },
        { weight: 5.2, unit: 'kg', measuredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), note: '一周前' },
        { weight: 5.4, unit: 'kg', measuredAt: new Date().toISOString(), note: '今天' }
      ]
    };

    const res = await makeRequest('POST', 'weights/batch', batchData, token);

    if (res.status === 201 && res.data.success) {
      const result = res.data.data;
      log(`✅ 批量导入成功: ${result.count} 条记录`, 'green');
      stats.passed++;
    } else {
      log(`❌ 批量导入失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test6_getWeightTrends() {
  log('\n📝 测试 6: 获取体重趋势分析', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(5);
    const pet = await createTestPet(token);

    // 创建体重记录
    const weights = [
      { weight: 5.0, measuredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { weight: 5.2, measuredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
      { weight: 5.5, measuredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { weight: 5.8, measuredAt: new Date().toISOString() }
    ];

    for (const w of weights) {
      await makeRequest('POST', '/weights', { petId: pet.id, unit: 'kg', ...w }, token);
    }

    // 获取趋势分析
    const res = await makeRequest('GET', `/weights/pet/${pet.id}/trends`, null, token);

    if (res.status === 200 && res.data.success) {
      const trends = res.data.data;
      log(`✅ 获取趋势分析成功:`, 'green');
      log(`   - 总记录数: ${trends.totalRecords}`, 'cyan');
      log(`   - 平均体重: ${trends.averageWeight}`, 'cyan');
      log(`   - 最小体重: ${trends.minWeight}`, 'cyan');
      log(`   - 最大体重: ${trends.maxWeight}`, 'cyan');
      log(`   - 体重变化: ${trends.weightChange}`, 'cyan');
      stats.passed++;
    } else {
      log(`❌ 获取趋势分析失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test7_validation() {
  log('\n📝 测试 7: 输入验证', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(6);
    const pet = await createTestPet(token);

    // 测试缺少必填字段
    const invalidData = {
      petId: pet.id,
      unit: 'kg'
      // 缺少 weight 和 measuredAt
    };

    const res = await makeRequest('POST', '/weights', invalidData, token);

    if (res.status === 400) {
      log(`✅ 输入验证通过 (400 Bad Request)`, 'green');
      stats.passed++;
    } else {
      log(`❌ 应该返回 400，但返回了 ${res.status}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test8_permissions() {
  log('\n📝 测试 8: 权限控制', 'cyan');
  stats.total++;

  try {
    const user1 = await createTestUser(7);
    const user2 = await createTestUser(8);

    const pet = await createTestPet(user1.token);

    const weightData = {
      petId: pet.id,
      weight: 5.0,
      unit: 'kg',
      measuredAt: new Date().toISOString()
    };

    const createRes = await makeRequest('POST', '/weights', weightData, user1.token);
    const weight = createRes.data.data;

    // 尝试用其他用户修改
    const res = await makeRequest('PATCH', `/weights/${weight.id}`, { weight: 6.0 }, user2.token);

    if (res.status === 403 || res.status === 404) {
      log(`✅ 权限控制正确 (${res.status})`, 'green');
      stats.passed++;
    } else {
      log(`❌ 权限控制失败，应该返回 403/404，但返回了 ${res.status}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始 Pet Weight API 完整测试\n', 'bright');
  log(`📍 API 地址: ${config.baseUrl}`, 'yellow');
  log(`⏱️  超时设置: ${config.timeout}ms`, 'yellow');

  const tests = [
    test1_createWeightRecord,
    test2_getWeightRecords,
    test3_updateWeightRecord,
    test4_deleteWeightRecord,
    test5_batchImportWeights,
    test6_getWeightTrends,
    test7_validation,
    test8_permissions
  ];

  for (const test of tests) {
    const startTime = Date.now();
    await test();
    const duration = Date.now() - startTime;
    log(`\n⏱️  耗时: ${duration}ms`, 'yellow');
  }

  // 输出总结
  log('\n============================================================', 'cyan');
  log('📊 测试总结', 'bright');
  log('============================================================', 'cyan');
  log(`✅ 通过: ${stats.passed}`, 'green');
  log(`❌ 失败: ${stats.failed}`, stats.failed > 0 ? 'red' : 'reset');
  log(`📈 总计: ${stats.total}`, 'cyan');
  log(`⏱️  总耗时: ${Date.now() - stats.startTime}ms`, 'yellow');
  log('\n============================================================\n', 'cyan');

  process.exit(stats.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(err => {
  log(`\n💥 测试运行出错: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

