import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';
import JwtService from '@/services/jwt';

describe('POST /api/users/signup', () => {
  const validUser = {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'securepass123',
  };
  let signupResponse: request.Response;

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
    expect(user!.confirmed).toBe(false);
  });

  it('should store a hashed password, not plaintext', async () => {
    const user = await prisma.user.findUnique({ where: { email: validUser.email } });
    expect(user!.password).not.toBe('securepass123');
    expect(user!.password.startsWith('$2b$')).toBe(true);
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
  let confirmUser: Awaited<ReturnType<typeof prisma.user.findFirst>>;

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
      { userId: Number(confirmUser!.id) },
      process.env.JWT_SECRET!,
      { audience: 'email-confirmation', expiresIn: '24h' },
    );

    const response = await request(app)
      .get(`/api/users/confirm?token=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();

    confirmUser = await prisma.user.findUnique({ where: { id: confirmUser!.id } });
    expect(confirmUser!.confirmed).toBe(true);
  });

  it('should return 400 for invalid token', async () => {
    const response = await request(app)
      .get('/api/users/confirm?token=invalid-token');

    expect(response.status).toBe(400);
  });

  it('should return 400 for auth token used as confirmation', async () => {
    const authToken = jwt.sign(
      { userId: Number(confirmUser!.id) },
      process.env.JWT_SECRET!,
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
    await prisma.user.update({ where: { id: user!.id }, data: { confirmed: true } });
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
  let authToken: string;
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
    await prisma.user.update({ where: { id: user!.id }, data: { confirmed: true } });

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
      process.env.JWT_SECRET!,
      { audience: 'email-confirmation', expiresIn: '24h' },
    );

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${confirmToken}`);

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/users/me', () => {
  let token: string;
  let user: { id: number; email: string; username: string; password: string };

  before(async function () {
    this.timeout(10000);
    const password = faker.internet.password({ length: 10 });
    const plainEmail = faker.internet.email();
    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        email: plainEmail,
        username: faker.internet.username(),
        password: hashedPassword,
        confirmed: true,
      },
    });

    user = {
      id: Number(created.id),
      email: created.email,
      username: created.username,
      password,
    };

    const signinRes = await request(app)
      .post('/api/users/signin')
      .send({ email: user.email, password: user.password });

    token = signinRes.body.token;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { id: BigInt(user.id) } });
  });

  it('should return 400 for empty body', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should update birthday successfully', async () => {
    const newBirthday = '1990-05-15';

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ birthday: newBirthday });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile updated successfully');

    const updatedUser = await prisma.user.findUnique({ where: { id: BigInt(user.id) } });
    expect(updatedUser!.birthday).toBeTruthy();
  });

  it('should update password with correct currentPassword', async () => {
    const newPassword = 'newSecurePass456';

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: user.password, newPassword });

    expect(response.status).toBe(200);

    const signinRes = await request(app)
      .post('/api/users/signin')
      .send({ email: user.email, password: newPassword });

    expect(signinRes.status).toBe(200);
    expect(signinRes.body.token).toBeDefined();

    user.password = newPassword;
  });

  it('should return 401 for wrong currentPassword when updating password', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'anotherNewPass789' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Current password is incorrect');
  });

  it('should return 400 for newPassword without currentPassword', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'anotherNewPass789' });

    expect(response.status).toBe(400);
  });

  it('should store pendingEmail when updating email, not change email', async function () {
    this.timeout(10000);
    const newEmail = faker.internet.email();

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail });

    expect(response.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({ where: { id: BigInt(user.id) } });
    expect(updatedUser!.pendingEmail).toBe(newEmail);
    expect(updatedUser!.email).toBe(user.email);
  });

  it('should update email after confirmation', async function () {
    this.timeout(10000);
    const newEmail = faker.internet.email();

    await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail });

    const confirmToken = JwtService.generateConfirmationToken(user.id);

    const confirmRes = await request(app)
      .get(`/api/users/confirm?token=${confirmToken}`);

    expect(confirmRes.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({ where: { id: BigInt(user.id) } });
    expect(updatedUser!.email).toBe(newEmail);
    expect(updatedUser!.pendingEmail).toBeNull();
  });

  it('should return 409 for duplicate email (matches another user email)', async () => {
    const otherPassword = faker.internet.password({ length: 10 });
    const otherHashedPassword = await bcrypt.hash(otherPassword, 10);
    const otherEmail = faker.internet.email();

    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        username: faker.internet.username(),
        password: otherHashedPassword,
        confirmed: true,
      },
    });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: otherEmail });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already in use');

    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('should return 409 for duplicate email (matches another user pendingEmail)', async () => {
    const otherPassword = faker.internet.password({ length: 10 });
    const otherHashedPassword = await bcrypt.hash(otherPassword, 10);
    const otherEmail = faker.internet.email();

    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        username: faker.internet.username(),
        password: otherHashedPassword,
        confirmed: true,
      },
    });

    const pendingEmail = faker.internet.email();
    await prisma.user.update({
      where: { id: otherUser.id },
      data: { pendingEmail },
    });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: pendingEmail });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already in use');

    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('should return 400 when trying to update username (additionalProperties)', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'newusername' });

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .send({ birthday: '1995-03-20' });

    expect(response.status).toBe(401);
  });
});

after(async () => {
  await prisma.$disconnect();
});
