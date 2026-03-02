import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import prisma from '../../src/db/prisma';
import { generateAuthToken } from '../../src/services/jwt';

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
  const token = generateAuthToken(Number(user.id));
  return { user, token };
};

describe('POST /api/posts', () => {
  let authToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  const createdPostIds: bigint[] = [];

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;
  });

  afterEach(async () => {
    if (createdPostIds.length > 0) {
      await prisma.post.deleteMany({ where: { id: { in: createdPostIds } } });
      createdPostIds.length = 0;
    }
  });

  after(async () => {
    await prisma.post.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it('should return 201 and the created post when authenticated', async () => {
    const postData = { title: faker.lorem.sentence(), content: faker.lorem.paragraph() };

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(postData.title);
    expect(response.body.content).toBe(postData.content);
    expect(response.body.userId).toBe(Number(testUser.id));
    expect(response.body.id).toBeDefined();

    createdPostIds.push(BigInt(response.body.id));
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({ title: 'test', content: 'test' });
    expect(response.status).toBe(401);
  });

  it('should return 400 when title is missing', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'some content' });
    expect(response.status).toBe(400);
  });

  it('should return 400 when body is empty', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/posts/:id', () => {
  let authToken: string;
  let otherAuthToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let otherUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;

    const otherResult = await createConfirmedUser();
    otherUser = otherResult.user;
    otherAuthToken = otherResult.token;
  });

  after(async () => {
    await prisma.post.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 and update title when owner edits within 1 hour', async () => {
    const post = await prisma.post.create({
      data: { title: 'Original', content: 'Content', userId: testUser.id },
    });

    const response = await request(app)
      .patch(`/api/posts/${Number(post.id)}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Title');
    expect(response.body.content).toBe('Content');

    await prisma.post.delete({ where: { id: post.id } });
  });

  it('should return 200 and update content when owner edits within 1 hour', async () => {
    const post = await prisma.post.create({
      data: { title: 'Title', content: 'Original Content', userId: testUser.id },
    });

    const response = await request(app)
      .patch(`/api/posts/${Number(post.id)}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Updated Content' });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('Updated Content');
    expect(response.body.title).toBe('Title');

    await prisma.post.delete({ where: { id: post.id } });
  });

  it('should return 401 without auth token', async () => {
    const post = await prisma.post.create({
      data: { title: 'Title', content: 'Content', userId: testUser.id },
    });

    const response = await request(app)
      .patch(`/api/posts/${Number(post.id)}`)
      .send({ title: 'New' });

    expect(response.status).toBe(401);
    await prisma.post.delete({ where: { id: post.id } });
  });

  it('should return 404 when post does not exist', async () => {
    const response = await request(app)
      .patch('/api/posts/999999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New' });
    expect(response.status).toBe(404);
  });

  it('should return 403 when user does not own the post', async () => {
    const post = await prisma.post.create({
      data: { title: 'Title', content: 'Content', userId: testUser.id },
    });

    const response = await request(app)
      .patch(`/api/posts/${Number(post.id)}`)
      .set('Authorization', `Bearer ${otherAuthToken}`)
      .send({ title: 'Hacked' });

    expect(response.status).toBe(403);
    await prisma.post.delete({ where: { id: post.id } });
  });

  it('should return 403 when editing after 1 hour', async () => {
    const post = await prisma.post.create({
      data: { title: 'Title', content: 'Content', userId: testUser.id },
    });

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await prisma.post.update({
      where: { id: post.id },
      data: { createdAt: twoHoursAgo },
    });

    const response = await request(app)
      .patch(`/api/posts/${Number(post.id)}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Too Late' });

    expect(response.status).toBe(403);
    await prisma.post.delete({ where: { id: post.id } });
  });

  it('should return 400 when body is empty', async () => {
    const post = await prisma.post.create({
      data: { title: 'Title', content: 'Content', userId: testUser.id },
    });

    const response = await request(app)
      .patch(`/api/posts/${Number(post.id)}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
    await prisma.post.delete({ where: { id: post.id } });
  });
});

after(async () => {
  await prisma.$disconnect();
});
