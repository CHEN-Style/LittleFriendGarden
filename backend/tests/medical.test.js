import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndGetToken, createTestPet } from './helpers/testUtils.js';

describe('Medical API 集成测试', () => {
  let token;
  let pet;
  let medicalId;

  beforeAll(async () => {
    const auth = await registerAndGetToken(app, 10);
    token = auth.token;
    pet = await createTestPet(app, token, { name: '小白-医疗' });
  });

  it('创建医疗记录 - 基础功能', async () => {
    const payload = {
      recordType: 'vaccine',
      recordedAt: new Date().toISOString(),
      title: '狂犬疫苗接种',
      description: '第一针',
      vaccineName: 'Rabies',
      veterinarianName: '张医生',
      clinicName: '宠物医院',
      costAmount: 150,
      costCurrency: 'CNY',
    };

    const res = await request(app)
      .post(`/api/pets/${pet.id}/medicals`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBeDefined();
    expect(res.body?.data?.petId).toBe(pet.id);
    medicalId = res.body.data.id;
  });

  it('获取宠物的医疗记录列表', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/medicals`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('获取医疗记录详情', async () => {
    const res = await request(app)
      .get(`/api/medicals/${medicalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.id).toBe(medicalId);
  });

  it('更新医疗记录', async () => {
    const res = await request(app)
      .patch(`/api/medicals/${medicalId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ description: '已完成体检', costAmount: 200 });

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.description).toBe('已完成体检');
    expect(Number(res.body?.data?.costAmount)).toBe(200);
  });

  it('权限控制：其他用户不能修改医疗记录', async () => {
    const other = await registerAndGetToken(app, 11);
    const res = await request(app)
      .patch(`/api/medicals/${medicalId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .set('Content-Type', 'application/json')
      .send({ cost: 500 });

    expect([403, 404]).toContain(res.status);
  });

  it('删除医疗记录并验证不可访问', async () => {
    const delRes = await request(app)
      .delete(`/api/medicals/${medicalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body?.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/medicals/${medicalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('批量导入医疗记录', async () => {
    const batchPayload = {
      medicals: [
        { petId: pet.id, recordType: 'vaccine', title: '狂犬疫苗第一针', recordedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), vaccineName: 'Rabies', veterinarianName: '张医生', clinicName: '宠物医院' },
        { petId: pet.id, recordType: 'vaccine', title: '狂犬疫苗第二针', recordedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), vaccineName: 'Rabies', veterinarianName: '张医生', clinicName: '宠物医院' },
        { petId: pet.id, recordType: 'checkup', title: '年度体检', recordedAt: new Date().toISOString(), veterinarianName: '李医生', clinicName: '宠物医院' },
      ],
    };

    const res = await request(app)
      .post('/api/medicals/batch')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(batchPayload);

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(typeof res.body?.data?.count).toBe('number');
    expect(res.body.data.count).toBeGreaterThanOrEqual(3);
  });

  it('获取医疗统计分析', async () => {
    const res = await request(app)
      .get(`/api/pets/${pet.id}/medicals/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('医疗类型枚举验证 - 常见类型均可创建', async () => {
    const medicalTypes = ['vaccine', 'medication', 'checkup', 'surgery', 'diagnosis', 'other'];
    for (const recordType of medicalTypes) {
      const basePayload = {
        recordType,
        recordedAt: new Date().toISOString(),
        title: `测试${recordType}`,
        veterinarianName: '测试医生',
        clinicName: '测试医院',
      };
      const payload = recordType === 'vaccine' ? { ...basePayload, vaccineName: 'Rabies' } : basePayload;

      const res = await request(app)
        .post(`/api/pets/${pet.id}/medicals`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send(payload);
      expect(res.status).toBe(201);
      expect(res.body?.success).toBe(true);
    }
  });

  it('输入校验：缺少 recordedAt 返回 400', async () => {
    const res = await request(app)
      .post(`/api/pets/${pet.id}/medicals`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ recordType: 'checkup', title: '无日期' });

    expect(res.status).toBe(400);
  });
});


