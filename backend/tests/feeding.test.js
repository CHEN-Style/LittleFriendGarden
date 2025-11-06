import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet } from './helpers/testUtils.js';

describe('Feeding API 集成测试', () => {
  let token;
  let pet;
  let feedingId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 0);
    token = auth.token;
    pet = await createTestPet(app, token, { name: '小白' });
  });

  it('创建喂养记录 - 基础功能', async () => {
    const payload = {
      fedAt: new Date().toISOString(),
      amountG: 100.5,
      caloriesKcal: 45.2,
      note: '早餐',
    };

    const res = await request(app)
      .post(`/api/pets/${pet.id}/feedings`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    feedingId = res.body.data.id;
  });

  it('获取宠物的喂养记录列表', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/feedings`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('获取喂养记录详情', async () => {
    const res = await request(app)
      .get(`/api/feedings/${feedingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(feedingId);
  });

  it('更新喂养记录', async () => {
    const res = await request(app)
      .patch(`/api/feedings/${feedingId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ amountG: 120.0, note: '加餐' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Number(res.body?.data?.amountG)).toBe(120.0);
    expect(res.body?.data?.note).toBe('加餐');
  });

  it('权限控制：其他用户不能修改喂养记录', async () => {
    const other = await registerAndGetToken(app, 1);
    const res = await request(app)
      .patch(`/api/feedings/${feedingId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .set('Content-Type', 'application/json')
      .send({ amountG: 200 });

    expect([403, 404]).toContain(res.status); // 以防实现返回隐藏资源
  });

  it('删除喂养记录并验证不可访问', async () => {
    const delRes = await request(app)
      .delete(`/api/feedings/${feedingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body?.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/feedings/${feedingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('批量创建喂养记录', async () => {
    const baseTime = Date.now();
    const payload = {
      feedings: [
        { petId: pet.id, fedAt: new Date(baseTime - 6 * 3600 * 1000).toISOString(), amountG: 80 },
        { petId: pet.id, fedAt: new Date(baseTime - 3 * 3600 * 1000).toISOString(), amountG: 90 },
        { petId: pet.id, fedAt: new Date(baseTime).toISOString(), amountG: 110 },
      ],
    };

    const res = await request(app)
      .post('/api/feedings/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(typeof res.body?.data?.count).toBe('number');
  });

  it('获取当前用户的喂养记录列表 /api/feedings/my', async () => {
    const res = await request(app)
      .get('/api/feedings/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('输入校验：缺少 fedAt 返回 400', async () => {
    const res = await request(app)
      .post(`/api/pets/${pet.id}/feedings`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ amountG: 50 });

    expect(res.status).toBe(400);
  });

  it('未认证访问受限端点返回 401', async () => {
    const res = await request(app)
      .get('/api/feedings/my');

    expect(res.status).toBe(401);
  });
});


