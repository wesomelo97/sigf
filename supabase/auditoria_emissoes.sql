-- SIGF 2.0: execute uma unica vez no SQL Editor depois do schema.sql.
-- Somente registros demonstrativos; nao registre CPF, RG ou dados clinicos.

create table if not exists public.auditoria_servidores (
 id bigint generated always as identity primary key,
 ocorrido_em timestamptz not null default now(),
 usuario_id uuid,
 acao text not null check (acao in ('INSERT','UPDATE','DELETE')),
 servidor_id uuid,
 matricula text,
 nome text,
 alteracoes jsonb not null default '{}'::jsonb
);
create index if not exists auditoria_servidores_ocorrido_idx on public.auditoria_servidores (ocorrido_em desc);

-- Dados explicitamente limitados aos campos necessarios para auditoria funcional.
create or replace function public.registrar_auditoria_servidor()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
 antes jsonb;
 depois jsonb;
 mudancas jsonb := '{}'::jsonb;
 chave text;
 sid uuid;
 smatricula text;
 snome text;
begin
 if tg_op <> 'INSERT' then
  antes := jsonb_build_object('matricula',old.matricula,'nome',old.nome,'cargo',old.cargo,'setor',old.setor,'vinculo',old.vinculo,'horario',old.horario,'modelo_frequencia',old.modelo_frequencia,'situacao',old.situacao);
 end if;
 if tg_op <> 'DELETE' then
  depois := jsonb_build_object('matricula',new.matricula,'nome',new.nome,'cargo',new.cargo,'setor',new.setor,'vinculo',new.vinculo,'horario',new.horario,'modelo_frequencia',new.modelo_frequencia,'situacao',new.situacao);
 end if;
 if tg_op = 'UPDATE' then
  for chave in select jsonb_object_keys(depois) loop
   if antes -> chave is distinct from depois -> chave then
    mudancas := mudancas || jsonb_build_object(chave,jsonb_build_object('antes',antes -> chave,'depois',depois -> chave));
   end if;
  end loop;
  if mudancas = '{}'::jsonb then return new; end if;
 elsif tg_op = 'INSERT' then
  mudancas := jsonb_build_object('cadastro',depois);
 else
  mudancas := jsonb_build_object('cadastro',antes);
 end if;
 if tg_op = 'DELETE' then
   sid := old.id; smatricula := old.matricula; snome := old.nome;
 else
   sid := new.id; smatricula := new.matricula; snome := new.nome;
 end if;
 insert into public.auditoria_servidores(usuario_id,acao,servidor_id,matricula,nome,alteracoes)
 values (auth.uid(),tg_op,sid,smatricula,snome,mudancas);
 if tg_op = 'DELETE' then return old; end if;
 return new;
end; $$;
drop trigger if exists auditar_servidores on public.servidores;
create trigger auditar_servidores after insert or update or delete on public.servidores
for each row execute function public.registrar_auditoria_servidor();

create table if not exists public.emissoes_frequencia (
 id bigint generated always as identity primary key,
 emitido_em timestamptz not null default now(),
 usuario_id uuid not null references auth.users(id),
 inicio date not null,
 fim date not null,
 quantidade integer not null check (quantidade between 1 and 1000),
 filtros jsonb not null default '{}'::jsonb,
 arquivo_nome text not null,
 constraint periodo_valido check (fim >= inicio and fim - inicio < 31)
);
create index if not exists emissoes_frequencia_emitido_idx on public.emissoes_frequencia (emitido_em desc);

alter table public.auditoria_servidores enable row level security;
alter table public.emissoes_frequencia enable row level security;
-- Recriar de forma idempotente no caso de reexecucao.
drop policy if exists "admin consulta auditoria" on public.auditoria_servidores;
create policy "admin consulta auditoria" on public.auditoria_servidores for select to authenticated using (public.eh_admin());
drop policy if exists "admin consulta emissoes" on public.emissoes_frequencia;
create policy "admin consulta emissoes" on public.emissoes_frequencia for select to authenticated using (public.eh_admin());
drop policy if exists "admin registra emissoes" on public.emissoes_frequencia;
create policy "admin registra emissoes" on public.emissoes_frequencia for insert to authenticated
 with check (public.eh_admin() and usuario_id = (select auth.uid()));
-- Nao criar politicas de update/delete: trilha historica permanece imutavel para usuarios da aplicacao.
-- Evita acesso irrestrito via permissao a nivel de tabela.
revoke all on public.auditoria_servidores from anon, authenticated;
grant select on public.auditoria_servidores to authenticated;
revoke all on public.emissoes_frequencia from anon, authenticated;
grant select, insert on public.emissoes_frequencia to authenticated;
-- A trigger security definer grava no log mesmo sem INSERT ao cliente.
revoke all on function public.registrar_auditoria_servidor() from public, anon, authenticated;
