import { Worker } from 'bullmq';

import prisma from '@/db/prisma';
import FollowModel from '@/models/follow';
import PostModel from '@/models/post';
import { FEED_QUEUE_NAME, RECOMPUTE_JOB_NAME } from '@/queues/feed-queue';
import connection from '@/queues/connection';

const FOLLOW_BONUS_WEIGHT = 0.1;
const MAX_FEED_SIZE = 200;

export const computeForYouFeed = async (userId: bigint): Promise<void> => {
  try {
    // Step 1: Get all posts the user has liked
    const likedPostIds = await PostModel.findLikedPostIds(userId);

    // Step 2: Cold start — user has no likes yet
    if (likedPostIds.length === 0) {
      const trendingPosts = await PostModel.findTrendingPosts({ limit: MAX_FEED_SIZE });

      await prisma.$transaction([
        prisma.feedItem.deleteMany({ where: { userId } }),
        prisma.feedItem.createMany({
          data: trendingPosts.map((post, index) => ({
            userId,
            postId: post.id,
            position: index + 1,
          })),
        }),
      ]);

      return;
    }

    // Step 3: Find taste neighbors with overlap scores
    // groupBy: for each user who liked any of the same posts, count how many
    const neighborGroups = await prisma.like.groupBy({
      by: ['userId'],
      where: {
        postId: { in: likedPostIds },
        userId: { not: userId },
      },
      _count: { postId: true },
    });

    if (neighborGroups.length === 0) {
      // No neighbors found — fall back to trending
      const trendingPosts = await PostModel.findTrendingPosts({ limit: MAX_FEED_SIZE });

      await prisma.$transaction([
        prisma.feedItem.deleteMany({ where: { userId } }),
        prisma.feedItem.createMany({
          data: trendingPosts.map((post, index) => ({
            userId,
            postId: post.id,
            position: index + 1,
          })),
        }),
      ]);

      return;
    }

    // Build neighborId → overlapScore map
    const neighborScores = new Map<bigint, number>();
    let maxOverlap = 0;

    for (const group of neighborGroups) {
      const overlap = group._count.postId;
      neighborScores.set(group.userId, overlap);
      if (overlap > maxOverlap) maxOverlap = overlap;
    }

    const followBonus = maxOverlap * FOLLOW_BONUS_WEIGHT;

    // Step 4: Get the user's following list (for follow bonus)
    const followingIds = await FollowModel.findFollowingIds(userId);
    const followingSet = new Set(followingIds.map(String)); // String for Set lookup

    // Step 5: Fetch candidate posts from neighbors
    const neighborIds = Array.from(neighborScores.keys());

    const candidatePosts = await prisma.post.findMany({
      where: {
        userId: { in: neighborIds },
        id: { notIn: likedPostIds },
        parentId: null,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, username: true } },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    // Step 6: Score each candidate post
    type ScoredPost = {
      post: (typeof candidatePosts)[number];
      score: number;
    };

    const scoredPosts: ScoredPost[] = candidatePosts.map((post) => {
      // Sum overlap scores of all neighbors who liked this post
      const score = post.likes.reduce((acc, like) => {
        return acc + (neighborScores.get(like.userId) ?? 0);
      }, 0);

      // Add follow bonus if current user follows the post author
      const bonus = followingSet.has(String(post.userId)) ? followBonus : 0;

      return { post, score: score + bonus };
    });

    // Step 7: Rank by score DESC → commentsCount DESC → likeCount DESC → createdAt DESC
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.post._count.comments !== a.post._count.comments) {
        return b.post._count.comments - a.post._count.comments;
      }
      if (b.post._count.likes !== a.post._count.likes) {
        return b.post._count.likes - a.post._count.likes;
      }
      return b.post.createdAt.getTime() - a.post.createdAt.getTime();
    });

    // Step 8: Assign positions and write to FeedItem table
    const topPosts = scoredPosts.slice(0, MAX_FEED_SIZE);

    await prisma.$transaction([
      prisma.feedItem.deleteMany({ where: { userId } }),
      prisma.feedItem.createMany({
        data: topPosts.map(({ post }, index) => ({
          userId,
          postId: post.id,
          position: index + 1,
        })),
      }),
    ]);
  } catch (error) {
    console.error('computeForYouFeed error:', error);
    throw error;
  }
};

// BullMQ Worker — listens for jobs and processes them
const feedWorker = new Worker(
  FEED_QUEUE_NAME,
  async (job) => {
    if (job.name === RECOMPUTE_JOB_NAME) {
      if (!job.data.userId) {
        throw new Error('Missing userId in job data');
      }
      const userId = BigInt(job.data.userId);
      await computeForYouFeed(userId);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { connection: connection as any },
);

feedWorker.on('failed', (job, err) => {
  console.error(`Feed job failed for job ${job?.id}:`, err);
});

export default feedWorker;
