import jwt from 'jsonwebtoken';

export interface TokenPayload extends jwt.JwtPayload {
  userId: number;
}

class JwtService {
  static generateAuthToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { audience: 'api', expiresIn: '24h' },
    );
  }

  static generateConfirmationToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { audience: 'email-confirmation', expiresIn: '24h' },
    );
  }

  static verifyToken(token: string, audience: string): TokenPayload {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience });
    return payload as TokenPayload;
  }
}

export default JwtService;
