import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken } from './helpers/testUtils.js';

describe('Post API 集成测试', () => {
  let token;
  let postId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 40);
    token = auth.token;
  });

  it('创建帖子 - 基础功能', async () => {
    const payload = {
      title: `测试帖子_${Date.now()}`,
      text: '这是一个测试帖子的内容。',
      visibility: 'public',
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    postId = res.body.data.id;
  });

  it('获取帖子列表（公共）', async () => {
    const res = await request(app)
      .get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('获取帖子详情', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(postId);
  });

  it('更新帖子', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ text: '更新后的帖子内容', visibility: 'friends' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.text).toBe('更新后的帖子内容');
    expect(res.body?.data?.visibility).toBe('friends');
  });

  it('获取帖子的评论列表（应为空数组）', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('删除帖子（软删除）', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });
});


