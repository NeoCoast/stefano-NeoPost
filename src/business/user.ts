import bcrypt from 'bcrypt';

import { RESULT_CODES } from '@/utils/constants';
import * as userDataAccess from '@/dataaccess/user';
import { generateConfirmationToken, verifyToken } from '@/services/jwt';
import { sendConfirmationEmail } from '@/services/email';
import type { SignupInput } from '@/types/auth';
import type { ServiceResult } from '@/types/common';

export const signup = async (data: SignupInput): Promise<ServiceResult<{ message: string }>> => {
  try {
    const existingEmail = await userDataAccess.findByEmail(data.email);
    if (existingEmail) {
      return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
    }

    const existingUsername = await userDataAccess.findByUsername(data.username);
    if (existingUsername) {
      return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userDataAccess.create({ ...data, password: hashedPassword });

    const token = generateConfirmationToken(Number(user.id));
    await sendConfirmationEmail(user.email, token);

    return { code: RESULT_CODES.SUCCESS, data: { message: 'Check your email to confirm your account' } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating user:', message);
    return { code: RESULT_CODES.ERROR, data: error };
  }
};

export const confirmEmail = async (token: string): Promise<ServiceResult<{ message: string }>> => {
  try {
    const payload = verifyToken(token, 'email-confirmation');
    const user = await userDataAccess.confirmUser(BigInt(payload.userId));

    if (!user) {
      return { code: RESULT_CODES.NOT_FOUND, data: null };
    }

    return { code: RESULT_CODES.SUCCESS, data: { message: 'Email confirmed successfully' } };
  } catch {
    return { code: RESULT_CODES.ERROR, data: { message: 'Invalid or expired token' } };
  }
};
