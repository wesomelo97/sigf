-- SIGF 2.0 | Execute no SQL Editor de um PROJETO DE DEMONSTRAÇÃO NOVO.
create extension if not exists pgcrypto;

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  papel text not null default 'leitor' check (papel in ('admin','leitor')),
  criado_em timestamptz not null default now()
);

create or replace function public.criar_perfil_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis(id,nome,papel) values (new.id,coalesce(new.raw_user_meta_data ->> 'nome',new.email),'leitor');
  return new;
end; $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users for each row execute function public.criar_perfil_usuario();

create table if not exists public.servidores (
  id uuid primary key default gen_random_uuid(),
  matricula text not null unique,
  nome text not null,
  cargo text not null,
  setor text not null,
  vinculo text not null default 'Efetivo',
  horario text,
  modelo_frequencia text not null default 'III' check (modelo_frequencia in ('II','III','IV')),
  situacao text not null default 'Ativo' check (situacao in ('Ativo','Afastado','Inativo')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint nome_nao_vazio check (length(btrim(nome)) > 0)
);

create or replace function public.atualizar_timestamp()
returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em = now(); return new; end; $$;
drop trigger if exists atualizar_servidores on public.servidores;
create trigger atualizar_servidores before update on public.servidores for each row execute function public.atualizar_timestamp();

create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.perfis where id = (select auth.uid()) and papel = 'admin');
$$;

alter table public.perfis enable row level security;
alter table public.servidores enable row level security;

create policy "ver proprio perfil" on public.perfis for select to authenticated using (id = (select auth.uid()));
create policy "admin visualiza servidores" on public.servidores for select to authenticated using (public.eh_admin());
create policy "admin cria servidores" on public.servidores for insert to authenticated with check (public.eh_admin());
create policy "admin atualiza servidores" on public.servidores for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin exclui servidores" on public.servidores for delete to authenticated using (public.eh_admin());

-- Depois de criar sua conta em Authentication > Users, promova-a pelo SQL Editor:
-- update public.perfis set papel = 'admin' where id = (select id from auth.users where email = 'SEU_EMAIL_AQUI');
-- Não cole service_role/secret no React ou .env.local do frontend.
