/**
 * 调试脚本 - 测试创建宠物
 */

const BASE_URL = 'http://localhost:3000/api';

async function testCreatePet() {
  // 1. 先注册并登录
  const timestamp = Date.now();
  const email = `debuguser_${timestamp}@example.com`;
  const username = `debuguser_${timestamp}`;
  const password = 'TestPassword123!';

  console.log('1. 注册用户...');
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
  console.log('注册响应:', JSON.stringify(registerData, null, 2));

  if (!registerRes.ok) {
    throw new Error('注册失败');
  }

  const accessToken = registerData.data.tokens.accessToken;
  console.log('\n2. 获取到 token:', accessToken.substring(0, 50) + '...');

  // 2. 创建宠物
  console.log('\n3. 创建宠物...');
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

  console.log('请求数据:', JSON.stringify(petData, null, 2));

  const createRes = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(petData),
  });

  const createData = await createRes.json();
  console.log('\n创建宠物响应状态:', createRes.status);
  console.log('创建宠物响应:', JSON.stringify(createData, null, 2));

  if (!createRes.ok) {
    console.error('\n❌ 创建失败!');
    process.exit(1);
  }

  console.log('\n✅ 创建成功!');
}

testCreatePet().catch((error) => {
  console.error('错误:', error);
  process.exit(1);
});

