import type { Request, Response } from 'express';
import type { Post } from '@prisma/client';

import { RESULT_CODES } from '@/utils/constants';
import PostService from '@/services/PostService';
import PostModel from '@/models/PostModel';
import type { CreatePostInput, EditPostInput } from '@/types/post';

class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.postService.create(req.body as CreatePostInput, req.user!);

    if (result.code !== RESULT_CODES.SUCCESS) {
      res.status(500).json({ message: 'Error creating post' });
      return;
    }

    const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
    res.status(201).json(post);
  };

  edit = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(String(req.params.id));
    const result = await this.postService.edit(id, req.body as EditPostInput, req.user!);

    if (result.code === RESULT_CODES.NOT_FOUND) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (result.code === RESULT_CODES.FORBIDDEN) {
      res.status(403).json({ message: 'You can only edit your own posts' });
      return;
    }

    if (result.code === RESULT_CODES.EDIT_WINDOW_EXPIRED) {
      res.status(403).json({ message: 'Posts can only be edited within 1 hour of creation' });
      return;
    }

    if (result.code !== RESULT_CODES.SUCCESS) {
      res.status(500).json({ message: 'Error editing post' });
      return;
    }

    const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
    res.json(post);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(String(req.params.id));
    const result = await this.postService.remove(id, req.user!);

    if (result.code === RESULT_CODES.NOT_FOUND) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (result.code === RESULT_CODES.FORBIDDEN) {
      res.status(403).json({ message: 'You can only delete your own posts' });
      return;
    }

    if (result.code !== RESULT_CODES.SUCCESS) {
      res.status(500).json({ message: 'Error deleting post' });
      return;
    }

    res.status(204).send();
  };

  createComment = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(String(req.params.id));
    const { content } = req.body;
    const user = req.user!;

    const result = await this.postService.createComment(id, content, user);

    if (result.code === RESULT_CODES.NOT_FOUND) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (result.code === RESULT_CODES.ERROR) {
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (!result.data) {
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    // Convert BigInt to Number for JSON, including nested user
    const rawComment = result.data as Post & { user?: { id: bigint; username: string } };
    const comment = {
      ...rawComment,
      id: Number(rawComment.id),
      userId: Number(rawComment.userId),
      parentId: Number(rawComment.parentId),
      user: rawComment.user ? {
        id: Number(rawComment.user.id),
        username: rawComment.user.username,
      } : undefined,
    };

    res.status(201).json(comment);
  };

  getComments = async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.postService.getComments(id, { page, limit });

    if (result.code === RESULT_CODES.NOT_FOUND) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (result.code === RESULT_CODES.ERROR) {
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (!result.data) {
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    // Convert BigInt to Number and add commentsCount
    const comments = await Promise.all(
      result.data.map(async (comment) => {
        const commentsCount = await PostModel.countCommentsByParentId(comment.id);
        const rawComment = comment as Post & { user?: { id: bigint; username: string } };
        return {
          ...rawComment,
          id: Number(rawComment.id),
          userId: Number(rawComment.userId),
          parentId: Number(rawComment.parentId),
          commentsCount,
          user: rawComment.user ? {
            id: Number(rawComment.user.id),
            username: rawComment.user.username,
          } : undefined,
        };
      }),
    );

    // Get total count for pagination
    const total = await PostModel.countCommentsByParentId(id);

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