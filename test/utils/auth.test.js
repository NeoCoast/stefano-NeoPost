const { expect } = require('expect');
const bcrypt = require('bcrypt');
const { verifyPassword } = require('../../src/utils/auth');

describe('verifyPassword', () => {
  let hashedPassword;

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
