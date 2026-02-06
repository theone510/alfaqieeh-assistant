-- 1. تنظيف شامل
drop function if exists match_fatwas;
drop table if exists fatwas;

-- 2. تفعيل الإضافة
create extension if not exists vector;

-- 3. إنشاء الجدول (3072 بُعد)
create table fatwas (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(3072)
);

-- 4. إنشاء الفهرس (HNSW بدلاً من IVFFlat لدعم الأبعاد الكبيرة)
create index on fatwas using hnsw (embedding vector_cosine_ops);

-- 5. دالة البحث
create or replace function match_fatwas (
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fatwas.id,
    fatwas.content,
    fatwas.metadata,
    1 - (fatwas.embedding <=> query_embedding) as similarity
  from fatwas
  order by fatwas.embedding <=> query_embedding
  limit match_count;
end;
$$;
