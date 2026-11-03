-- Pedidos de trabalhos escolares + plano premium. Executar UMA vez no Supabase (SQL Editor).
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  protocol text not null default ('TR-' || upper(substr(md5(random()::text),1,6))),
  student_name text, phone text,
  theme text not null check (char_length(theme) between 3 and 200),
  details text check (char_length(details) <= 3000),
  delivery text not null default 'pdf' check (delivery in ('pdf','impresso')),
  plan text not null default 'gratis' check (plan in ('gratis','premium')),
  status text not null default 'recebido' check (status in ('recebido','em execução','entregue','cancelado')),
  reply text, due_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.premium_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  protocol text not null default ('PG-' || upper(substr(md5(random()::text),1,6))),
  student_name text, phone text, note text,
  amount numeric not null default 3800,
  proof_path text not null,
  status text not null default 'em análise' check (status in ('em análise','confirmado','recusado')),
  confirmed_at timestamptz, paid_until timestamptz,
  created_at timestamptz not null default now()
);
alter table public.work_orders enable row level security;
alter table public.premium_payments enable row level security;

create policy "aluno vê os seus trabalhos" on public.work_orders for select using (user_id = auth.uid() or public.is_association_staff());
create policy "aluno pede trabalho" on public.work_orders for insert with check (user_id = auth.uid());
create policy "staff gere trabalhos" on public.work_orders for update using (public.is_association_staff()) with check (public.is_association_staff());
create policy "aluno vê os seus pagamentos" on public.premium_payments for select using (user_id = auth.uid() or public.is_association_staff());
create policy "aluno envia comprovativo" on public.premium_payments for insert with check (user_id = auth.uid());
create policy "staff gere pagamentos" on public.premium_payments for update using (public.is_association_staff()) with check (public.is_association_staff());

-- Regras no servidor (não podem ser contornadas pelo navegador): 3 grátis/mês, premium 10 em 30 dias.
create or replace function public.work_orders_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare pr record; free_n int; prem_n int;
begin
  new.user_id := auth.uid();
  if not exists (select 1 from public.profiles where id = auth.uid() and coalesce(verified,false) and not coalesce(suspended,false)) then
    raise exception 'conta_nao_verificada';
  end if;
  select * into pr from public.premium_payments where user_id = auth.uid() and status = 'confirmado' and paid_until > now() order by paid_until desc limit 1;
  if found then
    select count(*) into prem_n from public.work_orders where user_id = auth.uid() and plan = 'premium' and created_at >= pr.confirmed_at;
    if prem_n < 10 then new.plan := 'premium'; new.due_at := now() + interval '24 hours'; return new; end if;
  end if;
  select count(*) into free_n from public.work_orders where user_id = auth.uid() and plan = 'gratis' and created_at >= date_trunc('month', now());
  if free_n >= 3 then raise exception 'limite_gratis'; end if;
  new.plan := 'gratis'; new.due_at := now() + interval '48 hours'; new.status := 'recebido';
  return new;
end $$;
drop trigger if exists work_orders_guard on public.work_orders;
create trigger work_orders_guard before insert on public.work_orders for each row execute function public.work_orders_guard();

create or replace function public.payments_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid(); new.status := 'em análise'; new.amount := 3800; new.confirmed_at := null; new.paid_until := null;
  elsif new.status = 'confirmado' and old.status is distinct from 'confirmado' then
    new.confirmed_at := now(); new.paid_until := now() + interval '30 days';
  end if;
  return new;
end $$;
drop trigger if exists payments_guard on public.premium_payments;
create trigger payments_guard before insert or update on public.premium_payments for each row execute function public.payments_guard();

-- Comprovativos: o aluno só envia para a sua pasta; só a Direcção (e o próprio aluno) os vê.
insert into storage.buckets (id, name, public) values ('comprovativos','comprovativos', false) on conflict (id) do nothing;
create policy "aluno envia comprovativo" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovativos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver comprovativos" on storage.objects for select to authenticated
  using (bucket_id = 'comprovativos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_association_staff()));
