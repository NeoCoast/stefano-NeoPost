import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import LikeService from '@/services/like';

class LikeController {
  constructor(private readonly likeService: LikeService) {}

  like = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(req.params.id as string);
    const userId = req.user!.id;

    const result = await this.likeService.like(userId, postId);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.ALREADY_EXISTS:
        res.status(400).json({ message: 'Already liked this post' });
        return;
      case RESULT_CODES.SUCCESS:
        res.status(201).json(result.data);
        return;
      default:
        res.status(500).json({ message: 'Error liking post' });
        return;
    }
  };

  unlike = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(req.params.id as string);
    const userId = req.user!.id;

    const result = await this.likeService.unlike(userId, postId);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Have not liked this post' });
        return;
      case RESULT_CODES.SUCCESS:
        res.json(result.data);
        return;
      default:
        res.status(500).json({ message: 'Error unliking post' });
        return;
    }
  };

  getLikers = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await this.likeService.getLikers(postId, page, limit);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.SUCCESS:
        res.json(result.data);
        return;
      default:
        res.status(500).json({ message: 'Error getting likers' });
        return;
    }
  };
}

export default LikeController;