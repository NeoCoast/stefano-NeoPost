require('dotenv').config();
const request = require('supertest');
const { expect } = require('expect');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/db/prisma');
const { generateAuthToken } = require('../../src/services/jwt');

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
  let authToken;
  let testUser;
  const createdPostIds = [];

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
