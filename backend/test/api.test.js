// Testes automatizados das rotas principais da API
const request = require('supertest');
const { createApp } = require('../app');

describe('Rotas principais da API', () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it('GET /api/users deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/salas deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/salas');
    expect(res.status).toBe(401);
  });

  it('GET /api/alunos deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/alunos');
    expect(res.status).toBe(401);
  });

  it('GET /api/frequencia deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/frequencia');
    expect(res.status).toBe(401);
  });

  it('GET /api/calendario deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/calendario');
    expect(res.status).toBe(401);
  });
});
