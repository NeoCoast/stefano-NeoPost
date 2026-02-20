module.exports = {
  development: {
    username: 'dev',
    password: 'dev',
    database: 'nodejs_training',
    host: '127.0.0.1',
    port: 5434,
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER || 'dev',
    password: process.env.DB_PASSWORD || 'dev',
    database: process.env.DB_NAME || 'nodejs_training_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5434,
    dialect: 'postgres',
  },
};
