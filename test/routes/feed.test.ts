import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';
import JwtService from '@/services/jwt';

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

describe('Feed API', () => {
  let authToken: string;
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;
  });

  after(async () => {
    await prisma.feedItem.deleteMany({ where: { userId: testUser.id } });
    await prisma.like.deleteMany({ where: { userId: testUser.id } });
    await prisma.post.deleteMany({ where: { userId: testUser.id } });
    await prisma.follow.deleteMany({
      where: {
        OR: [{ followerId: testUser.id }, { followingId: testUser.id }],
      },
    });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('GET /api/feed/following', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/feed/following');

      expect(response.status).toBe(401);
    });

    it('should return empty feed when user follows nobody', async () => {
      const response = await request(app)
        .get('/api/feed/following')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should return posts from followed users in chronological order', async () => {
      const followedUser = await createConfirmedUser();
      const anotherFollowedUser = await createConfirmedUser();

      await prisma.follow.create({
        data: { followerId: testUser.id, followingId: followedUser.user.id },
      });
      await prisma.follow.create({
        data: { followerId: testUser.id, followingId: anotherFollowedUser.user.id },
      });

      const olderPost = await prisma.post.create({
        data: {
          content: faker.lorem.paragraph(),
          userId: followedUser.user.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
      });

      const newerPost = await prisma.post.create({
        data: {
          content: faker.lorem.paragraph(),
          userId: anotherFollowedUser.user.id,
          createdAt: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/feed/following')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0].id).toBe(Number(newerPost.id));
      expect(response.body.data[1].id).toBe(Number(olderPost.id));
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('content');
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0].user).toHaveProperty('id');
      expect(response.body.data[0].user).toHaveProperty('username');
      expect(response.body.data[0]).toHaveProperty('likeCount');
      expect(response.body.data[0]).toHaveProperty('commentsCount');

      await prisma.follow.deleteMany({ where: { followerId: testUser.id } });
      await prisma.post.deleteMany({
        where: { userId: { in: [followedUser.user.id, anotherFollowedUser.user.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [followedUser.user.id, anotherFollowedUser.user.id] } },
      });
    });

    it('should not include comments in the following feed', async () => {
      const followedUser = await createConfirmedUser();

      await prisma.follow.create({
        data: { followerId: testUser.id, followingId: followedUser.user.id },
      });

      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: followedUser.user.id },
      });

      await prisma.post.create({
        data: {
          content: faker.lorem.paragraph(),
          userId: followedUser.user.id,
          parentId: post.id,
        },
      });

      const response = await request(app)
        .get('/api/feed/following')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
      expect(response.body.data[0].id).toBe(Number(post.id));

      await prisma.follow.deleteMany({ where: { followerId: testUser.id } });
      await prisma.post.deleteMany({ where: { userId: followedUser.user.id } });
      await prisma.user.delete({ where: { id: followedUser.user.id } });
    });

    it('should paginate correctly', async () => {
      const followedUser = await createConfirmedUser();

      await prisma.follow.create({
        data: { followerId: testUser.id, followingId: followedUser.user.id },
      });

      const posts = [];
      for (let i = 0; i < 5; i++) {
        posts.push(
          await prisma.post.create({
            data: {
              content: faker.lorem.paragraph(),
              userId: followedUser.user.id,
            },
          }),
        );
      }

      const response = await request(app)
        .get('/api/feed/following?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.hasMore).toBe(true);

      const secondPage = await request(app)
        .get('/api/feed/following?page=2&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data).toHaveLength(2);
      expect(secondPage.body.pagination.page).toBe(2);
      expect(secondPage.body.pagination.hasMore).toBe(true);

      const thirdPage = await request(app)
        .get('/api/feed/following?page=3&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(thirdPage.status).toBe(200);
      expect(thirdPage.body.data).toHaveLength(1);
      expect(thirdPage.body.pagination.hasMore).toBe(false);

      await prisma.follow.deleteMany({ where: { followerId: testUser.id } });
      await prisma.post.deleteMany({ where: { userId: followedUser.user.id } });
      await prisma.user.delete({ where: { id: followedUser.user.id } });
    });
  });

  describe('GET /api/feed/for-you', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/feed/for-you');

      expect(response.status).toBe(401);
    });

    it('should return empty feed when no precomputed data exists', async () => {
      const response = await request(app)
        .get('/api/feed/for-you')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should return precomputed feed items in position order', async () => {
      const author1 = await createConfirmedUser();
      const author2 = await createConfirmedUser();

      const post1 = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: author1.user.id },
      });
      const post2 = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: author2.user.id },
      });
      const post3 = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: author1.user.id },
      });

      await prisma.feedItem.createMany({
        data: [
          { userId: testUser.id, postId: post2.id, position: 2 },
          { userId: testUser.id, postId: post1.id, position: 1 },
          { userId: testUser.id, postId: post3.id, position: 3 },
        ],
      });

      const response = await request(app)
        .get('/api/feed/for-you')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.data[0].id).toBe(Number(post1.id));
      expect(response.body.data[1].id).toBe(Number(post2.id));
      expect(response.body.data[2].id).toBe(Number(post3.id));
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('content');
      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0].user).toHaveProperty('id');
      expect(response.body.data[0].user).toHaveProperty('username');
      expect(response.body.data[0]).toHaveProperty('likeCount');
      expect(response.body.data[0]).toHaveProperty('commentsCount');

      await prisma.feedItem.deleteMany({ where: { userId: testUser.id } });
      await prisma.post.deleteMany({
        where: { userId: { in: [author1.user.id, author2.user.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [author1.user.id, author2.user.id] } },
      });
    });

    it('should paginate correctly', async () => {
      const author = await createConfirmedUser();

      const posts = [];
      for (let i = 0; i < 5; i++) {
        posts.push(
          await prisma.post.create({
            data: { content: faker.lorem.paragraph(), userId: author.user.id },
          }),
        );
      }

      await prisma.feedItem.createMany({
        data: posts.map((post, index) => ({
          userId: testUser.id,
          postId: post.id,
          position: index,
        })),
      });

      const response = await request(app)
        .get('/api/feed/for-you?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.hasMore).toBe(true);

      const secondPage = await request(app)
        .get('/api/feed/for-you?page=2&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data).toHaveLength(2);
      expect(secondPage.body.pagination.page).toBe(2);
      expect(secondPage.body.pagination.hasMore).toBe(true);

      const thirdPage = await request(app)
        .get('/api/feed/for-you?page=3&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(thirdPage.status).toBe(200);
      expect(thirdPage.body.data).toHaveLength(1);
      expect(thirdPage.body.pagination.hasMore).toBe(false);

      await prisma.feedItem.deleteMany({ where: { userId: testUser.id } });
      await prisma.post.deleteMany({ where: { userId: author.user.id } });
      await prisma.user.delete({ where: { id: author.user.id } });
    });
  });
});
