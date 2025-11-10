import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken } from './helpers/testUtils.js';

describe('Report API 集成测试', () => {
  let authorToken;
  let reporterToken;
  let postId;
  let commentId;
  let postReportId;
  let commentReportId;

  beforeAll(async () => {
    const author = await registerAndGetToken(app, 101);
    const reporter = await registerAndGetToken(app, 102);
    authorToken = author.token;
    reporterToken = reporter.token;

    // 作者创建帖子
    const createPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .set('Content-Type', 'application/json')
      .send({ title: `举报功能帖子_${Date.now()}`, text: '用于举报模块测试' });
    expect(createPost.status).toBe(201);
    postId = createPost.body.data.id;

    // 作者在帖子下创建评论
    const createComment = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${authorToken}`)
      .set('Content-Type', 'application/json')
      .send({ postId, text: '用于举报模块的评论' });
    expect(createComment.status).toBe(201);
    commentId = createComment.body.data.id;
  });

  it('创建帖子举报 - 成功', async () => {
    const res = await request(app)
      .post('/api/reports/posts')
      .set('Authorization', `Bearer ${reporterToken}`)
      .set('Content-Type', 'application/json')
      .send({ postId, reasonCode: 'spam', reasonText: '疑似广告' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    postReportId = res.body.data.id;
  });

  it('创建评论举报 - 成功', async () => {
    const res = await request(app)
      .post('/api/reports/comments')
      .set('Authorization', `Bearer ${reporterToken}`)
      .set('Content-Type', 'application/json')
      .send({ commentId, reasonCode: 'abuse', reasonText: '包含侮辱性内容' });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    commentReportId = res.body.data.id;
  });

  it('获取帖子举报详情', async () => {
    const res = await request(app)
      .get(`/api/reports/posts/${postReportId}`)
      .set('Authorization', `Bearer ${reporterToken}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(postReportId);
  });

  it('获取评论举报详情', async () => {
    const res = await request(app)
      .get(`/api/reports/comments/${commentReportId}`)
      .set('Authorization', `Bearer ${reporterToken}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(commentReportId);
  });

  it('不能举报自己的帖子（应返回 400）', async () => {
    const res = await request(app)
      .post('/api/reports/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .set('Content-Type', 'application/json')
      .send({ postId, reasonCode: 'harassment' });

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
    expect((res.body?.error?.message || '').toLowerCase()).toContain('cannot report your own');
  });

  it('不能举报自己的评论（应返回 400）', async () => {
    const res = await request(app)
      .post('/api/reports/comments')
      .set('Authorization', `Bearer ${authorToken}`)
      .set('Content-Type', 'application/json')
      .send({ commentId, reasonCode: 'inappropriate' });

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
    expect((res.body?.error?.message || '').toLowerCase()).toContain('cannot report your own');
  });
});


