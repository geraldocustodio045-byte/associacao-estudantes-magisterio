-- Esquema inicial de exemplo para revisão antes de uso real.
-- Executar no SQL Editor do projecto Supabase depois de rever a política de dados.
-- As inscrições e sugestões são privadas; visitantes não podem lê-las.
create extension if not exists pgcrypto;

create table if not exists public.member_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) <= 100),
  course text not null check (char_length(course) <= 80),
  grade text not null check (char_length(grade) <= 30),
  phone text not null check (char_length(phone) <= 30),
  motivation text default '' check (char_length(motivation) <= 600),
  consent boolean not null default false,
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  created_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('Sugestão','Reclamação','Dúvida')),
  sender_name text default '' check (char_length(sender_name) <= 100),
  message text not null check (char_length(message) between 5 and 1500),
  status text not null default 'recebida' check (status in ('recebida','em análise','respondida','arquivada')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text not null default '',
  event_date timestamptz,
  location text default '',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  public_url text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Papéis administrativos. A atribuição de director deve ser feita apenas por
-- um administrador autorizado, nunca através de um formulário público.
create table if not exists public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('director','editor')),
  created_at timestamptz not null default now()
);

alter table public.member_requests enable row level security;
alter table public.suggestions enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.documents enable row level security;
alter table public.staff_roles enable row level security;

-- Helper: utilizador autenticado com função autorizada.
create or replace function public.is_association_staff()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.staff_roles
    where user_id = auth.uid() and role in ('director','editor')
  );
$$;

-- A submissão pública exige validação no servidor/Edge Function ou CAPTCHA
-- antes de activar inserções anónimas. Não abrir INSERT público sem protecção.
-- A equipa autenticada pode gerir os registos.
create policy "staff reads member requests" on public.member_requests
for select to authenticated using (public.is_association_staff());
create policy "staff manages member requests" on public.member_requests
for all to authenticated using (public.is_association_staff()) with check (public.is_association_staff());

create policy "staff reads suggestions" on public.suggestions
for select to authenticated using (public.is_association_staff());
create policy "staff manages suggestions" on public.suggestions
for all to authenticated using (public.is_association_staff()) with check (public.is_association_staff());

create policy "public reads published announcements" on public.announcements
for select to anon, authenticated using (published = true);
create policy "staff manages announcements" on public.announcements
for all to authenticated using (public.is_association_staff()) with check (public.is_association_staff());

create policy "public reads published events" on public.events
for select to anon, authenticated using (published = true);
create policy "staff manages events" on public.events
for all to authenticated using (public.is_association_staff()) with check (public.is_association_staff());

create policy "public reads published documents" on public.documents
for select to anon, authenticated using (published = true);
create policy "staff manages documents" on public.documents
for all to authenticated using (public.is_association_staff()) with check (public.is_association_staff());

create policy "staff reads staff roles" on public.staff_roles
for select to authenticated using (user_id = auth.uid() or public.is_association_staff());
create policy "staff manages staff roles" on public.staff_roles
for all to authenticated using (public.is_association_staff()) with check (public.is_association_staff());

-- Nota de segurança:
-- Este esquema não abre INSERT anónimo para inscrições/sugestões porque isso
-- pode facilitar spam e abuso. Para recepção pública real, implemente uma Edge
-- Function com validação, rate limiting e CAPTCHA ou outra protecção anti-spam.
-- Não publique chaves secretas no front-end.
