ALTER TABLE "Question"
ADD COLUMN "attachment_storage_key" TEXT,
ADD COLUMN "attachment_size_bytes" INTEGER,
ADD COLUMN "answered_by_user_id" INTEGER,
ADD COLUMN "answered_at" TIMESTAMP(3);

ALTER TABLE "Question"
ADD CONSTRAINT "Question_answered_by_user_id_fkey"
FOREIGN KEY ("answered_by_user_id")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Question_answered_by_user_id_idx" ON "Question"("answered_by_user_id");
