# Exemplo Angular: Front-End do Catálogo

Front-End em **Angular 21** (versão LTS mais recente) que consome a API do `exemplo-spring-boot`. Mostra a primeira camada do painel: o **Front-End** chamando o **Controller**.

- Uma tela para cada tarefa, cada uma com sua rota (veja a tabela abaixo)
- Busca de produto por código (usa `findByCodigo` da API)
- Busca por categoria e faixa de preço (usa a `@Query` nativa da API)
- Componentes separados em `.ts`, `.html` e `.scss`
- NgRx (Store + Effects) para as categorias

## Antes de começar

A API precisa estar rodando em `http://localhost:8080`. Siga o README de `exemplo-spring-boot` (Docker + `mvnw.cmd spring-boot:run`).

## Instalação no Windows 10

### Node.js

O Angular 21 exige Node.js 20.19 ou superior (recomendado: versão 22 LTS).

```powershell
node -v
```

Se não existir ou for mais antigo:

```powershell
winget install OpenJS.NodeJS.LTS
```

Feche e abra o PowerShell e confirme com `node -v` e `npm -v`.

Se o PowerShell bloquear scripts (`npm.ps1 cannot be loaded`), rode uma vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Dependências do projeto

Dentro da pasta `exemplo-angular`:

```powershell
npm install
```

## Rodando

```powershell
npm start
```

Abra `http://localhost:4200`.

Para parar: `Ctrl + C`.

## Como o Front-End fala com a API

O navegador chama `/api/...` no próprio servidor do Angular (`localhost:4200`). O arquivo `proxy.conf.json` repassa essas chamadas para `http://localhost:8080`, tirando o prefixo `/api`. Assim não é preciso configurar CORS na API.

```
Navegador → localhost:4200/api/produtos → (proxy) → localhost:8080/produtos
```

## Telas e rotas

| Rota | Tela | O que faz |
| --- | --- | --- |
| `/` | redireciona | vai para `/produtos` |
| `/produtos` | `ProdutosLista` | tela inicial: lista, filtra por nome, busca por código, remove |
| `/buscar` | `ProdutosBusca` | busca por categoria e faixa de preço (query nativa) |
| `/novo/produto` | `ProdutoNovo` | formulário de novo produto |
| `/editar/produto/1` | `ProdutoEditar` | edita o produto de id 1 (o número da URL é o id) |
| `/categorias` | `Categorias` | CRUD de categorias, com NgRx |
| qualquer outra | `NaoEncontrada` | página 404 |

## Onde está cada coisa

```
src/app
├── pages/         telas ligadas a uma rota ("componentes inteligentes")
├── components/    peças reutilizáveis, sem conhecer rota nem API ("componentes burros")
├── services/      chamadas HTTP (HttpClient), uma classe por recurso
├── models/        interfaces TypeScript, espelham os DTOs Request e Response da API
├── store/         NgRx: actions, reducer e effects das categorias
├── core/          interceptor de erros e serviço de notificação (toast)
├── app.routes.ts  rotas, carregadas sob demanda
└── app.config.ts  providers globais (router, HttpClient, interceptor, NgRx)
```

Cada componente é uma pasta com **três arquivos**:

```
produto-form/
├── produto-form.ts     lógica (classe TypeScript)
├── produto-form.html   o que aparece na tela
└── produto-form.scss   estilo, vale só para este componente
```

### Conceitos básicos, e onde ver cada um

| Conceito | Onde |
| --- | --- |
| Componente (`.ts` + `.html` + `.scss`) | qualquer pasta de `components/` e `pages/` |
| `@Input` (dado entrando no componente), via `input()` | `produto-tabela.ts` (`produtos`, `mostrarAcoes`), `produto-form.ts` (`produto`, `categorias`) |
| `@Output` (evento saindo do componente), via `output()` | `produto-tabela.ts` (`editar`, `remover`), `produto-form.ts` (`salvar`, `cancelar`) |
| Componente pai ouvindo o filho: `(editar)="editar($event)"` | `produtos-lista.html` |
| Event listening: `(click)`, `(input)`, `(keyup.enter)` | `produtos-lista.html` |
| Variável de template (`#campoCodigo`) | `produtos-lista.html` |
| `signal()` e `computed()` (estado reativo) | `produtos-lista.ts` (filtro por nome) |
| Listagem com `@for` e condição com `@if` | `produto-tabela.html` |
| Formulários reativos e validação | `produto-form.ts` e `produto-form.html` |
| Parâmetro de rota (`:id`) lido como `input()` | `produto-editar.ts` (`withComponentInputBinding` em `app.config.ts`) |
| Navegação por código com `Router` | `produto-novo.ts`, `produto-editar.ts` |
| Rotas com lazy loading (`loadComponent`) e página 404 | `app.routes.ts` |
| Serviço injetado com `inject()` | `services/` |
| Interceptor HTTP (trata erro em um lugar só) | `core/erro.interceptor.ts` |
| NgRx | `store/categorias/` (veja abaixo) |

