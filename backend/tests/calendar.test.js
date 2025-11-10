import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet } from './helpers/testUtils.js';

describe('Calendar API 集成测试', () => {
  let token;
  let pet;
  let todoIds = [];
  let reminderIds = [];

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 80);
    token = auth.token;
    pet = await createTestPet(app, token, { name: '小白-日历' });

    const now = Date.now();

    // 待办：今日、周内、逾期
    const mkTodo = async (title, scheduledAt, dueAt) => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({ title, scheduledAt, dueAt, priority: 'medium' });
      todoIds.push(res.body.data.id);
      return res.body.data.id;
    };

    await mkTodo('今日-待办', new Date(now + 30 * 60 * 1000).toISOString());
    await mkTodo('周内-待办', new Date(now + 3 * 24 * 3600 * 1000).toISOString());
    await mkTodo('逾期-待办', undefined, new Date(now - 60 * 60 * 1000).toISOString());

    // 提醒：今日、周内、逾期
    const mkReminder = async (title, remindAt) => {
      const res = await request(app)
        .post(`/api/pets/${pet.id}/reminders`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({ reminderType: 'other', title, remindAt });
      reminderIds.push(res.body.data.id);
      return res.body.data.id;
    };

    await mkReminder('今日-提醒', new Date(now + 45 * 60 * 1000).toISOString());
    await mkReminder('周内-提醒', new Date(now + 4 * 24 * 3600 * 1000).toISOString());
    // 逾期提醒：允许通过 PATCH 调整为过去
    const rid = await mkReminder('逾期-提醒', new Date(now + 2 * 60 * 60 * 1000).toISOString());
    await request(app)
      .patch(`/api/reminders/${rid}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ remindAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), status: 'pending' });
  });

  it('获取聚合日历列表（默认聚合两类）', async () => {
    const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const end = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/calendar?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);

    const kinds = new Set(res.body.data.map((x) => x.itemKind));
    expect(kinds.has('user_todo')).toBe(true);
    expect(kinds.has('pet_reminder')).toBe(true);
  });

  it('筛选 itemKind=user_todo 仅返回待办', async () => {
    const res = await request(app)
      .get('/api/calendar?itemKind=user_todo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.every((x) => x.itemKind === 'user_todo')).toBe(true);
  });

  it('筛选 itemKind=pet_reminder 仅返回提醒', async () => {
    const res = await request(app)
      .get('/api/calendar?itemKind=pet_reminder')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.every((x) => x.itemKind === 'pet_reminder')).toBe(true);
  });

  it('今日/本周/逾期 端点（基本可用）', async () => {
    const today = await request(app)
      .get('/api/calendar/today')
      .set('Authorization', `Bearer ${token}`);
    expect(today.status).toBe(200);
    expect(today.body?.success).toBe(true);
    expect(Array.isArray(today.body?.data)).toBe(true);

    const week = await request(app)
      .get('/api/calendar/week')
      .set('Authorization', `Bearer ${token}`);
    expect(week.status).toBe(200);
    expect(week.body?.success).toBe(true);
    expect(Array.isArray(week.body?.data)).toBe(true);

    const overdue = await request(app)
      .get('/api/calendar/overdue')
      .set('Authorization', `Bearer ${token}`);
    expect(overdue.status).toBe(200);
    expect(overdue.body?.success).toBe(true);
    expect(Array.isArray(overdue.body?.data)).toBe(true);
    expect(overdue.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('统计端点返回聚合统计', async () => {
    const res = await request(app)
      .get('/api/calendar/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(typeof res.body?.data?.total).toBe('number');
    expect(typeof res.body?.data?.pending).toBe('number');
    expect(typeof res.body?.data?.done).toBe('number');
    expect(typeof res.body?.data?.archived).toBe('number');
    expect(typeof res.body?.data?.overdue).toBe('number');
    expect(typeof res.body?.data?.byType?.todos).toBe('number');
    expect(typeof res.body?.data?.byType?.reminders).toBe('number');
  });

  it('未认证访问受限端点返回 401', async () => {
    const res = await request(app)
      .get('/api/calendar');
    expect(res.status).toBe(401);
  });
});


