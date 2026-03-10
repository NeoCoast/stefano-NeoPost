import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import PostService from '@/services/PostService';
import type { CreatePostInput, EditPostInput } from '@/types/post';

class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();

    this.create = this.create.bind(this);
    this.edit = this.edit.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req: Request, res: Response): Promise<void> {
    const result = await this.postService.create(req.body as CreatePostInput, req.user!);

    if (result.code !== RESULT_CODES.SUCCESS) {
      res.status(500).json({ message: 'Error creating post' });
      return;
    }

    const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
    res.status(201).json(post);
  }

  async edit(req: Request, res: Response): Promise<void> {
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
  }

  async delete(req: Request, res: Response): Promise<void> {
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
  }
}

export default PostController;
