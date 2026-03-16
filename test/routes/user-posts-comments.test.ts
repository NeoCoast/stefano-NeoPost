import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';

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
  return user;
};

describe('GET /api/users/:id/posts', () => {
  let testUser: Awaited<ReturnType<typeof createConfirmedUser>>;
  let otherUser: Awaited<ReturnType<typeof createConfirmedUser>>;
  const postIds: bigint[] = [];

  before(async () => {
    testUser = await createConfirmedUser();
    otherUser = await createConfirmedUser();

    const post1 = await prisma.post.create({
      data: { title: 'First Post', content: 'Content 1', userId: testUser.id },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const post2 = await prisma.post.create({
      data: { title: 'Second Post', content: 'Content 2', userId: testUser.id },
    });
    const post3 = await prisma.post.create({
      data: { title: 'Other User Post', content: 'Other content', userId: otherUser.id },
    });
    postIds.push(post1.id, post2.id, post3.id);

    await prisma.post.create({
      data: { title: 'Comment 1', content: 'Comment content', userId: testUser.id, parentId: post1.id },
    });
    await prisma.post.create({
      data: { title: 'Comment 2', content: 'Comment content', userId: testUser.id, parentId: post2.id },
    });
  });

  after(async () => {
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
    await prisma.post.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 with posts ordered by createdAt DESC', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0].title).toBe('Second Post');
    expect(response.body.data[1].title).toBe('First Post');
  });

  it('should return 200 with empty array when user has no posts', async () => {
    const emptyUser = await createConfirmedUser();
    const response = await request(app).get(`/api/users/${Number(emptyUser.id)}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(0);
    await prisma.user.delete({ where: { id: emptyUser.id } });
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request(app).get('/api/users/999999/posts');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('should exclude soft-deleted posts', async () => {
    const deletedPost = await prisma.post.create({
      data: { title: 'Deleted Post', content: 'To delete', userId: testUser.id },
    });
    postIds.push(deletedPost.id);

    await prisma.$executeRaw`
      UPDATE "posts" SET "deletedAt" = NOW() WHERE id = ${deletedPost.id}
    `;

    const response = await request(app).get(`/api/users/${Number(testUser.id)}/posts`);

    expect(response.status).toBe(200);
    const titles = response.body.data.map((p: { title: string }) => p.title);
    expect(titles).not.toContain('Deleted Post');
  });

  it('should exclude comments (posts with parentId)', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
    const titles = response.body.data.map((p: { title: string }) => p.title);
    expect(titles).not.toContain('Comment 1');
    expect(titles).not.toContain('Comment 2');
  });

  it('should include commentsCount for each post', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].commentsCount).toBeDefined();
    expect(response.body.data[1].commentsCount).toBeDefined();
  });

  it('should support pagination with page and limit', async () => {
    const response = await request(app)
      .get(`/api/users/${Number(testUser.id)}/posts`)
      .query({ page: 1, limit: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.pagination.total).toBe(2);
    expect(response.body.pagination.hasMore).toBe(true);
  });

  it('should be a public endpoint (no auth required)', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/posts`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});

describe('GET /api/users/:id/comments', () => {
  let testUser: Awaited<ReturnType<typeof createConfirmedUser>>;
  let otherUser: Awaited<ReturnType<typeof createConfirmedUser>>;
  const postIds: bigint[] = [];

  before(async () => {
    testUser = await createConfirmedUser();
    otherUser = await createConfirmedUser();

    const parentPost = await prisma.post.create({
      data: { title: 'Parent Post', content: 'Parent content', userId: otherUser.id },
    });
    postIds.push(parentPost.id);

    const comment1 = await prisma.post.create({
      data: { title: 'Comment 1', content: 'Comment content 1', userId: testUser.id, parentId: parentPost.id },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const comment2 = await prisma.post.create({
      data: { title: 'Comment 2', content: 'Comment content 2', userId: testUser.id, parentId: parentPost.id },
    });
    postIds.push(comment1.id, comment2.id);

    await prisma.post.create({
      data: { title: 'Top-level Post', content: 'Top level', userId: testUser.id },
    });
  });

  after(async () => {
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
    await prisma.post.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, otherUser.id] } } });
  });

  it('should return 200 with comments ordered by createdAt DESC', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0].content).toBe('Comment content 2');
    expect(response.body.data[1].content).toBe('Comment content 1');
  });

  it('should return 200 with empty array when user has no comments', async () => {
    const response = await request(app).get(`/api/users/${Number(otherUser.id)}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(0);
  });

  it('should return 404 when user does not exist', async () => {
    const response = await request(app).get('/api/users/999999/comments');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('should exclude soft-deleted comments', async () => {
    const parentPost = await prisma.post.findFirst({ where: { title: 'Parent Post' } });
    if (!parentPost) throw new Error('Parent post not found');

    const deletedComment = await prisma.post.create({
      data: { title: 'Deleted Comment', content: 'To delete', userId: testUser.id, parentId: parentPost.id },
    });
    postIds.push(deletedComment.id);

    await prisma.$executeRaw`
      UPDATE "posts" SET "deletedAt" = NOW() WHERE id = ${deletedComment.id}
    `;

    const response = await request(app).get(`/api/users/${Number(testUser.id)}/comments`);

    expect(response.status).toBe(200);
    const contents = response.body.data.map((c: { content: string }) => c.content);
    expect(contents).not.toContain('To delete');
  });

  it('should exclude top-level posts (only return comments)', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/comments`);

    expect(response.status).toBe(200);
    const contents = response.body.data.map((c: { content: string }) => c.content);
    expect(contents).not.toContain('Top level');
  });

  it('should include parentPost with id and title', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].parentPost).toBeDefined();
    expect(response.body.data[0].parentPost.id).toBeDefined();
    expect(response.body.data[0].parentPost.title).toBe('Parent Post');
  });

  it('should support pagination with page and limit', async () => {
    const response = await request(app)
      .get(`/api/users/${Number(testUser.id)}/comments`)
      .query({ page: 1, limit: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.pagination.total).toBe(2);
    expect(response.body.pagination.hasMore).toBe(true);
  });

  it('should be a public endpoint (no auth required)', async () => {
    const response = await request(app).get(`/api/users/${Number(testUser.id)}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});

after(async () => {
  await prisma.$disconnect();
});
