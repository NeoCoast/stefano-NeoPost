import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';
import JwtService from '@/services/JwtService';

const createConfirmedUser = async () => {
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  const user = await prisma.user.create({
    data: {
      email: faker.internet.email(),
      username: faker.internet.username(),
      password: hashedPassword,
      confirmed: true,
    },
  });
  const token = JwtService.generateAuthToken(Number(user.id));
  return { user, token };
};

describe('POST /api/users/:id/follow', () => {
  let authToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;

    const otherResult = await createConfirmedUser();
    otherUser = otherResult.user;
  });

  after(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: testUser.id }, { followingId: testUser.id }],
      },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: otherUser.id }, { followingId: otherUser.id }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 201 when following successfully', async () => {
    const response = await request(app)
      .post(`/api/users/${Number(otherUser.id)}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User followed successfully');

    await prisma.follow.deleteMany({
      where: { followerId: testUser.id, followingId: otherUser.id },
    });
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).post(`/api/users/${Number(otherUser.id)}/follow`);

    expect(response.status).toBe(401);
  });

  it('should return 400 when trying to follow yourself', async () => {
    const response = await request(app)
      .post(`/api/users/${Number(testUser.id)}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Cannot follow yourself');
  });

  it('should return 404 when user to follow does not exist', async () => {
    const response = await request(app)
      .post('/api/users/999999/follow')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('should return 409 when already following', async () => {
    await prisma.follow.create({
      data: { followerId: testUser.id, followingId: otherUser.id },
    });

    const response = await request(app)
      .post(`/api/users/${Number(otherUser.id)}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Already following this user');

    await prisma.follow.deleteMany({
      where: { followerId: testUser.id, followingId: otherUser.id },
    });
  });
});

describe('DELETE /api/users/:id/follow', () => {
  let authToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;

    const otherResult = await createConfirmedUser();
    otherUser = otherResult.user;
  });

  after(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: testUser.id }, { followingId: testUser.id }],
      },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: otherUser.id }, { followingId: otherUser.id }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 when unfollowing successfully', async () => {
    await prisma.follow.create({
      data: { followerId: testUser.id, followingId: otherUser.id },
    });

    const response = await request(app)
      .delete(`/api/users/${Number(otherUser.id)}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User unfollowed successfully');
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).delete(`/api/users/${Number(otherUser.id)}/follow`);

    expect(response.status).toBe(401);
  });

  it('should return 404 when not following the user', async () => {
    const response = await request(app)
      .delete(`/api/users/${Number(otherUser.id)}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Not following this user');
  });
});

describe('GET /api/users/:id/followers', () => {
  let authToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;

    const otherResult = await createConfirmedUser();
    otherUser = otherResult.user;
  });

  after(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: testUser.id }, { followingId: testUser.id }],
      },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: otherUser.id }, { followingId: otherUser.id }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 with followers list', async () => {
    await prisma.follow.create({
      data: { followerId: otherUser.id, followingId: testUser.id },
    });

    const response = await request(app)
      .get(`/api/users/${Number(testUser.id)}/followers`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].id).toBe(Number(otherUser.id));
    expect(response.body.data[0].username).toBe(otherUser.username);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(1);

    await prisma.follow.deleteMany({
      where: { followerId: otherUser.id, followingId: testUser.id },
    });
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/followers`);

    expect(response.status).toBe(401);
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request(app)
      .get('/api/users/999999/followers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

describe('GET /api/users/:id/following', () => {
  let authToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;

    const otherResult = await createConfirmedUser();
    otherUser = otherResult.user;
  });

  after(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: testUser.id }, { followingId: testUser.id }],
      },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: otherUser.id }, { followingId: otherUser.id }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 with following list', async () => {
    await prisma.follow.create({
      data: { followerId: testUser.id, followingId: otherUser.id },
    });

    const response = await request(app)
      .get(`/api/users/${Number(testUser.id)}/following`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].id).toBe(Number(otherUser.id));
    expect(response.body.data[0].username).toBe(otherUser.username);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(1);

    await prisma.follow.deleteMany({
      where: { followerId: testUser.id, followingId: otherUser.id },
    });
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/following`);

    expect(response.status).toBe(401);
  });
});

describe('GET /api/users/:id (profile)', () => {
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;

    const otherResult = await createConfirmedUser();
    otherUser = otherResult.user;
  });

  after(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: testUser.id }, { followingId: testUser.id }],
      },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: otherUser.id }, { followingId: otherUser.id }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 with user profile and counts (public endpoint, no auth)', async () => {
    await prisma.follow.create({
      data: { followerId: otherUser.id, followingId: testUser.id },
    });
    await prisma.follow.create({
      data: { followerId: testUser.id, followingId: otherUser.id },
    });

    const response = await request(app).get(`/api/users/${Number(testUser.id)}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(Number(testUser.id));
    expect(response.body.username).toBe(testUser.username);
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.followerCount).toBe(1);
    expect(response.body.followingCount).toBe(1);
    expect(response.body.password).toBeUndefined();

    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: testUser.id, followingId: otherUser.id },
          { followerId: otherUser.id, followingId: testUser.id },
        ],
      },
    });
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request(app).get('/api/users/999999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

after(async () => {
  await prisma.$disconnect();
});
