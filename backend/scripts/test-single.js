/**
 * 单个测试 - 用于调试
 */

import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3000/api';

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

  console.log('\n=== Request ===');
  console.log('URL:', url);
  console.log('Method:', method);
  console.log('Headers:', config.headers);
  console.log('Body:', body);
  console.log('Body type:', typeof body);

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    
    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('Response text:', text);
    
    let data;
    try {
      data = text ? JSON.parse(text) : null;
      console.log('Response JSON:', JSON.stringify(data, null, 2));
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

async function createTestUser() {
  const timestamp = Date.now();
  const email = `testuser_${timestamp}@example.com`;
  const username = `testuser_${timestamp}`;
  const password = 'TestPassword123!';

  console.log('\n========== 注册用户 ==========');
  const registerRes = await request('POST', '/auth/register', {
    body: {
      email,
      username,
      password,
      profile: {
        displayName: 'Test User',
        bio: '测试用户',
      },
    },
  });

  if (!registerRes.ok) {
    throw new Error(`注册失败: ${registerRes.status}`);
  }

  const userId = registerRes.data.data.user.id;
  const accessToken = registerRes.data.data.tokens.accessToken;

  console.log(`\n✅ 用户创建成功: ${email} (ID: ${userId})`);
  return { userId, accessToken, email, username };
}

async function testCreatePet() {
  console.log('\n========== 测试: 创建宠物 ==========');
  
  const { userId, accessToken } = await createTestUser();
  
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

  console.log('\n========== 创建宠物 ==========');
  const response = await request('POST', '/pets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: petData,
  });

  if (response.status !== 201) {
    console.error('\n❌ 测试失败');
    console.error('期望状态码: 201');
    console.error('实际状态码:', response.status);
    console.error('响应:', JSON.stringify(response.data, null, 2));
    process.exit(1);
  }

  console.log('\n✅ 测试成功');
  console.log('宠物ID:', response.data.data.id);
  console.log('宠物名称:', response.data.data.name);
}

testCreatePet().catch((error) => {
  console.error('\n❌ 错误:', error.message);
  console.error(error.stack);
  process.exit(1);
});

