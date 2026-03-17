import { Queue } from 'bullmq';

import connection from '@/queues/connection';

export const FEED_QUEUE_NAME = 'feed';
export const RECOMPUTE_JOB_NAME = 'recompute-feed';

const feedQueue = new Queue(FEED_QUEUE_NAME, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: connection as any,
});

export const addRecomputeJob = async (userId: bigint): Promise<void> => {
  const jobId = `recompute-feed-${userId}`;

  await feedQueue.add(
    RECOMPUTE_JOB_NAME,
    { userId: Number(userId) },
    {
      jobId,
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  );
};

export default feedQueue;
