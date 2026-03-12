import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import PostService from '@/services/PostService';
import type { CreatePostInput, EditPostInput } from '@/types/post';

class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.postService.create(req.body as CreatePostInput, req.user!);

    switch (result.code) {
      case RESULT_CODES.SUCCESS:
        break;
      default:
        res.status(500).json({ message: 'Error creating post' });
        return;
    }

    res.status(201).json(result.data);
  };

  edit = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(req.params.id as string);
    const result = await this.postService.edit(id, req.body as EditPostInput, req.user!);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.FORBIDDEN:
        res.status(403).json({ message: 'You can only edit your own posts' });
        return;
      case RESULT_CODES.EDIT_WINDOW_EXPIRED:
        res.status(403).json({ message: 'Posts can only be edited within 1 hour of creation' });
        return;
      case RESULT_CODES.SUCCESS:
        break;
      default:
        res.status(500).json({ message: 'Error editing post' });
        return;
    }

    res.json(result.data);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(req.params.id as string);
    const result = await this.postService.remove(id, req.user!);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.FORBIDDEN:
        res.status(403).json({ message: 'You can only delete your own posts' });
        return;
      case RESULT_CODES.SUCCESS:
        break;
      default:
        res.status(500).json({ message: 'Error deleting post' });
        return;
    }

    res.status(204).send();
  };

  createComment = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(req.params.id as string);
    const { content } = req.body;
    const user = req.user!;

    const result = await this.postService.createComment(id, content, user);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Internal server error' });
        return;
      default:
        if (!result.data) {
          res.status(500).json({ message: 'Internal server error' });
          return;
        }
    }

    res.status(201).json(result.data);
  };

  getComments = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.postService.getComments(id, { page, limit });

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Post not found' });
        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Internal server error' });
        return;
      default:
        if (!result.data) {
          res.status(500).json({ message: 'Internal server error' });
          return;
        }
    }

    // Add commentsCount to each comment
    const comments = await Promise.all(
      result.data.map(async (comment) => {
        const commentsCount = await this.postService.countCommentsByParentId(comment.id);

        return {
          ...comment,
          commentsCount,
        };
      }),
    );

    // Get total count for pagination
    const total = await this.postService.countCommentsByParentId(id);

    res.status(200).json({
      data: comments,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  };
}

export default PostController;
