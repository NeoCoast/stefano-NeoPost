-- CreateTable
CREATE TABLE "feed_items" (
    "userId" BIGINT NOT NULL,
    "postId" BIGINT NOT NULL,
    "position" INTEGER NOT NULL,
    "computedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_items_pkey" PRIMARY KEY ("userId","postId")
);

-- CreateIndex
CREATE INDEX "feed_items_userId_position_idx" ON "feed_items"("userId", "position");

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
