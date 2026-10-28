-- SIGF 2.0 - insere EXCLUSIVAMENTE 1000 cadastros SINTÉTICOS.
-- Execute no SQL Editor DEPOIS de schema.sql. Idempotente via matrícula única.
insert into public.servidores
(matricula,nome,cargo,setor,vinculo,horario,modelo_frequencia,situacao)
select
 'DEMO-' || lpad(g::text,5,'0'),
 'SERVIDOR FICTÍCIO ' || lpad(g::text,4,'0'),
 (array['ENFERMEIRO','TÉCNICO DE ENFERMAGEM','MÉDICO','ASSISTENTE ADMINISTRATIVO','AGENTE COMUNITÁRIO DE SAÚDE','FARMACÊUTICO','FISIOTERAPEUTA','RECEPCIONISTA','BIOMÉDICO','TÉCNICO EM RADIOLOGIA','ASSISTENTE SOCIAL','PSICÓLOGO'])[(g % 12)+1],
 'UNIDADE DEMONSTRAÇÃO ' || (array['NORTE','SUL','LESTE','OESTE','CENTRAL','RIO','PARQUE','JARDIM'])[(g % 8)+1],
 (array['EFETIVO','CONTRATO','TEMPORÁRIO'])[(g % 3)+1],
 '08h às 12h - 13h às 17h',
 case when g%11=0 then 'IV' when g%4=0 then 'II' else 'III' end,
 case when g%17=0 then 'Inativo' when g%19=0 then 'Afastado' else 'Ativo' end
from generate_series(1,1000) as g
on conflict (matricula) do nothing;
-- Verificação: select count(*) from public.servidores where matricula like 'DEMO-%';
