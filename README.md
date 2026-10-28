# SIGF 2.0 — etapa 1

Aplicação de demonstração para gestão funcional de servidores fictícios. **Não usar com dados reais**.

## 1. Requisitos
Node.js >= 20.19 ou >= 22.12 (Vite 6 neste pacote requer Node 18+, mas sugerimos Node atualizado).

## 2. Rodar
```bash
npm install
cp .env.example .env.local
```
Configure `.env.local` com **Project URL** e **publishable key** (nunca a secret/service_role) do seu projeto Supabase. Depois:
```bash
npm run dev
```

## 3. Banco e primeiro login
1. Crie um projeto Supabase de teste.
2. Em **SQL Editor**, execute `supabase/schema.sql`.
3. Em **Authentication > Users**, adicione um usuário com e-mail e senha. Se preferir criar diretamente na interface, confirme o e-mail se solicitado.
4. No SQL Editor, execute:
```sql
update public.perfis
set papel = 'admin'
where id = (select id from auth.users where email = 'seu@email.com');
```
5. Acesse o app e faça login. Se já estava logado, atualize a página.

## 4. O que funciona
- Login / logout pelo Supabase Auth
- Política RLS: somente usuários com papel `admin` visualizam e modificam `servidores`
- CRUD: criar, listar com paginação, buscar, filtrar por situação, editar e excluir
- Dashboard de apresentação **com métricas parciais explicitadas**
- Área reservada para emissão de frequências

## 5. Ainda não implementado
- Gerador de PDF dos modelos II, III e IV
- Auditoria e histórico de emissões
- Importador do CSV de 1.000 servidores (será adaptado ao schema seguro)
- Dashboards globais

O banco desta etapa armazena apenas matrícula fictícia, nome, cargo, setor, vínculo, horário, modelo e situação. **CPF, RG e informações sensíveis não foram incluídos**.

## Estrutura
- `src/App.tsx`: telas e lógica inicial
- `src/style.css`: identidade visual responsiva
- `src/lib/supabase.ts`: conexão
- `supabase/schema.sql`: tabelas, trigger de perfis e RLS
- `.env.example`: exemplo de configuração
