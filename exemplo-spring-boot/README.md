# Exemplo Spring Boot: CRUD de Produtos e Categorias

Mini projeto para ver, em código Java, as camadas do painel interativo: **Controller → Service → Repository → Banco de Dados**.

- Java 21, Spring Boot 3.3, Spring Data JPA, Bean Validation
- PostgreSQL 16 rodando em Docker
- Duas tabelas: `categoria` e `produto` (`produto.categoria_id` é FK para `categoria.id`)

## Onde está cada camada

```
src/main/java/com/exemplo/catalogo
├── controller/   recebe a requisição HTTP e devolve a resposta (sem regra de negócio)
├── service/      regras de negócio, validações e transações
├── repository/   acesso ao banco (interfaces Spring Data JPA)
├── entity/       classes mapeadas para as tabelas (@Entity)
└── dto/          objetos de entrada (Request) e saída (Response) da API
```

Fluxo de um `POST /produtos`:

1. `ProdutoController.criar` recebe o JSON, converte em `ProdutoRequest` e valida (`@Valid`).
2. `ProdutoService.criar` checa se o código já existe, busca a categoria e monta a entidade `Produto`.
3. `ProdutoRepository.save` grava no PostgreSQL.
4. O `Service` converte a entidade em `ProdutoResponse` e o `Controller` devolve `201 Created`.

### Pontos para estudar

| O que | Onde |
| --- | --- |
| Consulta derivada do nome do método, sem `@Query` (`findByCodigo`) | `ProdutoRepository` |
| Consulta SQL própria com `@Query(nativeQuery = true)` e JOIN, devolvendo `Produto` | `ProdutoRepository.buscarPorCategoriaEFaixaDePreco` |
| Relacionamento `@ManyToOne` com FK | `Produto.categoria` |
| Validação de entrada | `ProdutoRequest`, `CategoriaRequest` |
| Entidade nunca sai da API: o método estático `de(...)` converte entidade em DTO | `ProdutoResponse.de(...)`, usado também na busca da query nativa |
| Erros HTTP (404, 409, 400) com `ResponseStatusException` | `service/` |

## Pasta `sql/` (um "Flyway de mentira")

As tabelas **não** são criadas pelo Hibernate. Quem cria é o próprio Docker:

1. `docker-compose.yml` monta a pasta `sql/init` em `/docker-entrypoint-initdb.d` dentro do container.
2. Na **primeira vez** que o Postgres sobe com o volume vazio, a imagem executa todos os `.sql` dessa pasta, em ordem alfabética.
3. No `application.properties`, `spring.jpa.hibernate.ddl-auto=validate` faz o JPA apenas **conferir** se as tabelas existem e batem com as entidades. Se faltar tabela ou coluna, a aplicação não sobe e mostra o erro.

| Arquivo | Conteúdo |
| --- | --- |
| `sql/init/01-schema.sql` | `CREATE TABLE` de `categoria` e `produto`, com PK, UNIQUE e a FK `categoria_id` |
| `sql/init/02-dados-exemplo.sql` | `INSERT` de 3 categorias e 4 produtos |
| `sql/03-consultas.sql` | Consultas para estudo (não roda sozinho): `SELECT`, busca por código, o JOIN da `@Query` nativa e um `GROUP BY` |

Compare o `01-schema.sql` com `Produto.java` e `Categoria.java`: cada anotação (`@Column`, `@ManyToOne`, `unique = true`) corresponde a uma coluna ou constraint.

Diferença para o Flyway de verdade: o Flyway guarda um histórico e aplica só as migrações novas a cada subida da aplicação. Aqui os scripts rodam uma única vez, quando o banco nasce. Alterou um `.sql` de `sql/init`? Recrie o banco:

```powershell
docker compose down -v
docker compose up -d
```

O `-v` apaga o volume, e com ele todos os dados. Para testar o JPA criando as tabelas sozinho, troque `validate` por `update` em `application.properties` e remova a linha do volume `./sql/init` no `docker-compose.yml`.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/categorias` | Lista categorias |
| GET | `/categorias/{id}` | Busca por id |
| POST | `/categorias` | Cria |
| PUT | `/categorias/{id}` | Atualiza |
| DELETE | `/categorias/{id}` | Remove (409 se tiver produtos) |
| GET | `/produtos` | Lista produtos |
| GET | `/produtos/{id}` | Busca por id |
| GET | `/produtos/codigo/{codigo}` | Busca por código (`findByCodigo`) |
| GET | `/produtos/busca?categoria=&precoMin=&precoMax=` | Query nativa |
| POST | `/produtos` | Cria (precisa de `categoriaId` existente) |
| PUT | `/produtos/{id}` | Atualiza |
| DELETE | `/produtos/{id}` | Remove |

Exemplo de corpo para criar produto:

```json
{
  "codigo": "NOTE-001",
  "nome": "Notebook 14 polegadas",
  "preco": 3499.90,
  "categoriaId": 1
}
```

O arquivo `requests.http` tem todas as chamadas prontas.

## Instalação no Windows 10

Abra o **PowerShell** para os comandos abaixo. O `winget` já vem no Windows 10 atualizado (versão 1809 ou superior). Se o comando `winget` não for reconhecido, instale o "App Installer" pela Microsoft Store.

### 1. Java 21

Veja se já tem:

```powershell
java -version
```

Se aparecer `21.x.x`, pule esta etapa. Se não aparecer, ou aparecer outra versão:

```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

