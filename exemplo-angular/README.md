# Exemplo Angular: Front-End do Catálogo

Front-End em **Angular 21** (versão LTS mais recente) que consome a API do `exemplo-spring-boot`. Mostra a primeira camada do painel: o **Front-End** chamando o **Controller**.

- Uma tela para cada tarefa, cada uma com sua rota (veja a tabela abaixo)
- Busca de produto por código (usa `findByCodigo` da API)
- Busca por categoria e faixa de preço (usa a `@Query` nativa da API)
- Componentes separados em `.ts`, `.html` e `.scss`

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

## Mini aula de Angular

Os exemplos abaixo são trechos reais deste projeto. Abra os arquivos citados ao lado para ver o código completo.

### 1. Componentes

Um **componente** é um pedaço da tela com sua própria lógica, aparência e estilo. A tela inteira é uma árvore de componentes: o `app-root` contém a barra de navegação (`app-navbar`), o aviso (`app-toast`) e, no meio, a página da rota atual. Uma página, por sua vez, contém componentes menores, como a tabela e o formulário.

Cada componente é uma pasta com três arquivos:

```
produto-tabela/
├── produto-tabela.ts     lógica: a classe TypeScript
├── produto-tabela.html   o que aparece na tela (template)
└── produto-tabela.scss   estilo, vale só para este componente
```

O `.ts` liga os três e define o nome da tag que o componente usa no HTML:

```ts
@Component({
  selector: 'app-produto-tabela',
  imports: [CurrencyPipe],
  templateUrl: './produto-tabela.html',
  styleUrl: './produto-tabela.scss',
})
export class ProdutoTabela { }
```

Para usar um componente dentro de outro, escreva a tag no HTML do pai e coloque a classe no `imports` do pai:

```html
<app-produto-tabela />
```

**Por que separar em componentes?** Cada peça faz uma coisa só e pode ser reaproveitada. A `ProdutoForm` serve tanto para criar quanto para editar produto, sem copiar código.

Neste projeto há dois tipos:

- **Páginas** (`pages/`): ligadas a uma rota. Buscam dados na API e decidem o que fazer.
- **Componentes** (`components/`): só recebem dados e avisam quando algo acontece. Não conhecem a API nem as rotas.

### 2. Template: `{{ }}`, `[ ]` e `( )`

O HTML do Angular tem três símbolos para ligar o template à classe:

| Símbolo | Nome | Direção | Exemplo |
| --- | --- | --- | --- |
| `{{ }}` | interpolação | classe vira texto na tela | `{{ produto.nome }}` |
| `[ ]` | property binding | classe vira valor de uma propriedade | `[produtos]="lista"` |
| `( )` | event binding | evento da tela chama método da classe | `(click)="remover(produto)"` |

Regra para lembrar: **colchetes mandam dado para dentro, parênteses recebem evento de fora**.

Exemplo de `( )` com função de clique, em `produto-tabela.html`:

```html
<button type="button" (click)="editar.emit(produto.id)">Editar</button>
```

Ao clicar, o Angular executa a expressão entre aspas. Outros eventos funcionam do mesmo jeito:

```html
<input (input)="filtrar($event)" />
<input #campoCodigo (keyup.enter)="buscarPorCodigo(campoCodigo.value)" />
```

- `(input)` dispara a cada letra digitada. `$event` é o evento do navegador, e dele se tira o texto digitado.
- `(keyup.enter)` dispara só quando a tecla Enter é solta.
- `#campoCodigo` cria uma variável de template: uma referência ao próprio `<input>`, usada no mesmo HTML como `campoCodigo.value`.

Exemplo de `[ ]` mudando a aparência conforme a classe, em `produto-form.html`:

```html
<input formControlName="codigo" [class.invalido]="invalido('codigo')" />
```

A classe CSS `invalido` só é aplicada quando `invalido('codigo')` devolve `true`.

Duas construções do template também aparecem o tempo todo:

