import passport from 'passport';
import { Strategy as LocalStrategy, type IVerifyOptions } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import UserModel from '@/models/user';
import { verifyPassword } from '@/utils/auth';

passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },

  async (
    email: string,
    password: string,
    done: (
      error: unknown,
      user?: Express.User | false,
      options?: IVerifyOptions,
    ) => void,
  ) => {
    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const isValid = await verifyPassword(user.password, password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  },
));

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
    audience: 'api',
  },
  async (payload: { userId: number }, done) => {
    try {
      const user = await UserModel.findById(BigInt(payload.userId));
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  },
));

export default passport;
