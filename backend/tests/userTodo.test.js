import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet } from './helpers/testUtils.js';

describe('User Todo API 集成测试', () => {
  let token;
  let otherToken;
  let pet;
  let todoId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 70);
    token = auth.token;
    const other = await registerAndGetToken(app, 71);
    otherToken = other.token;
    pet = await createTestPet(app, token, { name: '小白-待办' });
  });

  it('创建待办 - 基础功能', async () => {
    const now = Date.now();
    const payload = {
      petId: pet.id,
      title: `测试待办_${now}`,
      description: '带宠物去体检',
      priority: 'high',
      scheduledAt: new Date(now + 60 * 60 * 1000).toISOString(),
      dueAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      tags: ['health'],
    };

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    expect(res.body?.data?.title).toBe(payload.title);
    expect(res.body?.data?.priority).toBe('high');
    expect(res.body?.data?.pet?.id).toBe(pet.id);
    todoId = res.body.data.id;
  });

  it('获取待办详情', async () => {
    const res = await request(app)
      .get(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(todoId);
  });

  it('获取当前用户的待办列表', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(typeof res.body?.total).toBe('number');
  });

  it('更新待办（状态置为 done 应自动设置 completedAt）', async () => {
    const res = await request(app)
      .patch(`/api/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: '更新后的标题', status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.title).toBe('更新后的标题');
    expect(res.body?.data?.status).toBe('done');
    expect(res.body?.data?.completedAt).toBeTruthy();
    expect(res.body?.data?.pet?.id).toBe(pet.id);
  });

  it('完成待办（单条）', async () => {
    const resCreate = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: `待办-完成_${Date.now()}`, priority: 'medium' });
    const id = resCreate.body.data.id;

    const res = await request(app)
      .post(`/api/todos/${id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('done');
  });

  it('归档待办（单条）', async () => {
    const resCreate = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: `待办-归档_${Date.now()}`, priority: 'low' });
    const id = resCreate.body.data.id;

    const res = await request(app)
      .post(`/api/todos/${id}/archive`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('archived');
  });

  it('批量完成/归档待办', async () => {
    const mk = async (title) => {
      const r = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({ title });
      return r.body.data.id;
    };
    const id1 = await mk('批量-1');
    const id2 = await mk('批量-2');

    const completeRes = await request(app)
      .post('/api/todos/batch/complete')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ ids: [id1, id2] });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body?.success).toBe(true);
    expect(typeof completeRes.body?.data?.count).toBe('number');

    const id3 = await mk('批量-3');
    const id4 = await mk('批量-4');
    const archiveRes = await request(app)
      .post('/api/todos/batch/archive')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ ids: [id3, id4] });
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body?.success).toBe(true);
    expect(typeof archiveRes.body?.data?.count).toBe('number');
  });

  it('获取今日/逾期/统计 端点（基本可用）', async () => {
    const now = Date.now();
    // 今日
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: '今天内的待办', scheduledAt: new Date(now + 30 * 60 * 1000).toISOString() });

    // 逾期
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: '已逾期待办', dueAt: new Date(now - 60 * 60 * 1000).toISOString() });

    const today = await request(app)
      .get('/api/todos/today')
      .set('Authorization', `Bearer ${token}`);
    expect(today.status).toBe(200);
    expect(today.body?.success).toBe(true);
    expect(Array.isArray(today.body?.data)).toBe(true);

    const overdue = await request(app)
      .get('/api/todos/overdue')
      .set('Authorization', `Bearer ${token}`);
    expect(overdue.status).toBe(200);
    expect(overdue.body?.success).toBe(true);
    expect(Array.isArray(overdue.body?.data)).toBe(true);

    const stats = await request(app)
      .get('/api/todos/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(200);
    expect(stats.body?.success).toBe(true);
    expect(typeof stats.body?.data?.total).toBe('number');
    expect(typeof stats.body?.data?.pending).toBe('number');
    expect(typeof stats.body?.data?.done).toBe('number');
    expect(typeof stats.body?.data?.archived).toBe('number');
    expect(typeof stats.body?.data?.overdue).toBe('number');
  });

  it('删除待办并验证不可访问', async () => {
    const create = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: `待删除_${Date.now()}` });
    const id = create.body.data.id;

    const delRes = await request(app)
      .delete(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body?.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('输入校验：缺少 title 返回 400', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(400);
  });

  it('权限控制：其他用户不能修改待办', async () => {
    const create = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: `待权限测试_${Date.now()}` });
    const id = create.body.data.id;

    const res = await request(app)
      .patch(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .set('Content-Type', 'application/json')
      .send({ title: '非法修改' });
    expect([403, 404]).toContain(res.status);
  });

  it('未认证访问受限端点返回 401', async () => {
    const res = await request(app)
      .get('/api/todos');
    expect(res.status).toBe(401);
  });
});


