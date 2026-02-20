const passport = require('passport');
const LocalStrategy = require('passport-local');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const userDataAccess = require('../dataaccess/user');

passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },

  async (email, password, done) => {
    try {
      const user = await userDataAccess.findByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const isValid = await user.verifyPassword(password);
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
    secretOrKey: process.env.JWT_SECRET,
    audience: 'api',
  },
  async (payload, done) => {
    try {
      const user = await userDataAccess.findById(payload.userId);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  },
));

module.exports = passport;
