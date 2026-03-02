declare global {
  namespace Express {
    interface User {
      id: bigint;
      email: string;
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