```html
@if (produtos().length === 0) {
  <p>Nenhum produto encontrado.</p>
} @else {
  @for (produto of produtos(); track produto.id) {
    <tr><td>{{ produto.nome }}</td></tr>
  }
}
```

`@if` mostra ou esconde um trecho. `@for` repete um trecho para cada item da lista. O `track` diz qual campo identifica cada item (aqui, o `id`).

### 3. Comunicação entre componentes: `input` e `output`

Um componente filho não busca dados sozinho. Ele **recebe** dados do pai e **avisa** o pai quando algo acontece.

```
        PAI (página)
         │      ▲
 [dados] │      │ (evento)
  input  ▼      │  output
        FILHO (componente)
```

**`input()`: o pai manda um dado para o filho.** No `.ts` do filho:

```ts
export class ProdutoTabela {
  readonly produtos = input.required<ProdutoBusca[]>();
  readonly mostrarAcoes = input(true);
}
```

- `input.required<...>()`: o pai é obrigado a informar.
- `input(true)`: opcional, com valor padrão `true`.
- No HTML do filho, o valor é lido chamando como função: `produtos()`.

No HTML do pai, os dados vão pelos **colchetes**:

```html
<app-produto-tabela [produtos]="produtosFiltrados()" [mostrarAcoes]="false" />
```

**`output()`: o filho avisa o pai.** No `.ts` do filho:

```ts
export class ProdutoTabela {
  readonly editar = output<number>();
  readonly remover = output<ProdutoBusca>();
}
```

O `<number>` é o tipo do dado enviado junto com o aviso. No HTML do filho, o aviso sai com `.emit(...)`:

```html
<button (click)="editar.emit(produto.id)">Editar</button>
```

No HTML do pai, o aviso é ouvido pelos **parênteses**, e `$event` é o dado enviado:

```html
<app-produto-tabela
  [produtos]="produtosFiltrados()"
  (editar)="editar($event)"
  (remover)="remover($event)"
/>
```

Quando o usuário clica em Editar, o fluxo é:

1. O botão do filho chama `editar.emit(produto.id)`.
2. O pai estava ouvindo `(editar)`, então chama o próprio método `editar($event)`, com o id.
3. O método do pai navega para `/editar/produto/<id>`.

O filho **não sabe** o que o pai faz com o aviso. Isso permite usar a mesma tabela em telas diferentes: na lista os botões aparecem (`[mostrarAcoes]="true"`) e na busca por categoria não.

O mesmo vale para o formulário:

```html
<app-produto-form
  [categorias]="categorias()"
  textoBotao="Criar"
  (salvar)="salvar($event)"
  (cancelar)="cancelar()"
/>
```

Dados entram por `[ ]` (`categorias`, `textoBotao`) e eventos saem por `( )` (`salvar`, `cancelar`).

### 4. Formulários

Este projeto usa **formulários reativos**: o formulário é descrito na classe TypeScript, e o HTML só se liga a ele. Em `produto-form.ts`:

```ts
protected readonly form = this.fb.nonNullable.group({
  codigo: ['', [Validators.required, Validators.maxLength(30)]],
  nome: ['', [Validators.required, Validators.maxLength(120)]],
  preco: [0, [Validators.required, Validators.min(0.01)]],
  categoriaId: [0, [Validators.required, Validators.min(1)]],
});
```

Cada campo tem um valor inicial e uma lista de validações. Elas espelham as anotações do Back-End (`@NotBlank`, `@Size`, `@DecimalMin`).

No HTML, três ligações:

```html
<form [formGroup]="form" (ngSubmit)="enviar()">
  <input formControlName="codigo" />
  <button type="submit">Salvar</button>
</form>
```

- `[formGroup]="form"`: liga o `<form>` ao grupo da classe.
- `formControlName="codigo"`: liga o `<input>` ao campo `codigo` do grupo.
- `(ngSubmit)="enviar()"`: ao enviar o formulário (botão ou Enter), chama o método.

