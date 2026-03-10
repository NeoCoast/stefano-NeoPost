import { expect } from 'expect';
import bcrypt from 'bcrypt';

import { verifyPassword } from '@/utils/auth';

describe('verifyPassword', () => {
  let hashedPassword: string;

  before(async () => {
    hashedPassword = await bcrypt.hash('testpass123', 10);
  });

  it('should return true for the correct password', async () => {
    const result = await verifyPassword(hashedPassword, 'testpass123');
    expect(result).toBe(true);
  });

  it('should return false for a wrong password', async () => {
    const result = await verifyPassword(hashedPassword, 'wrongpassword');
    expect(result).toBe(false);
  });
});
