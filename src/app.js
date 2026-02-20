const express = require('express');
const passport = require('./middlewares/passport');

const app = express();

const userRoutes = require('./routes/user');

app.use(express.json());
app.use(passport.initialize());

app.use('/api/users', userRoutes);

module.exports = app;
