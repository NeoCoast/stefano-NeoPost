require('dotenv').config();
const request = require('supertest');
const { expect } = require('expect');
const { faker } = require('@faker-js/faker');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const prisma = require('../../src/db/prisma');

describe('POST /api/users/signup', () => {
  const validUser = {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'securepass123',
  };
  let signupResponse;

  before(async function () {
    this.timeout(10000);
    signupResponse = await request(app)
      .post('/api/users/signup')
      .send(validUser);
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: validUser.email } });
  });

  it('should return 201 and a confirmation message', () => {
    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body.message).toBeDefined();
  });

  it('should store user with confirmed: false', async () => {
    const user = await prisma.user.findUnique({ where: { email: validUser.email } });
    expect(user.confirmed).toBe(false);
  });

  it('should store a hashed password, not plaintext', async () => {
    const user = await prisma.user.findUnique({ where: { email: validUser.email } });
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

describe('GET /api/users/confirm', () => {
  let confirmUser;

  before(async function () {
    this.timeout(10000);
    await request(app)
      .post('/api/users/signup')
      .send({
        email: faker.internet.email(),
        username: faker.internet.username(),
        password: 'confirmpass123',
      });
    confirmUser = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
  });

  after(async () => {
    if (confirmUser) await prisma.user.delete({ where: { id: confirmUser.id } });
  });

  it('should confirm user with valid token', async () => {
    const token = jwt.sign(
      { userId: Number(confirmUser.id) },
      process.env.JWT_SECRET,
      { audience: 'email-confirmation', expiresIn: '24h' },
    );

    const response = await request(app)
      .get(`/api/users/confirm?token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();

    confirmUser = await prisma.user.findUnique({ where: { id: confirmUser.id } });
    expect(confirmUser.confirmed).toBe(true);
  });

  it('should return 400 for invalid token', async () => {
    const response = await request(app)
      .get('/api/users/confirm?token=invalid-token');

    expect(response.status).toBe(400);
  });

  it('should return 400 for auth token used as confirmation', async () => {
    const authToken = jwt.sign(
      { userId: Number(confirmUser.id) },
      process.env.JWT_SECRET,
      { audience: 'api', expiresIn: '24h' },
    );

    const response = await request(app)
      .get(`/api/users/confirm?token=${authToken}`);

    expect(response.status).toBe(400);
  });

  it('should return 400 when no token provided', async () => {
    const response = await request(app)
      .get('/api/users/confirm');

    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/signin', () => {
  const testUser = {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'testpass456',
  };

  before(async function () {
    this.timeout(10000);
    await request(app)
      .post('/api/users/signup')
      .send(testUser);

    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    await prisma.user.update({ where: { id: user.id }, data: { confirmed: true } });
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  it('should return 200 and a JWT token for valid confirmed user', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.password).toBeUndefined();
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

  it('should return 403 for unconfirmed user', async function () {
    this.timeout(10000);
    const unconfirmedUser = {
      email: faker.internet.email(),
      username: faker.internet.username(),
      password: 'unconfirmed123',
    };
    await request(app)
      .post('/api/users/signup')
      .send(unconfirmedUser);

    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: unconfirmedUser.email, password: unconfirmedUser.password });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/confirm/i);

    await prisma.user.deleteMany({ where: { email: unconfirmedUser.email } });
  });
});

describe('GET /api/users/me', () => {
  let authToken;
  const meUser = {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'mepass789',
  };

  before(async function () {
    this.timeout(10000);
    await request(app)
      .post('/api/users/signup')
      .send(meUser);

    const user = await prisma.user.findUnique({ where: { email: meUser.email } });
    await prisma.user.update({ where: { id: user.id }, data: { confirmed: true } });

    const signinResponse = await request(app)
      .post('/api/users/signin')
      .send({ email: meUser.email, password: meUser.password });

    authToken = signinResponse.body.token;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: meUser.email } });
  });

  it('should return 204 with a valid JWT', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);
  });

  it('should return 401 without a token', async () => {
    const response = await request(app)
      .get('/api/users/me');

    expect(response.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(response.status).toBe(401);
  });

  it('should return 401 with a confirmation token (wrong audience)', async () => {
    const confirmToken = jwt.sign(
      { userId: 1 },
      process.env.JWT_SECRET,
      { audience: 'email-confirmation', expiresIn: '24h' },
    );

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${confirmToken}`);

    expect(response.status).toBe(401);
  });
});

after(async () => {
  await prisma.$disconnect();
});
