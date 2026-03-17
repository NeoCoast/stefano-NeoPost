import { RESULT_CODES } from '@/utils/constants';
import FollowModel from '@/models/follow';
import PostModel from '@/models/post';
import FeedItemModel from '@/models/feed-item';
import type { ServiceResult } from '@/types/common';

interface FeedPost {
  id: bigint;
  title: string | null;
  content: string;
  createdAt: Date;
  user: { id: bigint; username: string };
  likeCount: number;
  commentsCount: number;
}

interface PaginatedFeed {
  data: FeedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface FeedItemPost {
  post: {
    id: bigint;
    title: string | null;
    content: string;
    createdAt: Date;
    user: { id: bigint; username: string };
    _count: { likes: number; comments: number };
  };
}

class FeedService {
  async getFollowingFeed(
    userId: bigint,
    page: number,
    limit: number,
  ): Promise<ServiceResult<PaginatedFeed>> {
    try {
      const followingIds = await FollowModel.findFollowingIds(userId);

      if (followingIds.length === 0) {
        return {
          code: RESULT_CODES.SUCCESS,
          data: {
            data: [],
            pagination: { page, limit, total: 0, hasMore: false },
          },
        };
      }

      const [posts, total] = await Promise.all([
        PostModel.findFeedPosts(followingIds, { page, limit }),
        PostModel.countFeedPosts(followingIds),
      ]);

      const [likeCounts, commentCounts] = await Promise.all([
        Promise.all(posts.map((post) => PostModel.countLikesByPostId(post.id))),
        Promise.all(posts.map((post) => PostModel.countCommentsByParentId(post.id))),
      ]);

      const data: FeedPost[] = posts.map((post, i) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        user: (post as unknown as { user: { id: bigint; username: string } }).user,
        likeCount: likeCounts[i],
        commentsCount: commentCounts[i],
      }));

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
          },
        },
      };
    } catch (error) {
      console.error('Get following feed error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getForYouFeed(
    userId: bigint,
    page: number,
    limit: number,
  ): Promise<ServiceResult<PaginatedFeed>> {
    try {
      const [feedItems, total] = await Promise.all([
        FeedItemModel.findByUserId(userId, { page, limit }),
        FeedItemModel.countByUserId(userId),
      ]);

      const data: FeedPost[] = feedItems.map((item) => {
        const feedItem = item as unknown as FeedItemPost;
        const post = feedItem.post;

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          user: post.user,
          likeCount: post._count.likes,
          commentsCount: post._count.comments,
        };
      });

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
          },
        },
      };
    } catch (error) {
      console.error('Get for you feed error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }
}

export default FeedService;