Feche e abra o PowerShell de novo e confirme com `java -version`.

Se mesmo assim mostrar a versão antiga, ajuste o `JAVA_HOME` (troque o caminho pela pasta onde o JDK foi instalado):

```powershell
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"
```

Feche e abra o PowerShell e rode `java -version` outra vez. Instalação manual alternativa: baixe o instalador `.msi` do JDK 21 em adoptium.net.

### 2. Docker Desktop

```powershell
winget install Docker.DockerDesktop
```

Reinicie o computador se pedido. Abra o **Docker Desktop**, aceite os termos e espere o ícone indicar que está rodando. Se ele pedir para ativar o WSL 2, aceite e siga o assistente.

Confirme:

```powershell
docker --version
docker compose version
```

### 3. Maven

Não precisa instalar: o projeto traz o Maven Wrapper (`mvnw.cmd`), que baixa o Maven sozinho na primeira execução.

### 4. IDE (opcional, recomendado)

IntelliJ IDEA Community:

```powershell
winget install JetBrains.IntelliJIDEA.Community
```

Abra a pasta `exemplo-spring-boot` pela IDE (File → Open). Ela reconhece o `pom.xml` e baixa as dependências.

## Rodando o projeto

Dentro da pasta `exemplo-spring-boot`:

**1. Subir o PostgreSQL**

```powershell
docker compose up -d
```

Cria o banco `catalogo` (usuário `postgres`, senha `postgres`, porta `5432`).

**2. Subir a aplicação**

```powershell
.\mvnw.cmd spring-boot:run
```

Na primeira vez demora alguns minutos para baixar dependências. Quando aparecer `Started CatalogoApplication`, a API está em `http://localhost:8080`.

As tabelas `categoria` e `produto` (com alguns dados de exemplo) já vêm prontas do `docker compose up`, pelos scripts de `sql/init`. Cada SQL executado aparece no console (`spring.jpa.show-sql=true`): acompanhe o log enquanto faz as chamadas para ver o Repository trabalhando.

**3. Parar tudo**

`Ctrl + C` no terminal da aplicação, depois:

```powershell
docker compose down
```

Para também apagar os dados do banco: `docker compose down -v`.

## Testando

Opção A: no IntelliJ, abra `requests.http` e clique no botão verde ao lado de cada chamada (no VS Code, use a extensão "REST Client").

Opção B: PowerShell (crie a categoria primeiro, o produto depende dela):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/categorias -ContentType "application/json" -Body '{"nome":"Eletrônicos","descricao":"Aparelhos eletrônicos"}'

Invoke-RestMethod -Method Post -Uri http://localhost:8080/produtos -ContentType "application/json" -Body '{"codigo":"NOTE-001","nome":"Notebook","preco":3499.90,"categoriaId":1}'

Invoke-RestMethod http://localhost:8080/produtos

Invoke-RestMethod http://localhost:8080/produtos/codigo/NOTE-001

Invoke-RestMethod "http://localhost:8080/produtos/busca?categoria=eletrônicos&precoMin=1000&precoMax=5000"
```

Opção C: Postman ou Insomnia, usando as rotas da tabela acima.

### Olhando o banco

```powershell
docker exec -it catalogo-postgres psql -U postgres -d catalogo -c "SELECT * FROM produto;"
```

## Problemas comuns

| Sintoma | Causa e solução |
| --- | --- |
| `Schema-validation: missing table` ou `missing column` | O banco foi criado antes dos scripts existirem ou com um script antigo. Rode `docker compose down -v` e `docker compose up -d`. |
| `Connection refused` ao subir a aplicação | O Postgres não está rodando. Rode `docker compose up -d` e confira com `docker ps`. |
| `port 5432 is already allocated` | Já existe um PostgreSQL local na porta 5432. Pare-o ou troque a porta em `docker-compose.yml` (`"5433:5432"`) e em `application.properties` (`localhost:5433`). |
| `Port 8080 was already in use` | Outro programa usa a porta. Adicione `server.port=8081` em `application.properties`. |
| `release version 21 not supported` / `invalid target release` | O Maven está usando um Java anterior ao 21. Confira `java -version` e `JAVA_HOME`. |
| `docker: error during connect` | O Docker Desktop não está aberto. Abra e espere iniciar. |
| `.\mvnw.cmd` não é reconhecido | Você não está na pasta `exemplo-spring-boot`. Use `cd` até ela. |

## Exercícios sugeridos

1. Adicione o campo `estoque` em `Produto` e propague para os DTOs.
2. Crie `findByCategoriaNome(String nome)` no `ProdutoRepository` (sem `@Query`) e exponha em um novo endpoint.
3. Crie uma segunda `@Query` nativa que retorne a quantidade de produtos por categoria.
4. Adicione uma coluna `estoque` no `01-schema.sql`, recrie o banco e veja a aplicação falhar no `validate` até a entidade ganhar o campo.
