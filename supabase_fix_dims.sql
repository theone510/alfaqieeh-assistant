-- 1. تعديل حجم العمود ليتناسب مع النموذج الجديد (3072)
alter table fatwas 
alter column embedding type vector(3072);

-- 2. تحديث دالة البحث لتقبل الحجم الجديد
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
  where 1 - (fatwas.embedding <=> query_embedding) > match_threshold
  order by fatwas.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 3. إعادة بناء الفهرس (اختياري، للسرعة)
drop index if exists fatwas_embedding_idx;
create index fatwas_embedding_idx on fatwas using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
