import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import FeedService from '@/services/feed';

class FeedController {
  constructor(private readonly feedService: FeedService) {}

  getFollowing = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await this.feedService.getFollowingFeed(userId, page, limit);

    switch (result.code) {
      case RESULT_CODES.SUCCESS:
        res.json(result.data);

        return;
      default:
        res.status(500).json({ message: 'Error fetching following feed' });

        return;
    }
  };

  getForYou = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await this.feedService.getForYouFeed(userId, page, limit);

    switch (result.code) {
      case RESULT_CODES.SUCCESS:
        res.json(result.data);

        return;
      default:
        res.status(500).json({ message: 'Error fetching for you feed' });

        return;
    }
  };
}

export default FeedController;
