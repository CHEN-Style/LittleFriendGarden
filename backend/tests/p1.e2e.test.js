import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet, auth } from './helpers/testUtils.js';

// P1 全量端到端测试（以真实用户旅程为主线）
// 覆盖范围：@auth/ @pet/ @social/ 以及日历聚合与待办

describe('P1 全量端到端测试（真实用户旅程）', () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let pet;

  let todoIds = [];
  let reminderIds = [];
  let postId;
  let commentId;
  let topicId;

  beforeAll(async () => {
    // 注册两个用户
    userA = await registerAndGetToken(app, 1001);
    userB = await registerAndGetToken(app, 1002);
    tokenA = userA.token;
    tokenB = userB.token;

    // User A 创建一个宠物
    pet = await createTestPet(app, tokenA, { name: '小白-P1' });
  });

  // =============================
  // @auth 用户账号生命周期
  // =============================
  it('@auth: 登录、获取/更新个人资料、鉴权校验', async () => {
    // 登录（使用 username）
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ identifier: userB.username, password: 'TestPassword123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body?.data?.tokens?.accessToken).toBeTruthy();

    // 获取当前用户信息
    const meRes = await request(app)
      .get('/api/auth/me')
      .set(auth(tokenA));
    expect(meRes.status).toBe(200);
    expect(meRes.body?.success).toBe(true);
    expect(meRes.body?.data?.user?.id).toBe(userA.userId);

    // 更新当前用户资料（profile.upsert）
    const updateRes = await request(app)
      .patch('/api/auth/me')
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ profile: { displayName: '猫主子A', bio: '爱猫人士' } });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body?.data?.user?.profile?.displayName).toBe('猫主子A');

    // 未认证访问受限端点返回 401
    const unauthRes = await request(app).get('/api/pets');
    expect(unauthRes.status).toBe(401);
  });

  // =============================
  // @pet 宠物 + 子资源（体重/喂养/医疗/提醒、共享）
  // =============================
  it('@pet: 基本资源与权限（共享前后对比）', async () => {
    // User B 访问 A 的宠物详情应被拒绝
    const bViewBefore = await request(app)
      .get(`/api/pets/${pet.id}`)
      .set(auth(tokenB));
    expect([403, 404]).toContain(bViewBefore.status);

    // A 添加 B 为共享成员（owner）
    const addOwnerRes = await request(app)
      .post(`/api/pets/${pet.id}/owners`)
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ userId: userB.userId, role: 'owner', note: '帮忙照看' });
    expect(addOwnerRes.status).toBe(201);
    expect(addOwnerRes.body?.data?.user?.id).toBe(userB.userId);

    // 共享后 B 可查看宠物
    const bViewAfter = await request(app)
      .get(`/api/pets/${pet.id}`)
      .set(auth(tokenB));
    expect(bViewAfter.status).toBe(200);
    expect(bViewAfter.body?.data?.id).toBe(pet.id);

    // A 临时移除 B 的共享，再验证访问受限
    const removeRes = await request(app)
      .delete(`/api/pets/${pet.id}/owners/${userB.userId}`)
      .set(auth(tokenA));
    expect(removeRes.status).toBe(200);

    const bViewAfterRemove = await request(app)
      .get(`/api/pets/${pet.id}`)
      .set(auth(tokenB));
    expect([403, 404]).toContain(bViewAfterRemove.status);

    // A 重新添加 B（family），以便后续 B 能创建子记录
    const reAddRes = await request(app)
      .post(`/api/pets/${pet.id}/owners`)
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ userId: userB.userId, role: 'family' });
    expect(reAddRes.status).toBe(201);
  });

  it('@pet: 喂养/体重/医疗 基本流转', async () => {
    // B 创建喂养记录
    const feedingPayload = {
      fedAt: new Date().toISOString(),
      amountG: 88,
      caloriesKcal: 40.5,
      note: '早餐试吃',
    };
    const feedingRes = await request(app)
      .post(`/api/pets/${pet.id}/feedings`)
      .set(auth(tokenB))
      .set('Content-Type', 'application/json')
      .send(feedingPayload);
    expect(feedingRes.status).toBe(201);
    const feedingId = feedingRes.body?.data?.id;

    // A 创建体重记录
    const weightRes = await request(app)
      .post(`/api/pets/${pet.id}/weights`)
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ measuredAt: new Date().toISOString(), weightKg: 4.25, source: 'home_scale' });
    expect(weightRes.status).toBe(201);

    // A 创建医疗记录（疫苗）
    const medicalRes = await request(app)
      .post(`/api/pets/${pet.id}/medicals`)
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({
        recordType: 'vaccine',
        recordedAt: new Date().toISOString(),
        title: '疫苗接种-基础针',
        vaccineName: '猫三联',
        nextDueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        clinicName: '宠物医院',
      });
    expect(medicalRes.status).toBe(201);

    // 查询宠物喂养列表
    const listFeedings = await request(app)
      .get(`/api/pets/${pet.id}/feedings`)
      .set(auth(tokenA));
    expect(listFeedings.status).toBe(200);
    expect(Array.isArray(listFeedings.body?.data)).toBe(true);

    // 查询“我的喂养列表”（B）
    const myFeedings = await request(app)
      .get('/api/feedings/my')
      .set(auth(tokenB));
    expect(myFeedings.status).toBe(200);

    // 获取最新体重
    const latestWeight = await request(app)
      .get(`/api/pets/${pet.id}/weights/latest`)
      .set(auth(tokenA));
    expect(latestWeight.status).toBe(200);
    expect(latestWeight.body?.data?.weightKg).toBeDefined();

    // 获取疫苗即将到期（所有宠物）
    const upcomingVaccines = await request(app)
      .get('/api/medicals/vaccines/upcoming')
      .set(auth(tokenA));
    expect(upcomingVaccines.status).toBe(200);

    // 清理：删除创建的喂养记录（验证权限：B 可删自己的）
    const delFeeding = await request(app)
      .delete(`/api/feedings/${feedingId}`)
      .set(auth(tokenB));
    expect(delFeeding.status).toBe(200);
  });

  // =============================
  // 任务/提醒/日历聚合（User A）
  // =============================
  it('@auth-calendar: 待办/提醒/统计 与 日历聚合', async () => {
    const now = Date.now();

    // 创建 3 条待办：今日、逾期、将来
    const mkTodo = async (payload) => {
      const r = await request(app)
        .post('/api/todos')
        .set(auth(tokenA))
        .set('Content-Type', 'application/json')
        .send(payload);
      expect([200, 201]).toContain(r.status);
      return r.body.data.id;
    };

    const todoTodayId = await mkTodo({
      petId: pet.id,
      title: `今日待办_${now}`,
      priority: 'high',
      scheduledAt: new Date(now + 30 * 60 * 1000).toISOString(),
      dueAt: new Date(now + 60 * 60 * 1000).toISOString(),
    });
    const todoOverdueId = await mkTodo({
      title: `逾期待办_${now}`,
      priority: 'medium',
      dueAt: new Date(now - 60 * 60 * 1000).toISOString(), // 允许创建过去 dueAt
    });
    const todoFutureId = await mkTodo({
      title: `未来待办_${now}`,
      priority: 'low',
      scheduledAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
    todoIds.push(todoTodayId, todoOverdueId, todoFutureId);

    // 查询待办列表/统计/今日/逾期
    const todosList = await request(app).get('/api/todos').set(auth(tokenA));
    expect(todosList.status).toBe(200);
    expect(Array.isArray(todosList.body?.data)).toBe(true);

    const todosStats = await request(app).get('/api/todos/stats').set(auth(tokenA));
    expect(todosStats.status).toBe(200);
    expect(typeof todosStats.body?.data?.total).toBe('number');

    const todosToday = await request(app).get('/api/todos/today').set(auth(tokenA));
    expect(todosToday.status).toBe(200);
    expect(Array.isArray(todosToday.body?.data)).toBe(true);

    const todosOverdue = await request(app).get('/api/todos/overdue').set(auth(tokenA));
    expect(todosOverdue.status).toBe(200);
    expect(Array.isArray(todosOverdue.body?.data)).toBe(true);

    // 创建 2 条提醒：今日和未来（提醒不允许过去 scheduledAt）
    const mkReminder = async (payload) => {
      const r = await request(app)
        .post(`/api/pets/${pet.id}/reminders`)
        .set(auth(tokenA))
        .set('Content-Type', 'application/json')
        .send(payload);
      expect(r.status).toBe(201);
      return r.body.data.id;
    };

    const reminderTodayId = await mkReminder({
      title: `今日提醒_${now}`,
      description: '梳毛',
      priority: 'medium',
      scheduledAt: new Date(now + 20 * 60 * 1000).toISOString(),
      dueAt: new Date(now + 60 * 60 * 1000).toISOString(),
    });
    const reminderFutureId = await mkReminder({
      title: `未来提醒_${now}`,
      scheduledAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
    reminderIds.push(reminderTodayId, reminderFutureId);

    const remindersToday = await request(app).get('/api/reminders/today').set(auth(tokenA));
    expect(remindersToday.status).toBe(200);
    expect(Array.isArray(remindersToday.body?.data)).toBe(true);

    const remindersStats = await request(app).get('/api/reminders/stats').set(auth(tokenA));
    expect(remindersStats.status).toBe(200);
    expect(typeof remindersStats.body?.data?.total).toBe('number');

    // 日历聚合：整体、今日、本周、逾期、统计
    const calAll = await request(app).get('/api/calendar').set(auth(tokenA));
    expect(calAll.status).toBe(200);
    expect(Array.isArray(calAll.body?.data)).toBe(true);

    const calToday = await request(app).get('/api/calendar/today').set(auth(tokenA));
    expect(calToday.status).toBe(200);
    expect(Array.isArray(calToday.body?.data)).toBe(true);

    const calWeek = await request(app).get('/api/calendar/week').set(auth(tokenA));
    expect(calWeek.status).toBe(200);
    expect(Array.isArray(calWeek.body?.data)).toBe(true);

    const calOverdue = await request(app).get('/api/calendar/overdue').set(auth(tokenA));
    expect(calOverdue.status).toBe(200);
    expect(Array.isArray(calOverdue.body?.data)).toBe(true);

    const calStats = await request(app).get('/api/calendar/stats').set(auth(tokenA));
    expect(calStats.status).toBe(200);
    expect(typeof calStats.body?.data?.total).toBe('number');

    // 将其中一个待办标记 done（流程覆盖）
    const completeOne = await request(app)
      .post(`/api/todos/${todoTodayId}/complete`)
      .set(auth(tokenA));
    expect(completeOne.status).toBe(200);
    expect(completeOne.body?.data?.status).toBe('done');
  });

  // =============================
  // @social 话题 / 帖子 / 评论 / 点赞 / 举报
  // =============================
  it('@social: 话题/帖子/评论/点赞/举报 基本流转', async () => {
    // 创建话题（A）
    const topicRes = await request(app)
      .post('/api/topics')
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ name: `话题-${Date.now()}`, description: '宠物日常', isOfficial: false });
    expect(topicRes.status).toBe(201);
    topicId = topicRes.body?.data?.id;

    // 列表/搜索/详情（slug 依赖 service 内生成逻辑，验证不为空即可）
    const topicList = await request(app).get('/api/topics');
    expect(topicList.status).toBe(200);
    const topicGet = await request(app).get(`/api/topics/${topicId}`);
    expect(topicGet.status).toBe(200);

    // 创建帖子（A）
    const postRes = await request(app)
      .post('/api/posts')
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ title: '晒猫', text: '今天晒猫啦', visibility: 'public', topics: [topicId] });
    expect(postRes.status).toBe(201);
    postId = postRes.body?.data?.id;

    // 公共列表/详情可见
    const postsList = await request(app).get('/api/posts');
    expect(postsList.status).toBe(200);
    const postGet = await request(app).get(`/api/posts/${postId}`);
    expect(postGet.status).toBe(200);

    // B 评论 A 的帖子
    const commentRes = await request(app)
      .post('/api/comments')
      .set(auth(tokenB))
      .set('Content-Type', 'application/json')
      .send({ postId, text: '好可爱！' });
    expect(commentRes.status).toBe(201);
    commentId = commentRes.body?.data?.id;

    // 获取帖子的评论列表
    const postComments = await request(app).get(`/api/posts/${postId}/comments`);
    expect(postComments.status).toBe(200);
    expect(Array.isArray(postComments.body?.data)).toBe(true);

    // A/B 分别对帖子/评论点赞与取消
    const likePost = await request(app)
      .post(`/api/posts/${postId}/reactions`)
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ type: 'like' });
    expect(likePost.status).toBe(201);

    const likeComment = await request(app)
      .post(`/api/comments/${commentId}/reactions`)
      .set(auth(tokenB))
      .set('Content-Type', 'application/json')
      .send({ type: 'like' });
    expect(likeComment.status).toBe(201);

    const postReactions = await request(app).get(`/api/posts/${postId}/reactions`);
    expect(postReactions.status).toBe(200);

    const commentReactions = await request(app).get(`/api/comments/${commentId}/reactions`);
    expect(commentReactions.status).toBe(200);

    const removePostLike = await request(app)
      .delete(`/api/posts/${postId}/reactions`)
      .set(auth(tokenA));
    expect(removePostLike.status).toBe(200);

    const removeCommentLike = await request(app)
      .delete(`/api/comments/${commentId}/reactions`)
      .set(auth(tokenB));
    expect(removeCommentLike.status).toBe(200);

    // 举报（以 A 举报 B 的评论为例）
    const reportComment = await request(app)
      .post('/api/reports/comments')
      .set(auth(tokenA))
      .set('Content-Type', 'application/json')
      .send({ commentId, reasonCode: 'abuse', reasonText: '不文明用语' });
    expect(reportComment.status).toBe(201);

    // 管理列表（当前实现未强制 admin 身份，验证接口契约即可）
    const commentReports = await request(app)
      .get('/api/reports/comments')
      .set(auth(tokenA));
    expect(commentReports.status).toBe(200);
    expect(Array.isArray(commentReports.body?.data)).toBe(true);
  });
});


