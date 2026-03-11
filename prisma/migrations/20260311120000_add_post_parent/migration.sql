-- Add parentId column for self-referencing comments
ALTER TABLE "posts" ADD COLUMN "parentId" BIGINT NULL;

-- Make title nullable (comments don't have titles)
ALTER TABLE "posts" ALTER COLUMN "title" DROP NOT NULL;

-- Add foreign key constraint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "posts"("id");

-- Create index for efficient comment lookups
CREATE INDEX "posts_parentId_idx" ON "posts"("parentId")
  WHERE "parentId" IS NOT NULL;
