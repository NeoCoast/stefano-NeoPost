const express = require('express');

const app = express();

const itemRoutes = require('./routes/item');

app.use(express.json());

app.use('/api/items', itemRoutes);

module.exports = app;
