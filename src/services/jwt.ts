import jwt from 'jsonwebtoken';

export interface TokenPayload extends jwt.JwtPayload {
  userId: number;
}

export const generateAuthToken = (userId: number): string => jwt.sign(
  { userId },
  process.env.JWT_SECRET!,
  { audience: 'api', expiresIn: '24h' },
);

export const generateConfirmationToken = (userId: number): string => jwt.sign(
  { userId },
  process.env.JWT_SECRET!,
  { audience: 'email-confirmation', expiresIn: '24h' },
);

export const verifyToken = (token: string, audience: string): TokenPayload => {
  const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience });
  return payload as TokenPayload;
};
