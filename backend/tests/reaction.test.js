import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken } from './helpers/testUtils.js';

describe('Reaction API 集成测试', () => {
  let token;
  let postId;
  let commentId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 60);
    token = auth.token;

    // 创建帖子
    const createPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: `反应模块帖子_${Date.now()}`, text: '用于反应模块测试' });
    expect(createPost.status).toBe(201);
    postId = createPost.body.data.id;

    // 创建一条评论
    const createComment = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ postId, text: '用于反应模块的评论' });
    expect(createComment.status).toBe(201);
    commentId = createComment.body.data.id;
  });

  it('为帖子添加点赞/反应', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ type: 'like' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
  });

  it('获取帖子的点赞列表', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('获取帖子的点赞统计', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}/reactions/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('为评论添加点赞/反应', async () => {
    const res = await request(app)
      .post(`/api/comments/${commentId}/reactions`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ type: 'love' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
  });

  it('获取评论的点赞统计', async () => {
    const res = await request(app)
      .get(`/api/comments/${commentId}/reactions/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('移除帖子点赞/反应（无需指定类型）', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
  });
});


