require('dotenv').config();
const { expect } = require('expect');
const jwt = require('jsonwebtoken');
const { generateAuthToken, generateConfirmationToken, verifyToken } = require('../../src/services/jwt');

describe('JWT Service', () => {
  const userId = 42;

  describe('generateAuthToken', () => {
    it('should return a signed JWT string', () => {
      const token = generateAuthToken(userId);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain userId and aud: api in the payload', () => {
      const token = generateAuthToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(userId);
      expect(decoded.aud).toBe('api');
    });

    it('should have an expiration', () => {
      const token = generateAuthToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('generateConfirmationToken', () => {
    it('should return a signed JWT string', () => {
      const token = generateConfirmationToken(userId);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain userId and aud: email-confirmation in the payload', () => {
      const token = generateConfirmationToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(userId);
      expect(decoded.aud).toBe('email-confirmation');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid auth token with correct audience', () => {
      const token = generateAuthToken(userId);
      const payload = verifyToken(token, 'api');
      expect(payload.userId).toBe(userId);
    });

    it('should reject an auth token when audience does not match', () => {
      const token = generateAuthToken(userId);
      expect(() => verifyToken(token, 'email-confirmation')).toThrow();
    });

    it('should verify a valid confirmation token with correct audience', () => {
      const token = generateConfirmationToken(userId);
      const payload = verifyToken(token, 'email-confirmation');
      expect(payload.userId).toBe(userId);
    });

    it('should reject an expired token', () => {
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '0s', audience: 'api' },
      );
      expect(() => verifyToken(token, 'api')).toThrow();
    });

    it('should reject a token with invalid signature', () => {
      const token = jwt.sign({ userId }, 'wrong-secret', { audience: 'api' });
      expect(() => verifyToken(token, 'api')).toThrow();
    });
  });
});
