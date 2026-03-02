import express from 'express';
import passport from './middlewares/passport';
import userRoutes from './routes/user';
import postRoutes from './routes/post';

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

export default app;
