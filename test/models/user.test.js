const { expect } = require('expect');
const bcrypt = require('bcrypt');
const db = require('../../src/db/models');

const { User } = db;

describe('User.verifyPassword', () => {
  let user;

  before(async () => {
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    user = await User.create({
      email: `verify-test-${Date.now()}@example.com`,
      username: `verify-test-${Date.now()}`,
      password: hashedPassword,
    });
  });

  after(async () => {
    await user.destroy();
  });

  it('should return true for the correct password', async () => {
    const result = await user.verifyPassword('testpass123');
    expect(result).toBe(true);
  });

  it('should return false for a wrong password', async () => {
    const result = await user.verifyPassword('wrongpassword');
    expect(result).toBe(false);
  });
});
