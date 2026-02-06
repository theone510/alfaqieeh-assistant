-- 1. تفعيل إضافة (Vector) للبحث الذكي
create extension if not exists vector;

-- 2. إنشاء جدول الفتاوى
create table if not exists fatwas (
  id bigserial primary key,
  content text,                     -- نص الفتوى (أو جزء منها)
  metadata jsonb,                   -- معلومات إضافية (اسم الكتاب، رقم المسألة، الرابط)
  embedding vector(768)             -- تمثيل النص كأرقام (Gemini uses 768 dimensions)
);

-- 3. تفعيل البحث السريع (Index)
create index on fatwas using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. دالة البحث (Search Function)
create or replace function match_fatwas (
  query_embedding vector(768),
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
  where 1 - (fatwas.embedding <=> query_embedding) > match_threshold
  order by fatwas.embedding <=> query_embedding
  limit match_count;
end;
$$;
