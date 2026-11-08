-- Limite de utilização do chatbot público. Só a Edge Function, com service role,
-- pode ler e escrever nesta tabela. Não são guardados endereços IP em texto simples.
create table if not exists public.ai_chat_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_limits_ip_created_idx
  on public.ai_chat_limits (ip_hash, created_at desc);

alter table public.ai_chat_limits enable row level security;

revoke all on table public.ai_chat_limits from anon, authenticated;
