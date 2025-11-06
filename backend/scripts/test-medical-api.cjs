/**
 * Pet Medical API 完整测试脚本
 * 
 * 测试所有医疗记录相关的API端点
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
async function test1_createMedicalRecord() {
  log('\n📝 测试 1: 添加医疗记录 - 基础功能', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(0);
    log(`✅ 创建测试用户: ${user.email}`, 'green');

    const pet = await createTestPet(token, { name: '小白' });
    log(`✅ 创建测试宠物: ${pet.name}`, 'green');

    const medicalData = {
      petId: pet.id,
      type: 'vaccination',
      title: '狂犬疫苗接种',
      visitDate: new Date().toISOString(),
      veterinarian: '张医生',
      clinic: '宠物医院',
      diagnosis: '健康',
      treatment: '接种狂犬疫苗',
      cost: 150,
      note: '第一针'
    };

    const res = await makeRequest('POST', '/medicals', medicalData, token);

    if (res.status === 201 && res.data.success) {
      const medical = res.data.data;
      log(`✅ 创建医疗记录成功: ${medical.title}`, 'green');
      stats.passed++;
    } else {
      log(`❌ 创建医疗记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test2_getMedicalRecords() {
  log('\n📝 测试 2: 获取宠物的医疗记录列表', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(1);
    const pet = await createTestPet(token, { name: '小黑' });

    // 创建多条医疗记录
    const medicals = [];
    const types = ['vaccination', 'checkup', 'treatment'];
    const titles = ['疫苗接种', '健康检查', '感冒治疗'];
    
    for (let i = 0; i < 3; i++) {
      const medicalData = {
        petId: pet.id,
        type: types[i],
        title: titles[i],
        visitDate: new Date(Date.now() - (2 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        veterinarian: '张医生',
        clinic: '宠物医院'
      };
      const res = await makeRequest('POST', '/medicals', medicalData, token);
      medicals.push(res.data.data);
    }

    log(`✅ 创建了 ${medicals.length} 条医疗记录`, 'green');

    // 获取医疗记录列表
    const res = await makeRequest('GET', `/medicals/pet/${pet.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      const records = res.data.data;
      log(`✅ 获取到 ${records.length} 条医疗记录`, 'green');
      
      if (records.length === 3) {
        stats.passed++;
      } else {
        log(`❌ 记录数量不匹配，期望 3，实际 ${records.length}`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 获取医疗记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test3_updateMedicalRecord() {
  log('\n📝 测试 3: 更新医疗记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(2);
    const pet = await createTestPet(token);

    const medicalData = {
      petId: pet.id,
      type: 'checkup',
      title: '健康检查',
      visitDate: new Date().toISOString(),
      veterinarian: '张医生',
      clinic: '宠物医院'
    };

    const createRes = await makeRequest('POST', '/medicals', medicalData, token);
    const medical = createRes.data.data;

    // 更新医疗记录
    const updateData = {
      diagnosis: '一切正常',
      cost: 200,
      note: '已完成体检'
    };

    const res = await makeRequest('PATCH', `/medicals/${medical.id}`, updateData, token);

    if (res.status === 200 && res.data.success) {
      const updated = res.data.data;
      if (updated.diagnosis === '一切正常' && updated.cost === 200) {
        log(`✅ 更新医疗记录成功`, 'green');
        stats.passed++;
      } else {
        log(`❌ 更新的数据不正确`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 更新医疗记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test4_deleteMedicalRecord() {
  log('\n📝 测试 4: 删除医疗记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(3);
    const pet = await createTestPet(token);

    const medicalData = {
      petId: pet.id,
      type: 'checkup',
      title: '健康检查',
      visitDate: new Date().toISOString(),
      veterinarian: '张医生',
      clinic: '宠物医院'
    };

    const createRes = await makeRequest('POST', '/medicals', medicalData, token);
    const medical = createRes.data.data;

    // 删除医疗记录
    const res = await makeRequest('DELETE', `/medicals/${medical.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      log(`✅ 删除医疗记录成功`, 'green');

      // 验证已删除
      const getRes = await makeRequest('GET', `/medicals/${medical.id}`, null, token);
      if (getRes.status === 404) {
        log(`✅ 已删除的记录无法访问 (404 Not Found)`, 'green');
        stats.passed++;
      } else {
        log(`❌ 已删除的记录仍可访问`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 删除医疗记录失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test5_batchImportMedicals() {
  log('\n📝 测试 5: 批量导入医疗记录', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(4);
    const pet = await createTestPet(token);

    const batchData = {
      petId: pet.id,
      records: [
        { 
          type: 'vaccination', 
          title: '狂犬疫苗第一针', 
          visitDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          veterinarian: '张医生',
          clinic: '宠物医院'
        },
        { 
          type: 'vaccination', 
          title: '狂犬疫苗第二针', 
          visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          veterinarian: '张医生',
          clinic: '宠物医院'
        },
        { 
          type: 'checkup', 
          title: '年度体检', 
          visitDate: new Date().toISOString(),
          veterinarian: '李医生',
          clinic: '宠物医院'
        }
      ]
    };

    const res = await makeRequest('POST', '/medicals/batch', batchData, token);

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

async function test6_getMedicalStats() {
  log('\n📝 测试 6: 获取医疗统计分析', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(5);
    const pet = await createTestPet(token);

    // 创建医疗记录
    const medicals = [
      { type: 'vaccination', title: '疫苗1', cost: 100 },
      { type: 'checkup', title: '体检', cost: 200 },
      { type: 'treatment', title: '治疗', cost: 300 },
      { type: 'vaccination', title: '疫苗2', cost: 100 }
    ];

    for (const m of medicals) {
      await makeRequest('POST', '/medicals', { 
        petId: pet.id,
        visitDate: new Date().toISOString(),
        veterinarian: '张医生',
        clinic: '宠物医院',
        ...m 
      }, token);
    }

    // 获取统计分析
    const res = await makeRequest('GET', `/medicals/pet/${pet.id}/stats`, null, token);

    if (res.status === 200 && res.data.success) {
      const stats_data = res.data.data;
      log(`✅ 获取统计分析成功:`, 'green');
      log(`   - 总记录数: ${stats_data.totalRecords}`, 'cyan');
      log(`   - 总费用: ${stats_data.totalCost}`, 'cyan');
      log(`   - 平均费用: ${stats_data.averageCost}`, 'cyan');
      if (stats_data.byType) {
        log(`   - 按类型统计:`, 'cyan');
        for (const [type, count] of Object.entries(stats_data.byType)) {
          log(`     * ${type}: ${count}`, 'cyan');
        }
      }
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

async function test7_medicalTypeEnum() {
  log('\n📝 测试 7: 医疗类型枚举验证', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(6);
    const pet = await createTestPet(token);

    const medicalTypes = ['vaccination', 'deworming', 'checkup', 'treatment', 'surgery', 'dental', 'grooming', 'other'];
    let allPassed = true;

    for (const type of medicalTypes) {
      const medicalData = {
        petId: pet.id,
        type: type,
        title: `测试${type}`,
        visitDate: new Date().toISOString(),
        veterinarian: '测试医生',
        clinic: '测试医院'
      };

      const res = await makeRequest('POST', '/medicals', medicalData, token);
      if (res.status !== 201) {
        log(`❌ 医疗类型 ${type} 验证失败`, 'red');
        allPassed = false;
      }
    }

    if (allPassed) {
      log(`✅ 所有医疗类型验证通过`, 'green');
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

    const medicalData = {
      petId: pet.id,
      type: 'checkup',
      title: '健康检查',
      visitDate: new Date().toISOString(),
      veterinarian: '张医生',
      clinic: '宠物医院'
    };

    const createRes = await makeRequest('POST', '/medicals', medicalData, user1.token);
    const medical = createRes.data.data;

    // 尝试用其他用户修改
    const res = await makeRequest('PATCH', `/medicals/${medical.id}`, { cost: 500 }, user2.token);

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
  log('🚀 开始 Pet Medical API 完整测试\n', 'bright');
  log(`📍 API 地址: ${config.baseUrl}`, 'yellow');
  log(`⏱️  超时设置: ${config.timeout}ms`, 'yellow');

  const tests = [
    test1_createMedicalRecord,
    test2_getMedicalRecords,
    test3_updateMedicalRecord,
    test4_deleteMedicalRecord,
    test5_batchImportMedicals,
    test6_getMedicalStats,
    test7_medicalTypeEnum,
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

