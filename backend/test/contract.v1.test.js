import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.USE_IN_MEMORY_DB = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-with-32-characters-000';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-with-32-chars-00';
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const { createApp } = await import('../server.js');

const app = createApp();

function assertApiEnvelope(body) {
  assert.equal(typeof body, 'object');
  assert.equal(typeof body.success, 'boolean');
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'data'));
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'message'));
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'errors'));
}

test('API v1 contract: docs, auth, envelope, status codes, validation and rate limit', async () => {
  const docsResponse = await request(app).get('/api/v1/docs/');
  assert.equal(docsResponse.status, 200);
  assert.match(String(docsResponse.text || ''), /swagger-ui/i);

  const invalidLogin = await request(app)
    .post('/api/v1/auth/login')
    .set('Content-Type', 'application/json')
    .send({ usuario: '' });

  assert.equal(invalidLogin.status, 422);
  assertApiEnvelope(invalidLogin.body);
  assert.equal(invalidLogin.body.success, false);
  assert.ok(Array.isArray(invalidLogin.body.errors));
  assert.ok(invalidLogin.body.errors.length > 0);

  const uniqueUser = `user_${Date.now()}`;

  const register = await request(app)
    .post('/api/v1/auth/register')
    .set('Content-Type', 'application/json')
    .send({
      nome: 'Usuario Contrato',
      usuario: uniqueUser,
      senha: 'Senha@12345',
    });

  assert.equal(register.status, 201);
  assertApiEnvelope(register.body);
  assert.equal(register.body.success, true);

  const login = await request(app)
    .post('/api/v1/auth/login')
    .set('Content-Type', 'application/json')
    .send({
      usuario: uniqueUser,
      senha: 'Senha@12345',
    });

  assert.equal(login.status, 200);
  assertApiEnvelope(login.body);
  assert.equal(login.body.success, true);
  assert.equal(typeof login.body.data?.token, 'string');
  assert.equal(typeof login.body.data?.refreshToken, 'string');

  const token = login.body.data.token;

  const listWithoutToken = await request(app).get('/api/v1/salas');
  assert.equal(listWithoutToken.status, 401);
  assertApiEnvelope(listWithoutToken.body);
  assert.equal(listWithoutToken.body.success, false);

  const invalidSort = await request(app)
    .get('/api/v1/salas?sortBy=invalido')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(invalidSort.status, 422);
  assertApiEnvelope(invalidSort.body);
  assert.equal(invalidSort.body.success, false);

  const createSala = await request(app)
    .post('/api/v1/salas')
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send({ nome: 'Sala Contrato', turno: 'Manha' });

  assert.equal(createSala.status, 201);
  assertApiEnvelope(createSala.body);
  assert.equal(createSala.body.success, true);
  assert.equal(typeof createSala.body.data?.salaId, 'number');

  const salaId = createSala.body.data.salaId;

  const listSalas = await request(app)
    .get('/api/v1/salas?page=1&limit=20&sortBy=nome&order=asc')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listSalas.status, 200);
  assertApiEnvelope(listSalas.body);
  assert.equal(Array.isArray(listSalas.body.data?.items), true);
  assert.equal(typeof listSalas.body.data?.meta, 'object');

  const deleteSala = await request(app)
    .delete(`/api/v1/salas/${salaId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(deleteSala.status, 204);
  assert.equal(deleteSala.text, '');

  let gotRateLimited = false;
  for (let i = 0; i < 20; i += 1) {
    const attempt = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ usuario: 'nao-existe', senha: 'senha-invalida' });

    if (attempt.status === 429) {
      gotRateLimited = true;
      assert.equal(attempt.body.success, false);
      assert.equal(Array.isArray(attempt.body.errors), true);
      break;
    }
  }

  assert.equal(gotRateLimited, true);
});
