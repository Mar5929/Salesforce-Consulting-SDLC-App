-- Vector dimension migration: 1536 -> 1024 for Voyage AI
-- Voyage AI voyage-3-large uses 1024 dimensions by default
-- Run via: npx prisma db execute --file prisma/migrations/vector-dimension-1024.sql

-- ============================================================================
-- 1. Alter embedding columns from vector(1536) to vector(1024)
-- ============================================================================

-- OrgComponent (used in Phase 4 for org metadata embeddings)
ALTER TABLE "OrgComponent" ALTER COLUMN embedding TYPE vector(1024);

-- KnowledgeArticle (used for semantic search over knowledge base)
ALTER TABLE "KnowledgeArticle" ALTER COLUMN embedding TYPE vector(1024);

-- ============================================================================
-- 2. Create HNSW indexes for efficient approximate nearest neighbor search
--    HNSW provides better recall than IVFFlat with acceptable build time
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_component_embedding_hnsw
  ON "OrgComponent" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_knowledge_article_embedding_hnsw
  ON "KnowledgeArticle" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
