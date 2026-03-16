import type { Request, Response, NextFunction } from 'express';

export const requireConfirmed = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.confirmed) {
    res.status(403).json({ message: 'Account not confirmed' });

    return;
  }

  next();
};