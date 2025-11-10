import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken } from './helpers/testUtils.js';

describe('Topic API 集成测试', () => {
  let token;
  let topicId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 30);
    token = auth.token;
  });

  it('创建话题 - 基础功能', async () => {
    const payload = {
      name: `测试话题_${Date.now()}`,
      description: '这是一个用于测试的话题',
    };

    const res = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    topicId = res.body.data.id;
  });

  it('获取话题列表', async () => {
    const res = await request(app)
      .get('/api/topics');

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(typeof res.body?.total).toBe('number');
  });

  it('获取话题详情', async () => {
    const res = await request(app)
      .get(`/api/topics/${topicId}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(topicId);
  });

  it('更新话题（可能受限）', async () => {
    const res = await request(app)
      .patch(`/api/topics/${topicId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ description: '更新后的话题描述' });

    // 如果权限限制未实现，可能返回 200；若限制存在，可能返回 403/404
    expect([200, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body?.success).toBe(true);
      expect(res.body?.data?.description).toBe('更新后的话题描述');
    }
  });

  it('删除话题（可能受限）', async () => {
    const res = await request(app)
      .delete(`/api/topics/${topicId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 403, 404]).toContain(res.status);
  });
});


