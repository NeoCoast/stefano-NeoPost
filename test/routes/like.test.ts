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

describe('Like API', () => {
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
    await prisma.like.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
    await prisma.post.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
    await prisma.$disconnect();
  });

  describe('POST /api/posts/:id/like', () => {
    it('should like a post successfully', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });

      const response = await request(app)
        .post(`/api/posts/${Number(post.id)}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Post liked');

      await prisma.like.deleteMany({ where: { postId: post.id } });
      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should like a comment successfully', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });
      const comment = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id, parentId: post.id },
      });

      const response = await request(app)
        .post(`/api/posts/${Number(comment.id)}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Post liked');

      await prisma.like.deleteMany({ where: { postId: comment.id } });
      await prisma.post.delete({ where: { id: comment.id } });
      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return 400 when already liked', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });
      await prisma.like.create({ data: { userId: testUser.id, postId: post.id } });

      const response = await request(app)
        .post(`/api/posts/${Number(post.id)}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Already liked this post');

      await prisma.like.deleteMany({ where: { postId: post.id } });
      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .post('/api/posts/999999/like')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Post not found');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/posts/1/like');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/posts/:id/like', () => {
    it('should unlike a post successfully', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });
      await prisma.like.create({ data: { userId: testUser.id, postId: post.id } });

      const response = await request(app)
        .delete(`/api/posts/${Number(post.id)}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post unliked');

      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return 404 when not liked', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });

      const response = await request(app)
        .delete(`/api/posts/${Number(post.id)}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Have not liked this post');

      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .delete('/api/posts/1/like');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/posts/:id/likers', () => {
    it('should return paginated likers', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });
      await prisma.like.create({ data: { userId: testUser.id, postId: post.id } });
      await prisma.like.create({ data: { userId: otherUser.id, postId: post.id } });

      const response = await request(app)
        .get(`/api/posts/${Number(post.id)}/likers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('username');

      await prisma.like.deleteMany({ where: { postId: post.id } });
      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return empty array for post with no likes', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });

      const response = await request(app)
        .get(`/api/posts/${Number(post.id)}/likers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);

      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/999999/likers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should support pagination', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });

      // Create 5 likes
      for (let i = 0; i < 5; i++) {
        const user = await createConfirmedUser();
        await prisma.like.create({ data: { userId: user.user.id, postId: post.id } });
      }

      const response = await request(app)
        .get(`/api/posts/${Number(post.id)}/likers?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(5);

      await prisma.like.deleteMany({ where: { postId: post.id } });
      await prisma.post.delete({ where: { id: post.id } });
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/posts/1/likers');

      expect(response.status).toBe(401);
    });
  });

  describe('likeCount in responses', () => {
    it('should include likeCount in comments', async () => {
      const post = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id },
      });
      const comment = await prisma.post.create({
        data: { content: faker.lorem.paragraph(), userId: testUser.id, parentId: post.id },
      });
      await prisma.like.create({ data: { userId: testUser.id, postId: comment.id } });

      const response = await request(app)
        .get(`/api/posts/${Number(post.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].likeCount).toBe(1);

      await prisma.like.deleteMany({ where: { postId: comment.id } });
      await prisma.post.delete({ where: { id: comment.id } });
      await prisma.post.delete({ where: { id: post.id } });
    });
  });
});