### NgRx: como o fluxo funciona

O NgRx guarda o estado da aplicação em um lugar central (o *Store*) e só o altera por um caminho fixo. Aqui ele cuida das categorias, usadas em três telas (lista de categorias, novo produto e busca).

```
Tela --dispatch--> Action --> Reducer --> Store (novo estado) --> Tela lê com selectSignal
                      \
                       --> Effect (chama a API e dispara outra Action com o resultado)
```

- `categorias.actions.ts`: os eventos possíveis (`carregar`, `criar`, `criarSucesso`...).
- `categorias.reducer.ts`: função pura que, dado o estado e uma action, devolve o novo estado. O estado é `{ itens, carregando, carregado }`.
- `categorias.effects.ts`: efeitos colaterais, como chamar a API e mostrar o aviso de sucesso.
- Nas telas: `store.dispatch(...)` para pedir algo e `store.selectSignal(...)` para ler.

**Cache:** toda tela que precisa de categorias faz `dispatch(carregar)` ao abrir, mas o effect só chama a API se `carregado` ainda for `false`. Depois do primeiro carregamento, as outras telas reaproveitam o que já está no Store. Criar, editar e remover também atualizam o Store direto (`criarSucesso`, `atualizarSucesso`, `removerSucesso`), então não é preciso buscar a lista de novo. Para conferir: abra a aba Network (F12), passe por Categorias, Novo produto e Buscar por categoria, e veja que só existe uma chamada `GET /api/categorias`. Se o carregamento falhar, `carregado` continua `false` e a próxima tela tenta de novo.

### Quando o NgRx compensa (e quando não)

| Compensa | Não compensa |
| --- | --- |
| Vários componentes e telas leem e alteram o mesmo estado | O estado é usado em uma tela só |
| Fluxos com muitas etapas e efeitos encadeados (chamar API, depois outra ação) | CRUD simples, como os produtos deste projeto |
| Precisa depurar com o Redux DevTools e ver cada ação | A equipe é pequena e o projeto é curto |
| Equipe grande que precisa de um padrão único e previsível | Um service com `signal()` resolve com bem menos arquivos |

Este projeto usa NgRx nas categorias para ela ver o padrão. Os produtos usam service com signals, e dá para comparar a quantidade de código das duas formas. Para um projeto deste tamanho, o service com signals bastaria.

Os produtos usam apenas o `ProdutoService` com signals de propósito: dá para comparar as duas formas e ver quando o NgRx compensa.

## Paralelo com o Back-End

| Angular | Spring |
| --- | --- |
| `models/produto.ts` | `ProdutoRequest`, `ProdutoResponse` |
| `services/produto.service.ts` | consome `ProdutoController` |
| validators do formulário (`Validators.required`...) | `@NotBlank`, `@NotNull`, `@Size` nos DTOs |
| `erro.interceptor.ts` mostra a mensagem da API | `ResponseStatusException` (404, 409) e `@Valid` (400) |

## Testando um fluxo completo

1. Em **Categorias**, crie "Eletrônicos" (o banco já vem com algumas categorias de exemplo).
2. Em **Novo produto**, crie um produto escolhendo a categoria. Você volta para a lista.
3. Na lista, filtre pelo nome (filtra na hora) e busque pelo código (aperte Enter).
4. Clique em **Editar**: a URL vira `/editar/produto/1` e o formulário vem preenchido.
5. Em **Buscar por categoria**, escolha a categoria e uma faixa de preço.
6. Tente remover uma categoria que tem produtos: a API responde 409 e aparece um aviso vermelho.
7. Abra a aba Network do navegador (F12) e veja as chamadas `/api/...` e o JSON de cada resposta. Abra também uma URL inexistente, como `/qualquer-coisa`.

## Problemas comuns

| Sintoma | Causa e solução |
| --- | --- |
| Mensagem "Não foi possível falar com a API" | A API não está rodando em `localhost:8080`. Suba o Postgres e o Spring. |
| `npm install` falha com `ERESOLVE` | O projeto já traz `.npmrc` com `legacy-peer-deps=true`. Confirme que está na pasta certa. |
| `Port 4200 is already in use` | Rode `npm start -- --port 4300`. |
| Erro de versão do Node | Atualize o Node para 20.19+ (veja a seção de instalação). |

## Exercícios sugeridos

1. Crie a rota `/editar/categoria/:id`, no mesmo molde da edição de produto.
2. Transforme os produtos em NgRx também (`store/produtos/`), seguindo o molde das categorias.
3. Crie um pipe `preco` que formata em reais e use no lugar de `currency`.
4. Adicione um guard (`canDeactivate`) que pergunta antes de sair de um formulário preenchido.
5. Escreva um teste para o `produto-tabela` verificando que o botão Editar emite o id.
