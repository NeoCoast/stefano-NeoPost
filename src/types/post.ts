export interface CreatePostInput {
  title: string;
  content: string;
}

export interface EditPostInput {
  title?: string;
  content?: string;
}
