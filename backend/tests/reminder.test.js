import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet } from './helpers/testUtils.js';

describe('Reminder API 集成测试', () => {
  let token;
  let pet;
  let reminderId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 20);
    token = auth.token;
    pet = await createTestPet(app, token, { name: '小白-提醒' });
  });

  it('创建提醒 - 基础功能', async () => {
    const payload = {
      reminderType: 'vaccine',
      remindAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 小时后
      title: '疫苗提醒',
      description: '狂犬疫苗第二针',
    };

    const res = await request(app)
      .post(`/api/pets/${pet.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    expect(res.body?.data?.status).toBe('pending');
    reminderId = res.body.data.id;
  });

  it('获取宠物的提醒列表', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/reminders`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('获取提醒详情', async () => {
    const res = await request(app)
      .get(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(reminderId);
  });

  it('更新提醒', async () => {
    const res = await request(app)
      .patch(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: '疫苗提醒-已更新', description: '更详细的说明' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.title).toBe('疫苗提醒-已更新');
    expect(res.body?.data?.description).toBe('更详细的说明');
  });

  it('权限控制：其他用户不能修改提醒', async () => {
    const other = await registerAndGetToken(app, 21);
    const res = await request(app)
      .patch(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .set('Content-Type', 'application/json')
      .send({ title: '非法修改' });

    expect([403, 404]).toContain(res.status);
  });

  it('完成提醒（单条）', async () => {
    const res = await request(app)
      .post(`/api/reminders/${reminderId}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('completed');
  });

  it('忽略提醒（单条）', async () => {
    // 先新建一条新的 pending 提醒
    const payload = {
      reminderType: 'checkup',
      remindAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      title: '体检提醒',
    };
    const create = await request(app)
      .post(`/api/pets/${pet.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);
    const rid = create.body.data.id;

    const res = await request(app)
      .post(`/api/reminders/${rid}/dismiss`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('dismissed');
  });

  it('批量创建提醒', async () => {
    const base = Date.now();
    const payload = {
      reminders: [
        { petId: pet.id, reminderType: 'feeding', remindAt: new Date(base + 3 * 3600 * 1000).toISOString(), title: '喂粮' },
        { petId: pet.id, reminderType: 'exercise', remindAt: new Date(base + 4 * 3600 * 1000).toISOString(), title: '运动' },
        { petId: pet.id, reminderType: 'grooming', remindAt: new Date(base + 5 * 3600 * 1000).toISOString(), title: '梳毛' },
      ],
    };

    const res = await request(app)
      .post('/api/reminders/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(typeof res.body?.data?.count).toBe('number');
    expect(res.body.data.count).toBeGreaterThanOrEqual(3);
  });

  it('批量完成/忽略提醒', async () => {
    // 再新建两条，随后批量完成
    const mk = async (title) => {
      const r = await request(app)
        .post(`/api/pets/${pet.id}/reminders`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({ reminderType: 'other', remindAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(), title });
      return r.body.data.id;
    };
    const id1 = await mk('批量1');
    const id2 = await mk('批量2');

    const completeRes = await request(app)
      .post('/api/reminders/batch/complete')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ ids: [id1, id2] });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body?.success).toBe(true);
    expect(typeof completeRes.body?.data?.count).toBe('number');
    expect(completeRes.body.data.count).toBeGreaterThanOrEqual(2);

    const id3 = await mk('批量3');
    const id4 = await mk('批量4');

    const dismissRes = await request(app)
      .post('/api/reminders/batch/dismiss')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ ids: [id3, id4] });

    expect(dismissRes.status).toBe(200);
    expect(dismissRes.body?.success).toBe(true);
    expect(typeof dismissRes.body?.data?.count).toBe('number');
    expect(dismissRes.body.data.count).toBeGreaterThanOrEqual(2);
  });

  it('获取当前用户的提醒列表 /api/reminders/my', async () => {
    const res = await request(app)
      .get('/api/reminders/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('获取 Pending/Today/Overdue/Stats 端点（基本可用）', async () => {
    // today: 创建一条今天内的提醒
    await request(app)
      .post(`/api/pets/${pet.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ reminderType: 'feeding', remindAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), title: '今天之内' });

    // 将先前的 reminderId 更新为过去时间以测试 overdue（允许通过 PATCH 设置过去时间）
    await request(app)
      .patch(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ remindAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), status: 'pending' });

    const pending = await request(app)
      .get('/api/reminders/pending?hoursAhead=48')
      .set('Authorization', `Bearer ${token}`);
    expect(pending.status).toBe(200);
    expect(pending.body?.success).toBe(true);
    expect(Array.isArray(pending.body?.data)).toBe(true);

    const today = await request(app)
      .get('/api/reminders/today')
      .set('Authorization', `Bearer ${token}`);
    expect(today.status).toBe(200);
    expect(today.body?.success).toBe(true);
    expect(Array.isArray(today.body?.data)).toBe(true);

    const overdue = await request(app)
      .get('/api/reminders/overdue')
      .set('Authorization', `Bearer ${token}`);
    expect(overdue.status).toBe(200);
    expect(overdue.body?.success).toBe(true);
    expect(Array.isArray(overdue.body?.data)).toBe(true);

    const stats = await request(app)
      .get('/api/reminders/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(200);
    expect(stats.body?.success).toBe(true);
    expect(typeof stats.body?.data?.total).toBe('number');
  });

  it('删除提醒并验证不可访问', async () => {
    const delRes = await request(app)
      .delete(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body?.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('输入校验：缺少 remindAt 返回 400', async () => {
    const res = await request(app)
      .post(`/api/pets/${pet.id}/reminders`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ reminderType: 'feeding', title: '无日期' });

    expect(res.status).toBe(400);
  });

  it('未认证访问受限端点返回 401', async () => {
    const res = await request(app)
      .get('/api/reminders/my');

    expect(res.status).toBe(401);
  });
});


