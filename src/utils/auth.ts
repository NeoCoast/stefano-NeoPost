import bcrypt from 'bcrypt';

export const verifyPassword = async (
  hashedPassword: string,
  plainPassword: string,
): Promise<boolean> => (
  bcrypt.compare(plainPassword, hashedPassword)
);
