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

describe('Comments API', () => {
  let testUser: Awaited<ReturnType<typeof prisma.user.create>>;
  let authToken: string;
  let testPost: Awaited<ReturnType<typeof prisma.post.create>>;
  const createdCommentIds: bigint[] = [];

  before(async () => {
    const result = await createConfirmedUser();
    testUser = result.user;
    authToken = result.token;

    // Create a test post
    testPost = await prisma.post.create({
      data: {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        userId: testUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up created comments
    if (createdCommentIds.length > 0) {
      await prisma.post.deleteMany({ where: { id: { in: createdCommentIds } } });
      createdCommentIds.length = 0;
    }
  });

  after(async () => {
    // Clean up post and user
    await prisma.post.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/posts/:id/comments', () => {
    it('should create a comment on a post', async () => {
      const commentData = { content: faker.lorem.sentence() };

      const response = await request(app)
        .post(`/api/posts/${Number(testPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.parentId).toBe(Number(testPost.id));
      expect(response.body.userId).toBe(Number(testUser.id));
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBeNull();

      createdCommentIds.push(BigInt(response.body.id));
    });

    it('should reject comment with title (400)', async () => {
      const commentData = {
        title: 'Comment Title',
        content: faker.lorem.sentence(),
      };

      const response = await request(app)
        .post(`/api/posts/${Number(testPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent post', async () => {
      const commentData = { content: faker.lorem.sentence() };

      const response = await request(app)
        .post('/api/posts/999999/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(404);
    });

    it('should return 404 for soft-deleted post', async () => {
      // Create a post to be soft-deleted
      const postToDelete = await prisma.post.create({
        data: {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
          userId: testUser.id,
        },
      });

      // Soft-delete the post
      await prisma.$executeRaw`
        UPDATE "posts" SET "deletedAt" = NOW() WHERE id = ${postToDelete.id}
      `;

      const commentData = { content: faker.lorem.sentence() };

      const response = await request(app)
        .post(`/api/posts/${Number(postToDelete.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const commentData = { content: faker.lorem.sentence() };

      const response = await request(app)
        .post(`/api/posts/${Number(testPost.id)}/comments`)
        .send(commentData);

      expect(response.status).toBe(401);
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post(`/api/posts/${Number(testPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 when content is empty string', async () => {
      const response = await request(app)
        .post(`/api/posts/${Number(testPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/posts/:id/comments', () => {
    let commentsPost: Awaited<ReturnType<typeof prisma.post.create>>;
    const testComments: Awaited<ReturnType<typeof prisma.post.create>>[] = [];

    before(async () => {
      // Create a post specifically for comments testing
      commentsPost = await prisma.post.create({
        data: {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
          userId: testUser.id,
        },
      });

      // Create multiple comments for pagination testing
      for (let i = 0; i < 5; i++) {
        const comment = await prisma.post.create({
          data: {
            content: `Test comment ${i + 1}`,
            userId: testUser.id,
            parentId: commentsPost.id,
            title: null,
          },
        });
        testComments.push(comment);
      }
    });

    after(async () => {
      // Clean up test comments
      for (const comment of testComments) {
        await prisma.post.delete({ where: { id: comment.id } }).catch(() => {});
      }
      // Clean up the test post
      if (commentsPost) {
        await prisma.post.delete({ where: { id: commentsPost.id } }).catch(() => {});
      }
    });

    it('should return comments for a post', async () => {
      const response = await request(app)
        .get(`/api/posts/${Number(commentsPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/999999/comments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should support pagination with page and limit', async () => {
      const response = await request(app)
        .get(`/api/posts/${Number(commentsPost.id)}/comments?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should return second page of comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${Number(commentsPost.id)}/comments?page=2&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should return hasMore false when no more pages', async () => {
      const response = await request(app)
        .get(`/api/posts/${Number(commentsPost.id)}/comments?page=10&limit=10`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should include user info in comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${Number(commentsPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      const comment = response.body.data[0];
      expect(comment.user).toBeDefined();
      expect(comment.user.id).toBeDefined();
      expect(comment.user.username).toBeDefined();
    });

    it('should return comments sorted by createdAt desc', async () => {
      const response = await request(app)
        .get(`/api/posts/${Number(commentsPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const comments = response.body.data;
      for (let i = 1; i < comments.length; i++) {
        const prevDate = new Date(comments[i - 1].createdAt);
        const currDate = new Date(comments[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('Comments Count', () => {
    let countPost: Awaited<ReturnType<typeof prisma.post.create>>;

    before(async () => {
      // Create a fresh post for comments count testing
      countPost = await prisma.post.create({
        data: {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
          userId: testUser.id,
        },
      });
    });

    after(async () => {
      // Clean up comments for this post
      await prisma.post.deleteMany({
        where: { parentId: countPost.id },
      });
      // Clean up the post
      if (countPost) {
        await prisma.post.delete({ where: { id: countPost.id } }).catch(() => {});
      }
    });

    it('should update commentsCount on post when comments are added', async () => {
      // Get initial state
      const initialResponse = await request(app)
        .get(`/api/posts/${Number(countPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(initialResponse.status).toBe(200);
      const initialTotal = initialResponse.body.pagination.total;

      // Create a comment
      const commentData = { content: 'Test comment for count' };
      const createResponse = await request(app)
        .post(`/api/posts/${Number(countPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(createResponse.status).toBe(201);
      createdCommentIds.push(BigInt(createResponse.body.id));

      // Verify comments count increased
      const afterResponse = await request(app)
        .get(`/api/posts/${Number(countPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(afterResponse.status).toBe(200);
      expect(afterResponse.body.pagination.total).toBe(initialTotal + 1);
    });

    it('should include commentsCount for each comment', async () => {
      // Create a comment that will have nested comments
      const parentCommentData = { content: 'Parent comment' };
      const parentResponse = await request(app)
        .post(`/api/posts/${Number(countPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(parentCommentData);

      expect(parentResponse.status).toBe(201);
      createdCommentIds.push(BigInt(parentResponse.body.id));

      // Create a nested comment (reply to the parent comment)
      const nestedCommentData = { content: 'Nested comment' };
      const nestedResponse = await request(app)
        .post(`/api/posts/${Number(parentResponse.body.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(nestedCommentData);

      expect(nestedResponse.status).toBe(201);
      createdCommentIds.push(BigInt(nestedResponse.body.id));

      // Get comments and verify commentsCount is included
      const commentsResponse = await request(app)
        .get(`/api/posts/${Number(countPost.id)}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(commentsResponse.status).toBe(200);
      const parentComment = commentsResponse.body.data.find(
        (c: { id: number }) => c.id === parentResponse.body.id,
      );
      expect(parentComment).toBeDefined();
      expect(parentComment.commentsCount).toBeDefined();
      expect(parentComment.commentsCount).toBeGreaterThanOrEqual(1);
    });
  });
});
