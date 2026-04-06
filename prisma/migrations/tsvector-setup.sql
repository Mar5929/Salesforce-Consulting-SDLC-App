-- tsvector full-text search setup
-- Run via: npx prisma db execute --file prisma/migrations/tsvector-setup.sql
-- These are manual SQL migrations outside Prisma schema (Prisma cannot express tsvector natively)

-- ============================================================================
-- 1. Add search_vector columns
-- ============================================================================

ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Decision" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "KnowledgeArticle" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Requirement" ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE "Risk" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- 2. Create GIN indexes for fast full-text search
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_question_search_vector ON "Question" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_decision_search_vector ON "Decision" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_article_search_vector ON "KnowledgeArticle" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_requirement_search_vector ON "Requirement" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_risk_search_vector ON "Risk" USING GIN (search_vector);

-- ============================================================================
-- 3. Trigger functions to auto-populate search_vector on INSERT and UPDATE
-- ============================================================================

-- Question: questionText + answer
CREATE OR REPLACE FUNCTION question_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."questionText", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."answerText", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_search_vector_trigger ON "Question";
CREATE TRIGGER question_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Question"
  FOR EACH ROW EXECUTE FUNCTION question_search_vector_update();

-- Decision: title + rationale
CREATE OR REPLACE FUNCTION decision_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."rationale", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decision_search_vector_trigger ON "Decision";
CREATE TRIGGER decision_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Decision"
  FOR EACH ROW EXECUTE FUNCTION decision_search_vector_update();

-- KnowledgeArticle: title + content
CREATE OR REPLACE FUNCTION knowledge_article_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."content", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_article_search_vector_trigger ON "KnowledgeArticle";
CREATE TRIGGER knowledge_article_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "KnowledgeArticle"
  FOR EACH ROW EXECUTE FUNCTION knowledge_article_search_vector_update();

-- Requirement: displayId + description
CREATE OR REPLACE FUNCTION requirement_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."displayId", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."description", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requirement_search_vector_trigger ON "Requirement";
CREATE TRIGGER requirement_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Requirement"
  FOR EACH ROW EXECUTE FUNCTION requirement_search_vector_update();

-- Risk: displayId + description + mitigationStrategy
CREATE OR REPLACE FUNCTION risk_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW."displayId", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."description", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."mitigationStrategy", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS risk_search_vector_trigger ON "Risk";
CREATE TRIGGER risk_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Risk"
  FOR EACH ROW EXECUTE FUNCTION risk_search_vector_update();

-- ============================================================================
-- 4. Backfill existing rows (trigger only fires on INSERT/UPDATE)
-- ============================================================================

UPDATE "Question" SET search_vector =
  setweight(to_tsvector('english', COALESCE("questionText", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("answerText", '')), 'B');

UPDATE "Decision" SET search_vector =
  setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("rationale", '')), 'B');

UPDATE "KnowledgeArticle" SET search_vector =
  setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("content", '')), 'B');

UPDATE "Requirement" SET search_vector =
  setweight(to_tsvector('english', COALESCE("displayId", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("description", '')), 'B');

UPDATE "Risk" SET search_vector =
  setweight(to_tsvector('english', COALESCE("displayId", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("description", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE("mitigationStrategy", '')), 'C');
