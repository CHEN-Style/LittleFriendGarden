import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken } from './helpers/testUtils.js';

describe('Comment API 集成测试', () => {
  let token;
  let postId;
  let commentId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 50);
    token = auth.token;

    // 先创建一个帖子
    const createPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: `评论模块帖子_${Date.now()}`, text: '评论模块用例帖子' });
    expect(createPost.status).toBe(201);
    postId = createPost.body.data.id;
  });

  it('创建评论 - 基础功能', async () => {
    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ postId, text: '这是一条测试评论' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    commentId = res.body.data.id;
  });

  it('创建回复（嵌套评论）', async () => {
    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ postId, parentCommentId: commentId, text: '这是一条测试回复' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.parentCommentId).toBe(commentId);
  });

  it('获取评论详情', async () => {
    const res = await request(app)
      .get(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(commentId);
  });

  it('获取帖子的评论列表', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body?.total).toBeGreaterThanOrEqual(1);
  });

  it('更新评论', async () => {
    const res = await request(app)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ text: '更新后的评论内容' });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.text).toBe('更新后的评论内容');
  });

  it('删除评论（软删除）并验证不可访问', async () => {
    const delRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body?.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});


