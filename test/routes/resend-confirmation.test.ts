process.env.NODE_ENV = 'test';
import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';

describe('POST /api/users/resend-confirmation', () => {
  let unconfirmedUserEmail: string;

  before(async function () {
    this.timeout(10000);
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        username: faker.internet.username(),
        password: hashedPassword,
        confirmed: false,
      },
    });
    unconfirmedUserEmail = user.email;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: unconfirmedUserEmail } });
  });

  it('should return 200 for a valid unconfirmed user email', async function () {
    this.timeout(10000);
    const response = await request(app)
      .post('/api/users/resend-confirmation')
      .send({ email: unconfirmedUserEmail });

    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();
  });

  it('should return 200 even for non-existent email (prevents enumeration)', async () => {
    const response = await request(app)
      .post('/api/users/resend-confirmation')
      .send({ email: 'nobody@nowhere.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();
  });

  it('should return 200 even for already-confirmed user (prevents enumeration)', async function () {
    this.timeout(10000);
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const confirmedUser = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        username: faker.internet.username(),
        password: hashedPassword,
        confirmed: true,
      },
    });

    const response = await request(app)
      .post('/api/users/resend-confirmation')
      .send({ email: confirmedUser.email });

    expect(response.status).toBe(200);

    await prisma.user.delete({ where: { id: confirmedUser.id } });
  });

  it('should return 400 when email is missing', async () => {
    const response = await request(app)
      .post('/api/users/resend-confirmation')
      .send({});

    expect(response.status).toBe(400);
  });

  it('should return 400 when email format is invalid', async () => {
    const response = await request(app)
      .post('/api/users/resend-confirmation')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});

after(async () => {
  await prisma.$disconnect();
});
