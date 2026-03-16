import bcrypt from 'bcrypt';

import { RESULT_CODES } from '@/utils/constants';
import UserModel from '@/models/user';
import JwtService from '@/services/jwt';
import EmailService from '@/services/email';
import type { SignupInput } from '@/types/auth';
import type { ServiceResult } from '@/types/common';

class AuthService {
  async signup(data: SignupInput): Promise<ServiceResult<{ message: string }>> {
    try {
      const existingEmail = await UserModel.findByEmail(data.email);
      if (existingEmail) {
        return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
      }

      const existingUsername = await UserModel.findByUsername(data.username);
      if (existingUsername) {
        return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await UserModel.create({ ...data, password: hashedPassword });

      const token = JwtService.generateConfirmationToken(Number(user.id));
      await EmailService.sendConfirmationEmail(user.email, token);

      return { code: RESULT_CODES.SUCCESS, data: { message: 'Check your email to confirm your account' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating user:', message);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async confirmEmail(token: string): Promise<ServiceResult<{ message: string }>> {
    try {
      const payload = JwtService.verifyToken(token, 'email-confirmation');
      const user = await UserModel.confirmUser(BigInt(payload.userId));

      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      return { code: RESULT_CODES.SUCCESS, data: { message: 'Email confirmed successfully' } };
    } catch {
      return { code: RESULT_CODES.ERROR, data: { message: 'Invalid or expired token' } };
    }
  }

  async resendConfirmation(email: string): Promise<ServiceResult<{ message: string }>> {
    try {
      const user = await UserModel.findByEmail(email);

      if (user && !user.confirmed) {
        const token = JwtService.generateConfirmationToken(Number(user.id));
        await EmailService.sendConfirmationEmail(user.email, token);
      }

      return {
        code: RESULT_CODES.SUCCESS,
        data: { message: 'If your account exists and is unconfirmed, a new confirmation email has been sent' },
      };
    } catch (error) {
      console.error('Resend confirmation error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }
}

export default AuthService;
