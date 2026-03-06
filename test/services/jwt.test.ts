import 'dotenv/config';
import { expect } from 'expect';
import jwt from 'jsonwebtoken';

import JwtService from '@/services/JwtService';

describe('JWT Service', () => {
  const userId = 42;

  describe('generateAuthToken', () => {
    it('should return a signed JWT string', () => {
      const token = JwtService.generateAuthToken(userId);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain userId and aud: api in the payload', () => {
      const token = JwtService.generateAuthToken(userId);
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      expect(decoded.userId).toBe(userId);
      expect(decoded.aud).toBe('api');
    });

    it('should have an expiration', () => {
      const token = JwtService.generateAuthToken(userId);
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('generateConfirmationToken', () => {
    it('should return a signed JWT string', () => {
      const token = JwtService.generateConfirmationToken(userId);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain userId and aud: email-confirmation in the payload', () => {
      const token = JwtService.generateConfirmationToken(userId);
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      expect(decoded.userId).toBe(userId);
      expect(decoded.aud).toBe('email-confirmation');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid auth token with correct audience', () => {
      const token = JwtService.generateAuthToken(userId);
      const payload = JwtService.verifyToken(token, 'api');
      expect(payload.userId).toBe(userId);
    });

    it('should reject an auth token when audience does not match', () => {
      const token = JwtService.generateAuthToken(userId);
      expect(() => JwtService.verifyToken(token, 'email-confirmation')).toThrow();
    });

    it('should verify a valid confirmation token with correct audience', () => {
      const token = JwtService.generateConfirmationToken(userId);
      const payload = JwtService.verifyToken(token, 'email-confirmation');
      expect(payload.userId).toBe(userId);
    });

    it('should reject an expired token', () => {
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET!,
        { expiresIn: '0s', audience: 'api' },
      );
      expect(() => JwtService.verifyToken(token, 'api')).toThrow();
    });

    it('should reject a token with invalid signature', () => {
      const token = jwt.sign({ userId }, 'wrong-secret', { audience: 'api' });
      expect(() => JwtService.verifyToken(token, 'api')).toThrow();
    });
  });
});
