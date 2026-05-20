-- Add session_log_id to Question with FK to SessionLog
ALTER TABLE "Question"
ADD COLUMN IF NOT EXISTS "session_log_id" INTEGER;

ALTER TABLE "Question"
ADD CONSTRAINT "Question_session_log_id_fkey"
FOREIGN KEY ("session_log_id") REFERENCES "SessionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Question_session_log_id_idx" ON "Question"("session_log_id");
