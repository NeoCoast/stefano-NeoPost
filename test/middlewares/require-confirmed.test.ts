import 'dotenv/config';
import request from 'supertest';
import { expect } from 'expect';
import bcrypt from 'bcrypt';

import app from '@/app';
import prisma from '@/db/prisma';
import JwtService from '@/services/jwt';

describe('requireConfirmed middleware', () => {
  let confirmedToken: string;
  let unconfirmedToken: string;
  let confirmedUserId: bigint;
  let unconfirmedUserId: bigint;

  before(async () => {
    const hashedPassword = await bcrypt.hash('testpass123', 10);

    const confirmedUser = await prisma.user.create({
      data: {
        email: `confirmed-${Date.now()}@test.com`,
        username: `confirmed_${Date.now()}`,
        password: hashedPassword,
        confirmed: true,
      },
    });
    confirmedUserId = confirmedUser.id;
    confirmedToken = JwtService.generateAuthToken(Number(confirmedUser.id));

    const unconfirmedUser = await prisma.user.create({
      data: {
        email: `unconfirmed-${Date.now()}@test.com`,
        username: `unconfirmed_${Date.now()}`,
        password: hashedPassword,
        confirmed: false,
      },
    });
    unconfirmedUserId = unconfirmedUser.id;
    unconfirmedToken = JwtService.generateAuthToken(Number(unconfirmedUser.id));
  });

  after(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [confirmedUserId, unconfirmedUserId] } },
    });
  });

  it('should allow confirmed users through on GET /api/users/me', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${confirmedToken}`);

    expect(response.status).toBe(204);
  });

  it('should return 403 for unconfirmed users on GET /api/users/me', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${unconfirmedToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Account not confirmed');
  });
});

after(async () => {
  await prisma.$disconnect();
});
