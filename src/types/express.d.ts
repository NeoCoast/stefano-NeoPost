declare global {
  namespace Express {
    interface User {
      id: bigint;
      email: string;
      pendingEmail: string | null;
      username: string;
      birthday: Date | null;
      password: string;
      confirmed: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export {};
