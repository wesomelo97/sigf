# SIGF 2.0 — Etapa 2: emissão de frequências

## Atualização do projeto existente

1. Faça uma cópia da sua pasta atual `sigf-2`.
2. Extraia o ZIP **de atualização** na raiz da pasta `sigf-2`, permitindo substituir apenas os arquivos incluídos. NÃO apague `.env.local`.
3. No terminal, dentro de `sigf-2`, rode:

```bash
npm install
npm run dev
```

4. No Supabase > SQL Editor, rode `supabase/seed_demo.sql` uma única vez. Pode repetir se necessário: as matrículas sintéticas usam `on conflict do nothing`.
5. Entre no sistema e acesse **Frequências**. Escolha o período, selecione filtros e clique em **Gerar PDF**.

## Notas

- **Não execute `schema.sql` novamente** no projeto existente: as políticas da etapa 1 já estão criadas.
- Banco original não é copiado nem enviado para a web.
- Valores fictícios de nome/matrícula são explicitamente marcados DEMO; CPF não é coletado nesta versão.
- Todos os três modelos preservam cabeçalho funcional, estrutura diária e campos de assinatura, mas são uma **recriação demonstrativa**, não cópias tipográficas exatas dos documentos Word.
- A folha é gerada para 1 a 31 dias, com fins de semana assinalados automaticamente. A emissão considera o modelo definido no cadastro de cada servidor.
- Para 1.000 servidores, o PDF pode ser grande e demorar no navegador; teste primeiro com um único registro e depois com filtros menores.
- Limite da interface: até 1.000 servidores por arquivo; consulta paginada em lotes de 500.

## Testes recomendados

1. Gerar um PDF de 1 servidor modelo III;
2. Gerar um PDF modelo II e conferir os blocos lado a lado;
3. Gerar um PDF modelo IV e conferir as 3 assinaturas;
4. Gerar 10 registros filtrando por cargo/setor;
5. Testar o período entre meses (por exemplo, 16/09 a 15/10), conferindo fins de semana.

Não publique o arquivo `.env.local` no GitHub.
