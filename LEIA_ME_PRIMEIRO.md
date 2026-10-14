# Comece por aqui — Millenium / Projeto Integrador 2

Este ZIP contém o código-fonte completo da primeira versão publicada, incluindo arquivos da aplicação, componentes, estilos, APIs, esquema do banco, migrações, configurações, scripts, testes e documentação.

## Preparação no Windows, macOS ou Linux

1. Instale Node.js 22.13 ou superior (preferencialmente Node.js 24).
2. Instale o gerenciador de pacotes usado no projeto, pelo terminal:

```sh
npm install --global pnpm@11.25.0
```

3. Extraia o ZIP e abra a pasta `millenium-gestao-academica` no VS Code. No terminal, entre nessa pasta.
4. Instale as dependências:

```sh
pnpm install --frozen-lockfile
```

O pacote contém `pnpm-lock.yaml`. Use pnpm para preservar as versões registradas; o script `install:ci` do starter espera um lockfile npm e não deve ser usado nesta cópia.

## Prepare o banco local

Primeiro compile a aplicação para gerar a configuração local do banco:

```sh
pnpm run build
```

Depois aplique a migração inicial **uma única vez** neste banco:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fearless_spitfire.sql
```

O banco local começa vazio e é separado do banco publicado. Para começar novamente, faça isso em outra cópia do projeto, com seu próprio banco local. Não reaplique a migração inicial em um banco já criado.

## Execute o sistema

```sh
pnpm run dev
```

Abra o endereço indicado no terminal, normalmente `http://localhost:5173`.

A cópia limpa usa o perfil de desenvolvimento portátil. Para entrar na conta local simulada, abra no mesmo navegador:

`http://localhost:5173/signin-with-chatgpt?return_to=/`

Esse login é apenas de desenvolvimento, disponível no servidor local. A publicação privada utiliza a autenticação da hospedagem. Não há senha institucional nesta primeira versão.

Se escolher outra porta, use o mesmo endereço e porta no link de login.

## Explore com dados fictícios

Na página inicial, escolha **Carregar exemplos**. O botão só funciona quando o cadastro está vazio. Os exemplos ajudam a testar matrícula, contrato, chamada, notas e relatórios sem dados reais.

## Testes e compilação

```sh
pnpm run test
pnpm run typecheck
pnpm run build
```

Os nove testes automatizados da primeira versão passaram antes da publicação. A checagem de tipos e a compilação também passaram. O arquivo `tests/system.test.mjs` testa as rotas reais com SQLite em memória, sem acessar o banco publicado.

## Onde encontrar cada parte

- `app/`: interface, estilos e rotas de API.
- `db/`: esquema e acesso ao banco.
- `drizzle/`: migrações SQL e metadados.
- `lib/`: regras de negócio e utilitários.
- `tests/`: testes automatizados.
- `docs/`: roteiro de validação com a instituição.
- `components/`, `hooks/`, `vendor/`: componentes e recursos incluídos no starter.
- `build/` e `scripts/`: código de infraestrutura necessário para compilar e executar.
- `public/`: imagens vetoriais e favicon.
- `README.md`: escopo, decisões, regras e limitações.
- `ESTRUTURA_DE_ARQUIVOS.md`: lista completa de pastas e arquivos.
- `VERSAO_DO_PACOTE.json`: identificação da versão exportada e hashes dos arquivos.

## Estado do projeto

Esta é uma primeira versão funcional, não a conclusão da validação acadêmica. Ainda faltam testes visuais e com a escola, perfis de professor/coordenador e envio automático de e-mail. O contrato é fictício. WhatsApp e e-mail abrem mensagens para revisão e envio manual. Relatórios e contratos podem ser salvos como PDF pela impressão do navegador.

## Publicação existente e novas publicações

A versão original está em https://millenium-gestao-academica.wittytide65.chatgpt.site.

A configuração `.openai/hosting.json` identifica o Site original e sua vinculação lógica de banco. Ela não contém credenciais. O identificador do projeto é mantido para documentar a origem desta versão e não autoriza alterações na publicação. Para hospedar uma cópia independente, é necessário configurar um novo projeto e seu banco no provedor escolhido. Essa preparação não é necessária para execução local.

## Conteúdo do arquivo

As dependências (`node_modules`), a compilação (`dist`), caches, bancos em execução, dados pessoais, credenciais e a pasta interna do Git não fazem parte do ZIP. Eles não são código-fonte da aplicação. O banco inicial é reproduzido pela migração; dados fictícios podem ser inseridos pela própria interface.
