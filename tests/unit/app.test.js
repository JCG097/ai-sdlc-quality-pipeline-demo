const request = require('supertest');
const { crearApp } = require('../../app/src/app');

describe('Base de la API', () => {
  let app;

  beforeEach(() => {
    app = crearApp();
  });

  test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ estado: 'ok' });
  });

  test('no revela la tecnología del servidor', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('sirve la página principal', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('data-testid="titulo-app"');
  });

  test('responde 400 si el cuerpo no es JSON válido', async () => {
    const res = await request(app).post('/health').set('Content-Type', 'application/json').send('{mal');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch('JSON válido');
  });
});
