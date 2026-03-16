import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';
import JwtService from '@/services/jwt';

const createConfirmedUser = async () => {
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  const user = await prisma.user.create({
    data: {
      email: `list-test-${Date.now()}-${Math.random()}@test.com`,
      username: `listuser_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      password: hashedPassword,
      confirmed: true,
    },
  });
  return user;
};

describe('GET /api/users', () => {
  let authToken: string;
  const createdUserIds: bigint[] = [];

  before(async () => {
    const user = await createConfirmedUser();
    createdUserIds.push(user.id);
    authToken = JwtService.generateAuthToken(Number(user.id));

    // Create an unconfirmed user that should NOT appear in results
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const unconfirmed = await prisma.user.create({
      data: {
        email: `unconfirmed-list-${Date.now()}@test.com`,
        username: `unconfirmed_list_${Date.now()}`,
        password: hashedPassword,
        confirmed: false,
      },
    });
    createdUserIds.push(unconfirmed.id);
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it('should return 200 with paginated list of confirmed users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(20);
    expect(typeof response.body.pagination.total).toBe('number');
    expect(typeof response.body.pagination.totalPages).toBe('number');
  });

  it('should return only id and username for each user', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    const user = response.body.data[0];
    expect(user.id).toBeDefined();
    expect(user.username).toBeDefined();
    expect(user.email).toBeUndefined();
    expect(user.password).toBeUndefined();
  });

  it('should not include unconfirmed users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    const usernames = response.body.data.map((u: { username: string }) => u.username);
    const unconfirmedInResults = usernames.some((u: string) => u.startsWith('unconfirmed_list_'));
    expect(unconfirmedInResults).toBe(false);
  });

  it('should support pagination with page and limit query params', async () => {
    const response = await request(app)
      .get('/api/users?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.pagination.limit).toBe(2);
  });

  it('should cap limit at 100', async () => {
    const response = await request(app)
      .get('/api/users?limit=999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.limit).toBe(100);
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
  });
});

after(async () => {
  await prisma.$disconnect();
});