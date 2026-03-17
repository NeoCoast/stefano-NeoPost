import 'dotenv/config';

import feedWorker from '@/queues/feed-worker';

console.log('Feed worker started');

process.on('SIGTERM', async () => {
  await feedWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await feedWorker.close();
  process.exit(0);
});
