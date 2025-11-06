import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet } from './helpers/testUtils.js';

describe('Weight API 集成测试', () => {
  let token;
  let pet;
  let weightId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 20);
    token = auth.token;
    pet = await createTestPet(app, token, { name: '小白-体重' });
  });

  it('创建体重记录 - 基础功能', async () => {
    const payload = {
      measuredAt: new Date().toISOString(),
      weightKg: 4.55,
      source: 'home_scale',
      note: '晨起称重',
    };

    const res = await request(app)
      .post(`/api/pets/${pet.id}/weights`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    expect(res.body?.data?.petId).toBe(pet.id);
    weightId = res.body.data.id;
  });

  it('获取宠物的体重记录列表', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/weights`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('获取体重记录详情', async () => {
    const res = await request(app)
      .get(`/api/weights/${weightId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(weightId);
  });

  it('更新体重记录', async () => {
    const res = await request(app)
      .patch(`/api/weights/${weightId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ weightKg: 4.75, note: '饭后复测' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Number(res.body?.data?.weightKg)).toBe(4.75);
    expect(res.body?.data?.note).toBe('饭后复测');
  });

  it('权限控制：其他用户不能修改体重记录', async () => {
    const other = await registerAndGetToken(app, 21);
    const res = await request(app)
      .patch(`/api/weights/${weightId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .set('Content-Type', 'application/json')
      .send({ weightKg: 9.99 });

    expect([403, 404]).toContain(res.status);
  });

  it('批量创建体重记录', async () => {
    const base = Date.now();
    const batchPayload = {
      weights: [
        { petId: pet.id, measuredAt: new Date(base - 72 * 3600 * 1000).toISOString(), weightKg: 4.6, source: 'home_scale' },
        { petId: pet.id, measuredAt: new Date(base - 48 * 3600 * 1000).toISOString(), weightKg: 4.7, source: 'home_scale' },
        { petId: pet.id, measuredAt: new Date(base - 24 * 3600 * 1000).toISOString(), weightKg: 4.65, source: 'home_scale' },
      ],
    };

    const res = await request(app)
      .post('/api/weights/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(batchPayload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(typeof res.body?.data?.count).toBe('number');
  });

  it('获取最新体重记录 /api/pets/:petId/weights/latest', async () => {
    const t1 = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const t2 = new Date().toISOString();

    await request(app)
      .post(`/api/pets/${pet.id}/weights`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ measuredAt: t1, weightKg: 4.8, source: 'home_scale' });

    await request(app)
      .post(`/api/pets/${pet.id}/weights`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ measuredAt: t2, weightKg: 4.82, source: 'home_scale' });

    const res = await request(app)
      .get(`/api/pets/${pet.id}/weights/latest`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.measuredAt).toBeDefined();
  });

  it('获取体重统计 /api/pets/:petId/weights/stats', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/weights/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data).toBeDefined();
    expect(typeof res.body.data.count).toBe('number');
  });

  it('输入校验：缺少 measuredAt 返回 400', async () => {
    const res = await request(app)
      .post(`/api/pets/${pet.id}/weights`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ weightKg: 4.5 });

    expect(res.status).toBe(400);
  });

  it('输入校验：非法 source 返回 400', async () => {
    const res = await request(app)
      .post(`/api/pets/${pet.id}/weights`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ measuredAt: new Date().toISOString(), weightKg: 4.5, source: 'invalid_src' });

    expect(res.status).toBe(400);
  });

  it('删除体重记录并验证不可访问', async () => {
    const delRes = await request(app)
      .delete(`/api/weights/${weightId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body?.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/weights/${weightId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('未认证访问受限端点返回 401', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/weights`);

    expect(res.status).toBe(401);
  });
});


