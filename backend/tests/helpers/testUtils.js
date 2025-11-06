import request from 'supertest';

export async function registerAndGetToken(app, index = 0) {
  const ts = Date.now();
  const email = `test_feeding_${index}_${ts}@example.com`;
  const username = `test_feeding_${index}_${ts}`;
  const password = 'TestPassword123!';

  const res = await request(app)
    .post('/api/auth/register')
    .set('Content-Type', 'application/json')
    .send({ email, username, password });

  if (res.status !== 201 || !res.body?.data?.tokens?.accessToken) {
    throw new Error(`Failed to register test user: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    userId: res.body.data.user.id,
    token: res.body.data.tokens.accessToken,
    email,
    username,
  };
}

export async function createTestPet(app, token, overrides = {}) {
  const payload = {
    name: overrides.name || `小白_${Date.now()}`,
    species: overrides.species || 'cat',
    ...(overrides.breed !== undefined ? { breed: overrides.breed } : {}),
    ...(overrides.sex !== undefined ? { sex: overrides.sex } : {}),
    ...(overrides.birthDate !== undefined ? { birthDate: overrides.birthDate } : {}),
    ...(overrides.color !== undefined ? { color: overrides.color } : {}),
    ...(overrides.settings !== undefined ? { settings: overrides.settings } : {}),
  };

  const res = await request(app)
    .post('/api/pets')
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send(payload);

  if (res.status !== 201 || !res.body?.data?.id) {
    throw new Error(`Failed to create pet: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}


