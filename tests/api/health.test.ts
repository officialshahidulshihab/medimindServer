import request from 'supertest';
import { describe, expect, test } from 'vitest';
import app from '../../src/index';

describe('Health Check API', () => {
  test('GET /health should return 200 and healthy status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Server is healthy'
    });
  });
});
