const express = require('express');

const app = express();

const itemRoutes = require('./routes/item');
const userRoutes = require('./routes/user');

app.use(express.json());

app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