O método que trata o envio:

```ts
protected enviar(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.salvar.emit(this.form.getRawValue());
}
```

Se houver erro de validação, `markAllAsTouched()` marca todos os campos como "tocados", e as mensagens de erro aparecem. Se estiver tudo certo, o formulário **não chama a API**: ele emite o valor pelo `output` `salvar`, e a página decide o que fazer com ele. Veja como o formulário se comunica com o pai pelo mesmo mecanismo da seção anterior.

### 5. Service

**Service** é uma classe que concentra uma tarefa e pode ser usada por vários componentes. Aqui, cada service conversa com um recurso da API. Em `produto.service.ts`:

```ts
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/produtos';

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.url);
  }

  criar(request: ProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(this.url, request);
  }
}
```

- `@Injectable({ providedIn: 'root' })`: o Angular cria uma única instância e a entrega a quem pedir.
- `inject(HttpClient)`: pede ao Angular a ferramenta para fazer chamadas HTTP.
- Os métodos espelham os endpoints do Back-End (`GET /produtos`, `POST /produtos`).

Para usar o service numa página, peça com `inject` e chame o método:

```ts
export class ProdutosLista implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  protected readonly produtos = signal<Produto[]>([]);

  ngOnInit(): void {
    this.produtoService.listar().subscribe({
      next: (lista) => this.produtos.set(lista),
      error: () => this.produtos.set([]),
    });
  }
}
```

- `ngOnInit` roda uma vez, quando a página aparece. É onde se buscam os dados iniciais.
- A chamada HTTP só acontece quando alguém faz `subscribe`. Sem o `subscribe`, nada é enviado.
- `next` recebe a resposta; `error` recebe a falha.
- `signal` guarda o valor que a tela mostra. Quando o `set` é chamado, o Angular atualiza a tela sozinho. No HTML, o valor é lido como função: `produtos()`.

A divisão de responsabilidades fica assim:

| Quem | Faz o quê |
| --- | --- |
| Service | fala com a API |
| Página | chama o service, guarda o resultado e decide para onde ir depois |
| Componente | mostra dados e avisa eventos |

Fluxo da tela até o banco, em um clique de "Criar":

```
ProdutoForm → (salvar) → ProdutoNovo → ProdutoService → HTTP → Controller → Service → Repository → banco
```

### 6. Rotas (Router)

A **rota** liga uma URL a um componente. Em um site Angular existe uma única página HTML, e o Router troca o componente exibido conforme o endereço, sem recarregar a página. As rotas ficam em `app.routes.ts`:

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'produtos' },
  { path: 'produtos', loadComponent: () => import('./pages/produtos-lista/produtos-lista').then((m) => m.ProdutosLista) },
  { path: 'novo/produto', loadComponent: () => import('./pages/produto-novo/produto-novo').then((m) => m.ProdutoNovo) },
  { path: 'editar/produto/:id', loadComponent: () => import('./pages/produto-editar/produto-editar').then((m) => m.ProdutoEditar) },
  { path: '**', loadComponent: () => import('./pages/nao-encontrada/nao-encontrada').then((m) => m.NaoEncontrada) },
];
```

Peça por peça:

- `path`: o trecho da URL, depois de `localhost:4200/`.
- `redirectTo`: quem abre `/` é levado a `/produtos`.
- `loadComponent`: qual componente mostrar. O formato com `import(...)` é o *lazy loading*: o código da página só é baixado quando alguém entra nela.
- `:id`: um **parâmetro**. A URL `/editar/produto/1` tem `id = 1`.
- `**`: qualquer URL que não casou com as anteriores. Serve de página 404. Precisa ser a **última**, porque o Router usa a primeira rota que casa.

**Onde a página aparece:** no `app.html`, a tag `<router-outlet />` marca o lugar. O componente da rota atual é desenhado ali, enquanto a barra de navegação fica sempre visível.

```html
<app-navbar />
<main>
  <router-outlet />
