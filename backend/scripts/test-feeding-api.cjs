/**
 * Pet Feeding API 完整测试脚本
 * 
 * 测试所有喂养记录相关的API端点
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

  const res = await makeRequest('POST', '/pets', { ...defaultPetData, ...petData }, token);
  if (res.status !== 201) {
    throw new Error(`Failed to create pet: ${JSON.stringify(res.data)}`);
  }

  return res.data.data;
}

// 测试用例
async function test1_createFeedingRecord() {
  log('\n📝 测试 1: 添加喂养记录 - 基础功能', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(0);
    log(`✅ 创建测试用户: ${user.email}`, 'green');

    const pet = await createTestPet(token, { name: '小白' });
    log(`✅ 创建测试宠物: ${pet.name}`, 'green');

    const feedingData = {
      petId: pet.id,
      foodType: 'cat_food',
      foodName: '皇家猫粮',
      amount: 100,
      unit: 'g',
      fedAt: new Date().toISOString(),
      note: '早餐'
    };

    const res = await makeRequest('POST', '/feedings', feedingData, token);

    if (res.status === 201 && res.data.success) {
      const feeding = res.data.data;
      log(`✅ 创建喂养记录成功: ${feeding.foodName} ${feeding.amount}${feeding.unit}`, 'green');
      stats.passed++;
    } else {
      log(`❌ 创建喂养记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test2_getFeedingRecords() {
  log('\n📝 测试 2: 获取宠物的喂养记录列表', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(1);
    const pet = await createTestPet(token, { name: '小黑' });

    // 创建多条喂养记录
    const feedings = [];
    const meals = ['早餐', '午餐', '晚餐'];
    for (let i = 0; i < 3; i++) {
      const feedingData = {
        petId: pet.id,
        foodType: 'cat_food',
        foodName: '猫粮',
        amount: 100,
        unit: 'g',
        fedAt: new Date(Date.now() - (2 - i) * 8 * 60 * 60 * 1000).toISOString(),
        note: meals[i]
      };
      const res = await makeRequest('POST', '/feedings', feedingData, token);
      feedings.push(res.data.data);
    }

    log(`✅ 创建了 ${feedings.length} 条喂养记录`, 'green');

    // 获取喂养记录列表
    const res = await makeRequest('GET', `/feedings/pet/${pet.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      const records = res.data.data;
      log(`✅ 获取到 ${records.length} 条喂养记录`, 'green');
      
      if (records.length === 3) {
        stats.passed++;
      } else {
        log(`❌ 记录数量不匹配，期望 3，实际 ${records.length}`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 获取喂养记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test3_updateFeedingRecord() {
  log('\n📝 测试 3: 更新喂养记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(2);
    const pet = await createTestPet(token);

    const feedingData = {
      petId: pet.id,
      foodType: 'cat_food',
      foodName: '猫粮',
      amount: 100,
      unit: 'g',
      fedAt: new Date().toISOString()
    };

    const createRes = await makeRequest('POST', '/feedings', feedingData, token);
    const feeding = createRes.data.data;

    // 更新喂养记录
    const updateData = {
      amount: 120,
      note: '加了一点量'
    };

    const res = await makeRequest('PATCH', `/feedings/${feeding.id}`, updateData, token);

    if (res.status === 200 && res.data.success) {
      const updated = res.data.data;
      if (updated.amount === 120 && updated.note === '加了一点量') {
        log(`✅ 更新喂养记录成功: ${updated.amount}${updated.unit}`, 'green');
        stats.passed++;
      } else {
        log(`❌ 更新的数据不正确`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 更新喂养记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test4_deleteFeedingRecord() {
  log('\n📝 测试 4: 删除喂养记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(3);
    const pet = await createTestPet(token);

    const feedingData = {
      petId: pet.id,
      foodType: 'cat_food',
      foodName: '猫粮',
      amount: 100,
      unit: 'g',
      fedAt: new Date().toISOString()
    };

    const createRes = await makeRequest('POST', '/feedings', feedingData, token);
    const feeding = createRes.data.data;

    // 删除喂养记录
    const res = await makeRequest('DELETE', `/feedings/${feeding.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      log(`✅ 删除喂养记录成功`, 'green');

      // 验证已删除
      const getRes = await makeRequest('GET', `/feedings/${feeding.id}`, null, token);
      if (getRes.status === 404) {
        log(`✅ 已删除的记录无法访问 (404 Not Found)`, 'green');
        stats.passed++;
      } else {
        log(`❌ 已删除的记录仍可访问`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 删除喂养记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test5_batchImportFeedings() {
  log('\n📝 测试 5: 批量导入喂养记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(4);
    const pet = await createTestPet(token);

    const batchData = {
      petId: pet.id,
      records: [
        { foodType: 'cat_food', foodName: '猫粮', amount: 100, unit: 'g', fedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), note: '早餐' },
        { foodType: 'cat_food', foodName: '猫粮', amount: 100, unit: 'g', fedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), note: '午餐' },
        { foodType: 'cat_food', foodName: '猫粮', amount: 100, unit: 'g', fedAt: new Date().toISOString(), note: '晚餐' }
      ]
    };

    const res = await makeRequest('POST', '/feedings/batch', batchData, token);

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

async function test6_getFeedingStats() {
  log('\n📝 测试 6: 获取喂养统计分析', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(5);
    const pet = await createTestPet(token);

    // 创建喂养记录
    const feedings = [
      { foodType: 'cat_food', amount: 100, fedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { foodType: 'cat_food', amount: 100, fedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { foodType: 'cat_food', amount: 100, fedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { foodType: 'cat_food', amount: 100, fedAt: new Date().toISOString() }
    ];

    for (const f of feedings) {
      await makeRequest('POST', '/feedings', { 
        petId: pet.id, 
        foodName: '猫粮', 
        unit: 'g', 
        ...f 
      }, token);
    }

    // 获取统计分析
    const res = await makeRequest('GET', `/feedings/pet/${pet.id}/stats`, null, token);

    if (res.status === 200 && res.data.success) {
      const stats_data = res.data.data;
      log(`✅ 获取统计分析成功:`, 'green');
      log(`   - 总记录数: ${stats_data.totalRecords}`, 'cyan');
      log(`   - 总喂食量: ${stats_data.totalAmount}`, 'cyan');
      log(`   - 平均喂食量: ${stats_data.averageAmount}`, 'cyan');
      stats.passed++;
    } else {
      log(`❌ 获取统计分析失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test7_foodTypeEnum() {
  log('\n📝 测试 7: 食物类型枚举验证', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(6);
    const pet = await createTestPet(token);

    const foodTypes = ['cat_food', 'dog_food', 'treats', 'wet_food', 'raw_food', 'supplements', 'other'];
    let allPassed = true;

    for (const foodType of foodTypes) {
      const feedingData = {
        petId: pet.id,
        foodType: foodType,
        foodName: `测试${foodType}`,
        amount: 100,
        unit: 'g',
        fedAt: new Date().toISOString()
      };

      const res = await makeRequest('POST', '/feedings', feedingData, token);
      if (res.status !== 201) {
        log(`❌ 食物类型 ${foodType} 验证失败`, 'red');
        allPassed = false;
      }
    }

    if (allPassed) {
      log(`✅ 所有食物类型验证通过`, 'green');
      stats.passed++;
    } else {
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

    const feedingData = {
      petId: pet.id,
      foodType: 'cat_food',
      foodName: '猫粮',
      amount: 100,
      unit: 'g',
      fedAt: new Date().toISOString()
    };

    const createRes = await makeRequest('POST', '/feedings', feedingData, user1.token);
    const feeding = createRes.data.data;

    // 尝试用其他用户修改
    const res = await makeRequest('PATCH', `/feedings/${feeding.id}`, { amount: 120 }, user2.token);

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
  log('🚀 开始 Pet Feeding API 完整测试\n', 'bright');
  log(`📍 API 地址: ${config.baseUrl}`, 'yellow');
  log(`⏱️  超时设置: ${config.timeout}ms`, 'yellow');

  const tests = [
    test1_createFeedingRecord,
    test2_getFeedingRecords,
    test3_updateFeedingRecord,
    test4_deleteFeedingRecord,
    test5_batchImportFeedings,
    test6_getFeedingStats,
    test7_foodTypeEnum,
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

