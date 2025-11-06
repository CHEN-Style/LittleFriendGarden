/**
 * 调试请求脚本 - 用于测试单个请求
 */

const BASE_URL = 'http://localhost:3000/api';

// 1. 注册用户
async function registerUser() {
  const timestamp = Date.now();
  const email = `debuguser_${timestamp}@example.com`;
  const username = `debuguser_${timestamp}`;
  const password = 'TestPassword123!';

  console.log('\n=== 注册用户 ===');
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      username,
      password,
      profile: {
        displayName: 'Debug User',
        bio: '调试用户',
      },
    }),
  });

  const registerData = await registerRes.json();
  console.log('Status:', registerRes.status);
  console.log('Response:', JSON.stringify(registerData, null, 2));

  if (!registerRes.ok) {
    throw new Error('注册失败');
  }

  const accessToken = registerData.data.tokens.accessToken;
  console.log('\n✅ 注册成功');
  console.log('Token:', accessToken);

  return accessToken;
}

// 2. 创建宠物
async function createPet(accessToken) {
  console.log('\n=== 创建宠物 ===');
  
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

  console.log('Request body:', JSON.stringify(petData, null, 2));

  const response = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(petData),
  });

  const responseText = await response.text();
  console.log('Status:', response.status);
  console.log('Response text:', responseText);

  let responseData;
  try {
    responseData = JSON.parse(responseText);
    console.log('Response JSON:', JSON.stringify(responseData, null, 2));
  } catch (e) {
    console.log('Failed to parse response as JSON');
  }

  return responseData;
}

// 主函数
async function main() {
  try {
    const accessToken = await registerUser();
    await createPet(accessToken);
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  }
}

main();

