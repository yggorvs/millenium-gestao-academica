# Millenium — Gestão acadêmica

Primeira versão funcional do Projeto Integrador 2 de Ygor Morgado da Silva. A instituição parceira é a Millenium Tecnologia, escola de cursos profissionalizantes de Poá-SP.

## Problema e escopo

O levantamento identificou demora e retrabalho no lançamento de novos contratos a partir de cadastros em papel. A instituição também aceitou a proposta de registrar turmas, aulas, presenças, faltas e notas, com relatórios de acompanhamento.

A aplicação reúne:

- Cadastro e edição de alunos, contatos, documento, endereço e responsável.
- Consulta opcional de endereço por API de CEP.
- Cursos, carga horária, turmas, professor, horários e capacidade.
- Matrícula com validação de duplicidade e limite de vagas.
- Contrato fictício com uma cópia dos dados no momento da matrícula; editar o aluno não altera contratos emitidos.
- Encerramento de matrícula preservando histórico e contrato.
- Aulas, conteúdo, chamada completa e revisão de presenças e faltas.
- Avaliações, notas de 0 a 10 e médias aritméticas.
- Relatórios por período, turma e aluno; CSV e impressão com opção de salvar como PDF no navegador.
- Preparação de mensagens de WhatsApp e e-mail para revisão e envio manual.
- Exemplos fictícios opcionais e registro de atividades.

## Decisões de implementação

A conversa anterior sugeriu React + Vite, Express e PostgreSQL, sem confirmar esses produtos como restrições. Esta versão usa **React 19 + TypeScript + Vinext/Vite**, com rotas de API no servidor, **Cloudflare Workers** e banco SQL **D1 (SQLite)**, para uma publicação privada funcional. O esquema e as migrações são gerenciados por Drizzle. O versionamento usa Git.

Este sistema usa banco de dados no servidor; o armazenamento do navegador não é a fonte dos registros. A publicação inicial é privada para o proprietário. A identidade da sessão é fornecida pela hospedagem, e a API filtra todos os registros pelo identificador da conta. A interface ainda não representa perfis distintos de professor e coordenador.

### Relação com o texto norteador

| Exigência | Implementação nesta versão |
| --- | --- |
| Framework web | React com Vinext/Vite |
| Banco de dados | D1 SQL no servidor; esquema e migrações versionados |
| JavaScript | TypeScript compilado em JavaScript; formulários, filtros e exportação |
| Nuvem | Aplicação e banco publicados com acesso privado |
| API | API interna JSON e consulta opcional ViaCEP |
| Acessibilidade | HTML semântico, rótulos, teclado, foco visível, modal nativo, estados anunciados e indicadores textuais |
| Controle de versão | Git; fonte, esquema, migrações e testes no repositório |
| Testes | Testes de regras e integração da API com SQLite; checagem TypeScript e build |
| Análise de dados, opcional | Indicadores descritivos de presença e notas |

A acessibilidade ainda precisa ser validada com usuários e leitor de tela. Não foi feita inspeção visual em navegador neste ambiente, que não disponibilizou a ferramenta de controle de navegador exigida pelo fluxo de publicação.

## Regras pedagógicas adotadas

1. **Frequência:** presenças / (presenças + faltas) × 100. Só entram registros de chamadas salvas, dentro do período selecionado. Aulas sem chamada não equivalem a faltas.
2. **Média:** soma das notas lançadas / quantidade de notas lançadas. Nota zero entra no cálculo. Campo vazio indica pendência e não entra como zero.
3. O período inicial sugerido nos relatórios é de 30 dias, ajustável pelo usuário. O painel mostra o histórico total.
4. A chamada e o lançamento de notas consideram a data de matrícula e, se houver, a data de encerramento. Um aluno não é incluído em registros anteriores à sua matrícula.
5. A chamada exige presença ou falta para todos os alunos elegíveis. A revisão substitui os registros daquela aula em uma transação.
6. Não há aprovação, reprovação ou alerta de risco automático, pois os critérios não foram definidos.

## Como testar a primeira versão

1. Abra a aplicação com sua conta.
2. Em um sistema vazio, escolha **Carregar exemplos** para usar três alunos fictícios, um curso, uma turma, três aulas e uma avaliação. Os exemplos não são criados automaticamente.
3. Em **Aulas e chamadas**, conclua a chamada pendente.
4. Em **Avaliações e notas**, revise notas; teste zero e campo vazio.
5. Em **Relatórios**, escolha o período; compare frequência, faltas e médias. Exporte CSV ou use **Imprimir / PDF**, selecionando “Salvar como PDF” na janela do navegador.
6. Cadastre um novo aluno; crie uma matrícula e consulte o contrato demonstrativo. O documento não reproduz o contrato oficial da escola.

O botão de e-mail abre o aplicativo de e-mail do usuário. O de WhatsApp abre uma mensagem preparada. Nenhum envio automático é realizado.

## Desenvolvimento e validação

Requer Node.js 22.13 ou superior e o gerenciador de pacotes indicado pelo lockfile. A instalação foi feita pelo fluxo do projeto.

```sh
node --test tests/system.test.mjs
./node_modules/.bin/tsc --noEmit
npm run db:generate
npm run build
```

Os testes usam `node:sqlite`, o esquema SQL gerado e as rotas de API reais, empacotadas pelo esbuild disponível no Wrangler. Eles não acessam o banco publicado. As nove verificações cobrem cálculos, autenticação, origem da requisição, isolamento de contas, persistência, contratos, capacidade, chamada, notas, encerramento, dados demonstrativos e falha da consulta de CEP.

As migrações em `drizzle/` são somente de esquema. Os dados de demonstração são inseridos pelo fluxo explícito da aplicação. Migrações já aplicadas não devem ser editadas; mudanças posteriores exigem uma nova migração.

## Estrutura

- `app/school.tsx`: interface e fluxos de operação.
- `app/globals.css`: estilo, layout responsivo, foco e impressão.
- `app/api/school/route.ts`: API de leitura e gravação, validação e isolamento de dados.
- `app/api/cep/route.ts`: consulta de endereço com tempo limite e preenchimento manual como alternativa.
- `db/schema.ts`: entidades e relacionamentos.
- `drizzle/`: migrações SQL e metadados.
- `lib/rules.ts`: cálculos, elegibilidade e proteção da exportação CSV.
- `tests/system.test.mjs`: testes automatizados.
- `docs/VALIDACAO_COM_A_ESCOLA.md`: roteiro para registrar feedback real.

## Trabalho posterior

- Validar a solução com professores e coordenadores e registrar sugestões reais.
- Implementar acesso institucional compartilhado e permissões de professor/coordenador antes de uso multiusuário.
- Configurar provedor de envio de e-mail por API, credenciais no ambiente e acompanhamento de entrega, caso permaneça no escopo acordado.
- Substituir o contrato fictício por um modelo aprovado quando disponibilizado pela instituição.
- Definir políticas de retenção, rotina de backup e procedimentos para uso de dados reais.
- Realizar testes visuais, de acessibilidade e de uso com a escola.

O relatório acadêmico deve distinguir implementação, testes técnicos e validação externa; esta versão não comprova impacto nem participação da comunidade na etapa de avaliação.
