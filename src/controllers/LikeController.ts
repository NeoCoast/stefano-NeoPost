import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import LikeService from '@/services/LikeService';

class LikeController {
  private likeService: LikeService;

  constructor() {
    this.likeService = new LikeService();
  }

  like = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(String(req.params.id));
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
        break;
      default:
        res.status(500).json({ message: 'Error liking post' });
        return;
    }

    res.status(201).json(result.data);
  };

  unlike = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(String(req.params.id));
    const userId = req.user!.id;

    const result = await this.likeService.unlike(userId, postId);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Have not liked this post' });
        return;
      case RESULT_CODES.SUCCESS:
        break;
      default:
        res.status(500).json({ message: 'Error unliking post' });
        return;
    }

    res.json(result.data);
  };

  getLikers = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await this.likeService.getLikers(postId, page, limit);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.SUCCESS:
        break;
      default:
        res.status(500).json({ message: 'Error getting likers' });
        return;
    }

    res.json(result.data);
  };
}

export default LikeController;