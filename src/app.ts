import express from 'express';

import passport from '@/middlewares/passport';
import userRoutes from '@/routes/user';
import postRoutes from '@/routes/post';

// Global BigInt JSON serialization fix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

export default app;
