require('dotenv').config();
const request = require('supertest');
const { expect } = require('expect');
const { faker } = require('@faker-js/faker');
const app = require('../../src/app');

describe('GET /api/items', () => {
  it('should return 200 and an array', async () => {
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /api/items', () => {
  it('should create an item with valid data', async () => {
    const newItem = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
    };

    const response = await request(app)
      .post('/api/items')
      .send(newItem);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(newItem.name);
  });

  it('should return 400 with invalid data', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({});

    expect(response.status).toBe(400);
  });
});
