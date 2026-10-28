-- SIGF: indicadores globais para usuários administradores.
-- Executar uma vez no SQL Editor do Supabase.
create or replace function public.dashboard_resumo()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.eh_admin() then
    raise exception 'Acesso não autorizado ao dashboard' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total', (select count(*) from public.servidores),
    'ativos', (select count(*) from public.servidores where situacao = 'Ativo'),
    'afastados', (select count(*) from public.servidores where situacao = 'Afastado'),
    'inativos', (select count(*) from public.servidores where situacao = 'Inativo'),
    'setores', (select count(distinct setor) from public.servidores),
    'cargos', (select count(distinct cargo) from public.servidores),
    'por_setor', coalesce((
      select jsonb_agg(jsonb_build_object('nome', setor, 'quantidade', quantidade) order by quantidade desc, setor)
      from (select setor, count(*) as quantidade from public.servidores group by setor) v
    ), '[]'::jsonb),
    'por_cargo', coalesce((
      select jsonb_agg(jsonb_build_object('nome', cargo, 'quantidade', quantidade) order by quantidade desc, cargo)
      from (select cargo, count(*) as quantidade from public.servidores group by cargo) v
    ), '[]'::jsonb),
    'por_modelo', coalesce((
      select jsonb_agg(jsonb_build_object('nome', modelo_frequencia, 'quantidade', quantidade) order by modelo_frequencia)
      from (select modelo_frequencia, count(*) as quantidade from public.servidores group by modelo_frequencia) v
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.dashboard_resumo() from public;
revoke all on function public.dashboard_resumo() from anon;
grant execute on function public.dashboard_resumo() to authenticated;
