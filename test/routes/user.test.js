const request = require('supertest');
const { expect } = require('expect');
const { faker } = require('@faker-js/faker');
const app = require('../../src/app');
const db = require('../../src/db/models');

const { User } = db;

describe('POST /api/users/signup', () => {
  const validUser = {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'securepass123',
  };

  after(async () => {
    await User.destroy({ where: { email: validUser.email } });
  });

  it('should return 201 and user data without password', async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(validUser.email);
    expect(response.body.username).toBe(validUser.username);
    expect(response.body.password).toBeUndefined();
  });

  it('should store a hashed password, not plaintext', async () => {
    const user = await User.findOne({ where: { email: validUser.email } });
    expect(user.password).not.toBe('securepass123');
    expect(user.password.startsWith('$2b$')).toBe(true);
  });

  it('should return 409 for duplicate email', async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send(validUser);

    expect(response.status).toBe(409);
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/signin', () => {
  const testUser = {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'testpass456',
  };

  before(async () => {
    await request(app)
      .post('/api/users/signup')
      .send(testUser);
  });

  after(async () => {
    await User.destroy({ where: { email: testUser.email } });
  });

  it('should return 200 and user data for valid credentials', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.password).toBeUndefined();
  });

  it('should return 401 for wrong password', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'nobody@example.com', password: 'whatever' });

    expect(response.status).toBe(401);
  });

  it('should return 400 for missing fields', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: testUser.email });

    expect(response.status).toBe(400);
  });
});
