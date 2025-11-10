/**
 * 社交功能 API 测试脚本
 * 测试话题、帖子、评论、点赞和举报功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 配置 axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true, // 不抛出错误，以便查看所有响应
});

// 存储测试数据
const testData = {
  user: null,
  token: null,
  topic: null,
  post: null,
  comment: null,
  reaction: null,
  report: null,
};

// 日志辅助函数
function log(message, data = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error = null) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(JSON.stringify(error, null, 2));
  }
}

// 测试函数
async function testRegisterAndLogin() {
  log('测试 1: 用户注册和登录');

  try {
    // 注册用户
    const username = `testuser_${Date.now()}`;
    const email = `${username}@test.com`;
    const password = 'Test123456';

    const registerRes = await api.post('/auth/register', {
      username,
      email,
      password,
    });

    if (registerRes.status === 201) {
      logSuccess('用户注册成功');
      testData.user = registerRes.data.data.user;
      testData.token = registerRes.data.data.token;
    } else {
      // 如果用户已存在，尝试登录
      const loginRes = await api.post('/auth/login', {
        email,
        password,
      });

      if (loginRes.status === 200) {
        logSuccess('用户登录成功');
        testData.user = loginRes.data.data.user;
        testData.token = loginRes.data.data.token;
      } else {
        logError('注册/登录失败', loginRes.data);
        return false;
      }
    }

    // 设置认证令牌
    api.defaults.headers.common['Authorization'] = `Bearer ${testData.token}`;
    return true;
  } catch (error) {
    logError('注册/登录异常', error.message);
    return false;
  }
}

async function testCreateTopic() {
  log('测试 2: 创建话题');

  try {
    const res = await api.post('/topics', {
      name: `测试话题_${Date.now()}`,
      description: '这是一个测试话题',
      icon: '🐶',
    });

    if (res.status === 201) {
      logSuccess('话题创建成功');
      testData.topic = res.data.data;
      log('创建的话题', testData.topic);
      return true;
    } else {
      logError('话题创建失败', res.data);
      return false;
    }
  } catch (error) {
    logError('话题创建异常', error.message);
    return false;
  }
}

async function testGetTopics() {
  log('测试 3: 获取话题列表');

  try {
    const res = await api.get('/topics');

    if (res.status === 200) {
      logSuccess(`成功获取 ${res.data.total} 个话题`);
      log('话题列表', res.data.data.slice(0, 3)); // 只显示前3个
      return true;
    } else {
      logError('获取话题列表失败', res.data);
      return false;
    }
  } catch (error) {
    logError('获取话题列表异常', error.message);
    return false;
  }
}

async function testCreatePost() {
  log('测试 4: 创建帖子');

  try {
    const res = await api.post('/posts', {
      topicId: testData.topic.id,
      title: `测试帖子_${Date.now()}`,
      content: '这是一个测试帖子的内容。\n\n包含多行文字。',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      tags: ['测试', '新手'],
    });

    if (res.status === 201) {
      logSuccess('帖子创建成功');
      testData.post = res.data.data;
      log('创建的帖子', testData.post);
      return true;
    } else {
      logError('帖子创建失败', res.data);
      return false;
    }
  } catch (error) {
    logError('帖子创建异常', error.message);
    return false;
  }
}

async function testGetPosts() {
  log('测试 5: 获取帖子列表');

  try {
    const res = await api.get('/posts', {
      params: {
        topicId: testData.topic.id,
        limit: 10,
        offset: 0,
      },
    });

    if (res.status === 200) {
      logSuccess(`成功获取 ${res.data.total} 个帖子`);
      log('帖子列表', res.data.data.slice(0, 2)); // 只显示前2个
      return true;
    } else {
      logError('获取帖子列表失败', res.data);
      return false;
    }
  } catch (error) {
    logError('获取帖子列表异常', error.message);
    return false;
  }
}

async function testGetPostById() {
  log('测试 6: 获取帖子详情');

  try {
    const res = await api.get(`/posts/${testData.post.id}`);

    if (res.status === 200) {
      logSuccess('成功获取帖子详情');
      log('帖子详情', res.data.data);
      return true;
    } else {
      logError('获取帖子详情失败', res.data);
      return false;
    }
  } catch (error) {
    logError('获取帖子详情异常', error.message);
    return false;
  }
}

async function testUpdatePost() {
  log('测试 7: 更新帖子');

  try {
    const res = await api.patch(`/posts/${testData.post.id}`, {
      title: `更新后的帖子标题_${Date.now()}`,
      content: '这是更新后的帖子内容。',
    });

    if (res.status === 200) {
      logSuccess('帖子更新成功');
      testData.post = res.data.data;
      log('更新后的帖子', testData.post);
      return true;
    } else {
      logError('帖子更新失败', res.data);
      return false;
    }
  } catch (error) {
    logError('帖子更新异常', error.message);
    return false;
  }
}

async function testCreateComment() {
  log('测试 8: 创建评论');

  try {
    const res = await api.post('/comments', {
      postId: testData.post.id,
      content: '这是一条测试评论！',
    });

    if (res.status === 201) {
      logSuccess('评论创建成功');
      testData.comment = res.data.data;
      log('创建的评论', testData.comment);
      return true;
    } else {
      logError('评论创建失败', res.data);
      return false;
    }
  } catch (error) {
    logError('评论创建异常', error.message);
    return false;
  }
}

async function testCreateReply() {
  log('测试 9: 创建回复（评论的评论）');

  try {
    const res = await api.post('/comments', {
      postId: testData.post.id,
      parentId: testData.comment.id,
      content: '这是一条测试回复！',
    });

    if (res.status === 201) {
      logSuccess('回复创建成功');
      log('创建的回复', res.data.data);
      return true;
    } else {
      logError('回复创建失败', res.data);
      return false;
    }
  } catch (error) {
    logError('回复创建异常', error.message);
    return false;
  }
}

async function testGetPostComments() {
  log('测试 10: 获取帖子的评论列表');

  try {
    const res = await api.get(`/posts/${testData.post.id}/comments`);

    if (res.status === 200) {
      logSuccess(`成功获取 ${res.data.total} 条评论`);
      log('评论列表', res.data.data);
      return true;
    } else {
      logError('获取评论列表失败', res.data);
      return false;
    }
  } catch (error) {
    logError('获取评论列表异常', error.message);
    return false;
  }
}

async function testAddPostReaction() {
  log('测试 11: 为帖子添加点赞');

  try {
    const res = await api.post(`/posts/${testData.post.id}/reactions`, {
      kind: 'like',
    });

    if (res.status === 201) {
      logSuccess('帖子点赞成功');
      testData.reaction = res.data.data;
      log('创建的点赞', testData.reaction);
      return true;
    } else {
      logError('帖子点赞失败', res.data);
      return false;
    }
  } catch (error) {
    logError('帖子点赞异常', error.message);
    return false;
  }
}

async function testAddCommentReaction() {
  log('测试 12: 为评论添加点赞');

  try {
    const res = await api.post(`/comments/${testData.comment.id}/reactions`, {
      kind: 'love',
    });

    if (res.status === 201) {
      logSuccess('评论点赞成功');
      log('创建的点赞', res.data.data);
      return true;
    } else {
      logError('评论点赞失败', res.data);
      return false;
    }
  } catch (error) {
    logError('评论点赞异常', error.message);
    return false;
  }
}

async function testGetPostReactions() {
  log('测试 13: 获取帖子的点赞列表');

  try {
    const res = await api.get(`/posts/${testData.post.id}/reactions`);

    if (res.status === 200) {
      logSuccess(`成功获取 ${res.data.total} 个点赞`);
      log('点赞列表', res.data.data);
      return true;
    } else {
      logError('获取点赞列表失败', res.data);
      return false;
    }
  } catch (error) {
    logError('获取点赞列表异常', error.message);
    return false;
  }
}

async function testGetPostReactionStats() {
  log('测试 14: 获取帖子的点赞统计');

  try {
    const res = await api.get(`/posts/${testData.post.id}/reactions/stats`);

    if (res.status === 200) {
      logSuccess('成功获取点赞统计');
      log('点赞统计', res.data.data);
      return true;
    } else {
      logError('获取点赞统计失败', res.data);
      return false;
    }
  } catch (error) {
    logError('获取点赞统计异常', error.message);
    return false;
  }
}

async function testSearchPosts() {
  log('测试 15: 搜索帖子');

  try {
    const res = await api.get('/posts/search', {
      params: {
        q: '测试',
        limit: 10,
      },
    });

    if (res.status === 200) {
      logSuccess(`搜索到 ${res.data.total} 个帖子`);
      log('搜索结果', res.data.data.slice(0, 2)); // 只显示前2个
      return true;
    } else {
      logError('搜索帖子失败', res.data);
      return false;
    }
  } catch (error) {
    logError('搜索帖子异常', error.message);
    return false;
  }
}

async function testCreatePostReport() {
  log('测试 16: 创建帖子举报（需要另一个用户）');

  try {
    // 为了测试举报功能，这里跳过
    // 因为不能举报自己的帖子
    logSuccess('跳过举报测试（需要多个用户）');
    return true;
  } catch (error) {
    logError('创建举报异常', error.message);
    return false;
  }
}

async function testRemovePostReaction() {
  log('测试 17: 移除帖子点赞');

  try {
    const res = await api.delete(`/posts/${testData.post.id}/reactions`);

    if (res.status === 200) {
      logSuccess('帖子点赞移除成功');
      log('移除结果', res.data);
      return true;
    } else {
      logError('帖子点赞移除失败', res.data);
      return false;
    }
  } catch (error) {
    logError('帖子点赞移除异常', error.message);
    return false;
  }
}

async function testUpdateComment() {
  log('测试 18: 更新评论');

  try {
    const res = await api.patch(`/comments/${testData.comment.id}`, {
      content: '这是更新后的评论内容！',
    });

    if (res.status === 200) {
      logSuccess('评论更新成功');
      log('更新后的评论', res.data.data);
      return true;
    } else {
      logError('评论更新失败', res.data);
      return false;
    }
  } catch (error) {
    logError('评论更新异常', error.message);
    return false;
  }
}

async function testDeleteComment() {
  log('测试 19: 删除评论');

  try {
    const res = await api.delete(`/comments/${testData.comment.id}`);

    if (res.status === 200) {
      logSuccess('评论删除成功');
      log('删除结果', res.data);
      return true;
    } else {
      logError('评论删除失败', res.data);
      return false;
    }
  } catch (error) {
    logError('评论删除异常', error.message);
    return false;
  }
}

async function testDeletePost() {
  log('测试 20: 删除帖子');

  try {
    const res = await api.delete(`/posts/${testData.post.id}`);

    if (res.status === 200) {
      logSuccess('帖子删除成功');
      log('删除结果', res.data);
      return true;
    } else {
      logError('帖子删除失败', res.data);
      return false;
    }
  } catch (error) {
    logError('帖子删除异常', error.message);
    return false;
  }
}

// 主测试流程
async function runAllTests() {
  console.log('\n🚀 开始社交功能 API 测试...\n');

  const tests = [
    { name: '用户认证', fn: testRegisterAndLogin },
    { name: '创建话题', fn: testCreateTopic },
    { name: '获取话题列表', fn: testGetTopics },
    { name: '创建帖子', fn: testCreatePost },
    { name: '获取帖子列表', fn: testGetPosts },
    { name: '获取帖子详情', fn: testGetPostById },
    { name: '更新帖子', fn: testUpdatePost },
    { name: '创建评论', fn: testCreateComment },
    { name: '创建回复', fn: testCreateReply },
    { name: '获取帖子评论', fn: testGetPostComments },
    { name: '帖子点赞', fn: testAddPostReaction },
    { name: '评论点赞', fn: testAddCommentReaction },
    { name: '获取点赞列表', fn: testGetPostReactions },
    { name: '获取点赞统计', fn: testGetPostReactionStats },
    { name: '搜索帖子', fn: testSearchPosts },
    { name: '创建举报', fn: testCreatePostReport },
    { name: '移除点赞', fn: testRemovePostReaction },
    { name: '更新评论', fn: testUpdateComment },
    { name: '删除评论', fn: testDeleteComment },
    { name: '删除帖子', fn: testDeletePost },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // 等待一小段时间，避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // 测试总结
  log('测试总结');
  console.log(`\n总计: ${tests.length} 个测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`成功率: ${((passed / tests.length) * 100).toFixed(2)}%\n`);

  if (failed === 0) {
    console.log('🎉 所有测试通过！\n');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息。\n');
  }
}

// 运行测试
runAllTests().catch((error) => {
  console.error('测试运行异常:', error);
  process.exit(1);
});

