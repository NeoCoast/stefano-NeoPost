const express = require('express');
const passport = require('./middlewares/passport');

const app = express();

const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');

app.use(express.json());
app.use(passport.initialize());

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

module.exports = app;
