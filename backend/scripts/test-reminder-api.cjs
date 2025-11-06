/**
 * Reminder API 完整测试脚本
 * 
 * 测试所有提醒相关的API端点
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
async function test1_createReminder() {
  log('\n📝 测试 1: 创建提醒 - 基础功能', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(0);
    log(`✅ 创建测试用户: ${user.email}`, 'green');

    const pet = await createTestPet(token, { name: '小白' });
    log(`✅ 创建测试宠物: ${pet.name}`, 'green');

    const reminderData = {
      petId: pet.id,
      type: 'vaccination',
      title: '狂犬疫苗提醒',
      description: '需要接种狂犬疫苗第二针',
      reminderTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: false
    };

    const res = await makeRequest('POST', '/reminders', reminderData, token);

    if (res.status === 201 && res.data.success) {
      const reminder = res.data.data;
      log(`✅ 创建提醒成功: ${reminder.title}`, 'green');
      stats.passed++;
    } else {
      log(`❌ 创建提醒失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test2_getReminders() {
  log('\n📝 测试 2: 获取宠物的提醒列表', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(1);
    const pet = await createTestPet(token, { name: '小黑' });

    // 创建多个提醒
    const reminders = [];
    const types = ['vaccination', 'deworming', 'checkup'];
    const titles = ['疫苗提醒', '驱虫提醒', '体检提醒'];
    
    for (let i = 0; i < 3; i++) {
      const reminderData = {
        petId: pet.id,
        type: types[i],
        title: titles[i],
        reminderTime: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false
      };
      const res = await makeRequest('POST', '/reminders', reminderData, token);
      reminders.push(res.data.data);
    }

    log(`✅ 创建了 ${reminders.length} 个提醒`, 'green');

    // 获取提醒列表
    const res = await makeRequest('GET', `/reminders/pet/${pet.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      const records = res.data.data;
      log(`✅ 获取到 ${records.length} 个提醒`, 'green');
      
      if (records.length === 3) {
        stats.passed++;
      } else {
        log(`❌ 提醒数量不匹配，期望 3，实际 ${records.length}`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 获取提醒列表失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test3_updateReminder() {
  log('\n📝 测试 3: 更新提醒', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(2);
    const pet = await createTestPet(token);

    const reminderData = {
      petId: pet.id,
      type: 'vaccination',
      title: '疫苗提醒',
      reminderTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: false
    };

    const createRes = await makeRequest('POST', '/reminders', reminderData, token);
    const reminder = createRes.data.data;

    // 更新提醒
    const updateData = {
      title: '狂犬疫苗提醒（已更新）',
      description: '更新后的描述',
      reminderTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const res = await makeRequest('PATCH', `/reminders/${reminder.id}`, updateData, token);

    if (res.status === 200 && res.data.success) {
      const updated = res.data.data;
      if (updated.title === '狂犬疫苗提醒（已更新）') {
        log(`✅ 更新提醒成功`, 'green');
        stats.passed++;
      } else {
        log(`❌ 更新的数据不正确`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 更新提醒失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test4_deleteReminder() {
  log('\n📝 测试 4: 删除提醒', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(3);
    const pet = await createTestPet(token);

    const reminderData = {
      petId: pet.id,
      type: 'vaccination',
      title: '疫苗提醒',
      reminderTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: false
    };

    const createRes = await makeRequest('POST', '/reminders', reminderData, token);
    const reminder = createRes.data.data;

    // 删除提醒
    const res = await makeRequest('DELETE', `/reminders/${reminder.id}`, null, token);

    if (res.status === 200 && res.data.success) {
      log(`✅ 删除提醒成功`, 'green');

      // 验证已删除
      const getRes = await makeRequest('GET', `/reminders/${reminder.id}`, null, token);
      if (getRes.status === 404) {
        log(`✅ 已删除的提醒无法访问 (404 Not Found)`, 'green');
        stats.passed++;
      } else {
        log(`❌ 已删除的提醒仍可访问`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 删除提醒失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test5_completeReminder() {
  log('\n📝 测试 5: 标记提醒为已完成', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(4);
    const pet = await createTestPet(token);

    const reminderData = {
      petId: pet.id,
      type: 'vaccination',
      title: '疫苗提醒',
      reminderTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: false
    };

    const createRes = await makeRequest('POST', '/reminders', reminderData, token);
    const reminder = createRes.data.data;

    // 标记为已完成
    const res = await makeRequest('POST', `/reminders/${reminder.id}/complete`, null, token);

    if (res.status === 200 && res.data.success) {
      const completed = res.data.data;
      if (completed.isCompleted === true && completed.completedAt) {
        log(`✅ 标记为已完成成功`, 'green');
        stats.passed++;
      } else {
        log(`❌ 完成状态不正确`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 标记为已完成失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test6_getUpcomingReminders() {
  log('\n📝 测试 6: 获取即将到期的提醒', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(5);
    const pet = await createTestPet(token);

    // 创建多个提醒，时间不同
    const reminders = [
      { title: '明天的提醒', days: 1 },
      { title: '3天后的提醒', days: 3 },
      { title: '7天后的提醒', days: 7 },
      { title: '30天后的提醒', days: 30 }
    ];

    for (const r of reminders) {
      await makeRequest('POST', '/reminders', {
        petId: pet.id,
        type: 'vaccination',
        title: r.title,
        reminderTime: new Date(Date.now() + r.days * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false
      }, token);
    }

    // 获取7天内的提醒
    const res = await makeRequest('GET', '/reminders/upcoming?days=7', null, token);

    if (res.status === 200 && res.data.success) {
      const upcoming = res.data.data;
      log(`✅ 获取到 ${upcoming.length} 个即将到期的提醒`, 'green');
      
      // 应该只有3个（1天、3天、7天的）
      if (upcoming.length === 3) {
        log(`✅ 提醒数量正确（7天内应该有3个）`, 'green');
        stats.passed++;
      } else {
        log(`❌ 提醒数量不正确，期望3，实际${upcoming.length}`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 获取即将到期的提醒失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test7_recurringReminder() {
  log('\n📝 测试 7: 循环提醒', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(6);
    const pet = await createTestPet(token);

    const reminderData = {
      petId: pet.id,
      type: 'feeding',
      title: '每日喂食提醒',
      reminderTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      recurringInterval: 'daily',
      recurringEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const res = await makeRequest('POST', '/reminders', reminderData, token);

    if (res.status === 201 && res.data.success) {
      const reminder = res.data.data;
      if (reminder.isRecurring === true && reminder.recurringInterval === 'daily') {
        log(`✅ 创建循环提醒成功`, 'green');
        stats.passed++;
      } else {
        log(`❌ 循环提醒配置不正确`, 'red');
        stats.failed++;
      }
    } else {
      log(`❌ 创建循环提醒失败: ${JSON.stringify(res.data)}`, 'red');
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test8_reminderTypeEnum() {
  log('\n📝 测试 8: 提醒类型枚举验证', 'cyan');
  stats.total++;

  try {
    const { user, token } = await createTestUser(7);
    const pet = await createTestPet(token);

    const reminderTypes = ['vaccination', 'deworming', 'checkup', 'grooming', 'feeding', 'medication', 'other'];
    let allPassed = true;

    for (const type of reminderTypes) {
      const reminderData = {
        petId: pet.id,
        type: type,
        title: `测试${type}提醒`,
        reminderTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isRecurring: false
      };

      const res = await makeRequest('POST', '/reminders', reminderData, token);
      if (res.status !== 201) {
        log(`❌ 提醒类型 ${type} 验证失败`, 'red');
        allPassed = false;
      }
    }

    if (allPassed) {
      log(`✅ 所有提醒类型验证通过`, 'green');
      stats.passed++;
    } else {
      stats.failed++;
    }
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    stats.failed++;
  }
}

async function test9_permissions() {
  log('\n📝 测试 9: 权限控制', 'cyan');
  stats.total++;

  try {
    const user1 = await createTestUser(8);
    const user2 = await createTestUser(9);

    const pet = await createTestPet(user1.token);

    const reminderData = {
      petId: pet.id,
      type: 'vaccination',
      title: '疫苗提醒',
      reminderTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: false
    };

    const createRes = await makeRequest('POST', '/reminders', reminderData, user1.token);
    const reminder = createRes.data.data;

    // 尝试用其他用户修改
    const res = await makeRequest('PATCH', `/reminders/${reminder.id}`, { title: '修改后的标题' }, user2.token);

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
  log('🚀 开始 Reminder API 完整测试\n', 'bright');
  log(`📍 API 地址: ${config.baseUrl}`, 'yellow');
  log(`⏱️  超时设置: ${config.timeout}ms`, 'yellow');

  const tests = [
    test1_createReminder,
    test2_getReminders,
    test3_updateReminder,
    test4_deleteReminder,
    test5_completeReminder,
    test6_getUpcomingReminders,
    test7_recurringReminder,
    test8_reminderTypeEnum,
    test9_permissions
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

