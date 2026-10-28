# SIGF 2.0 — Sistema Integrado de Gestão de Frequências

Sistema web demonstrativo para gestão de cadastros funcionais e emissão de folhas de frequência em PDF.

> **Projeto de portfólio.** Todos os servidores e unidades apresentados na demonstração são fictícios. Não é um sistema oficial de órgão público e não deve ser utilizado com dados reais sem adequações e validações adicionais.

## Contexto

O projeto evolui uma solução administrativa desenvolvida anteriormente para um ambiente hospitalar, onde os registros eram mantidos em planilhas e as folhas de frequência eram preparadas com Word e mala direta. O SIGF 2.0 explora uma alternativa web centralizada, com autenticação, banco de dados online, filtros e geração de documentos.

## Funcionalidades

- Autenticação com Supabase Auth.
- Perfis **administrador** e **emissor**; o emissor acessa somente a emissão de frequências.
- CRUD de servidores demonstrativos, pesquisa, filtros e paginação para administradores.
- Emissão de PDFs individuais e em lote, com filtros por critérios funcionais.
- Três modelos de frequência: **II** (ECH/hora extra/plantão), **III** (vínculo normal) e **IV** (Mais Médicos).
- Definição de períodos de emissão, incluindo intervalos que atravessam meses.
- Dashboard com indicadores derivados do banco.
- Histórico de emissões e auditoria de alterações cadastrais.
- Base de demonstração com aproximadamente 1.000 registros sintéticos.

## Tecnologias

- **Frontend:** React, TypeScript e Vite.
- **Interface:** CSS e Lucide React.
- **Dados e autenticação:** Supabase (PostgreSQL, Auth e Row Level Security).
- **Documentos:** geração de PDF no frontend.
- **Hospedagem planejada:** Cloudflare Pages.

## Execução local

Requisitos: Node.js compatível com a versão do Vite declarada no `package.json`.

```bash
npm install
cp .env.example .env.local
```

Configure o `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUIR
```

Execute:

```bash
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
```

**Nunca** inclua `.env.local`, chaves secretas, planilhas originais ou dados funcionais reais no repositório.

## Banco de dados

Os scripts SQL ficam em `supabase/`. Para uma instalação nova, execute primeiro `schema.sql` e, na sequência, os scripts de implantação adicionais presentes no projeto, conforme suas dependências. Configure o primeiro administrador pelo painel do Supabase; não publique credenciais administrativas no repositório.

As políticas RLS devem ser revisadas antes de permitir uso por pessoas externas. A conta demonstrativa deve ter apenas as permissões de emissão definidas para o perfil `emissor`.

## Screenshots

As capturas de tela serão adicionadas em `docs/screenshots/`, incluindo login, dashboard, gestão de servidores, emissão e PDF gerado.

## Situação

**MVP demonstrativo funcional**, testado localmente. Não se apresenta como produto pronto para operação hospitalar ou emissão de documentos oficiais.

## Autoria

Desenvolvido por [Ewerton Melo](https://github.com/wesomelo97) como projeto de portfólio de desenvolvimento web e modernização de processos administrativos.