</main>
```

**Navegar com link:** use `routerLink` no lugar de `href`. Com `href` a página inteira recarregaria.

```html
<a routerLink="/produtos" routerLinkActive="ativo">Produtos</a>
```

O `routerLinkActive` adiciona a classe `ativo` ao link da rota atual, e é isso que destaca a aba selecionada.

**Navegar pelo código:** injete o `Router` e chame `navigate`, por exemplo depois de salvar:

```ts
private readonly router = inject(Router);

this.router.navigate(['/produtos']);
this.router.navigate(['/editar/produto', id]);
```

**Ler o parâmetro da URL:** em `/editar/produto/:id`, a página recebe o `id` como `input`, o mesmo mecanismo da seção 3:

```ts
export class ProdutoEditar {
  readonly id = input.required<string>();
}
```

Isso funciona porque, em `app.config.ts`, o router foi configurado com `withComponentInputBinding()`. O parâmetro chega como texto, por isso o código usa `Number(this.id())` antes de chamar a API.

**Resumo das rotas deste projeto:**

| URL | Componente | Observação |
| --- | --- | --- |
| `/` | redireciona | vai para `/produtos` |
| `/produtos` | `ProdutosLista` | tela inicial |
| `/novo/produto` | `ProdutoNovo` | formulário vazio |
| `/editar/produto/1` | `ProdutoEditar` | o `1` é o `:id` |
| `/qualquer-coisa` | `NaoEncontrada` | rota `**` |

### Juntando tudo: editar um produto

1. Na lista (`ProdutosLista`), a tabela (`ProdutoTabela`) mostra os produtos recebidos por `[produtos]`.
2. O clique no botão **Editar** faz `editar.emit(produto.id)`.
3. A página ouve `(editar)` e chama `router.navigate(['/editar/produto', id])`.
4. A URL vira `/editar/produto/1`, e o Router mostra `ProdutoEditar`, que recebe `id` como `input`.
5. `ProdutoEditar` chama `ProdutoService.buscarPorId` e guarda o resultado em um `signal`.
6. O `ProdutoForm` recebe o produto por `[produto]` e preenche os campos.
7. Ao salvar, o formulário valida e emite `(salvar)`.
8. A página chama `ProdutoService.atualizar`, e depois `router.navigate(['/produtos'])` volta para a lista.

Tente seguir esse caminho com o código aberto e o F12 na aba Network.

## Telas e rotas

| Rota | Tela | O que faz |
| --- | --- | --- |
| `/` | redireciona | vai para `/produtos` |
| `/produtos` | `ProdutosLista` | tela inicial: lista, filtra por nome, busca por código, remove |
| `/buscar` | `ProdutosBusca` | busca por categoria e faixa de preço (query nativa) |
| `/novo/produto` | `ProdutoNovo` | formulário de novo produto |
| `/editar/produto/1` | `ProdutoEditar` | edita o produto de id 1 (o número da URL é o id) |
| `/categorias` | `Categorias` | CRUD de categorias |
| qualquer outra | `NaoEncontrada` | página 404 |

## Onde está cada coisa

```
src/app
├── pages/         telas ligadas a uma rota ("componentes inteligentes")
├── components/    peças reutilizáveis, sem conhecer rota nem API ("componentes burros")
├── services/      chamadas HTTP (HttpClient), uma classe por recurso
├── models/        interfaces TypeScript, espelham os DTOs Request e Response da API
├── core/          interceptor de erros e serviço de notificação (toast)
├── app.routes.ts  rotas, carregadas sob demanda
└── app.config.ts  providers globais (router, HttpClient, interceptor)
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
2. Crie um pipe `preco` que formata em reais e use no lugar de `currency`.
3. Adicione um guard (`canDeactivate`) que pergunta antes de sair de um formulário preenchido.
4. Escreva um teste para o `produto-tabela` verificando que o botão Editar emite o id.
