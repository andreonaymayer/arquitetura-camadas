(() => {
  const { clone } = window.Lab;
  const [FRONT, CONTROLLER, SERVICE, REPOSITORY, DATABASE] = [0, 1, 2, 3, 4];

  const json = value => JSON.stringify(value, null, 2);

  const attachVars = (steps, list) => list.forEach((vars, i) => {
    if (vars) steps[i].vars = vars;
  });

  const request = (method, path, body) =>
    `${method} ${path}\nServidor: http://localhost:8080${body ? `\n\nCorpo da requisição (application/json)\n${json(body)}` : ''}`;

  const response = (status, body) =>
    `Resposta do servidor\nCódigo: ${status}${body ? `\n\nCorpo da resposta\n${json(body)}` : '\n\nCorpo da resposta\n(vazio)'}`;

  const serviceCode = body =>
    `@Service\nclass PetService {\n  private final PetRepository repositorio;\n\n  ${body.replace(/\n/g, '\n  ')}\n}`;

  const controllerCode = (route, method) =>
`@RestController
@RequestMapping("/pets")
class PetController {
  private final PetService servico;

  ${route}
  ${method}
  }
}`;

  const buildPost = (pets, nextId, { name, species }) => {
    const trimmed = name.trim();
    const dto = { nome: trimmed, especie: species };
    const reason = trimmed.length === 0 ? 'O nome é obrigatório' : trimmed.length > 30 ? 'O nome deve ter até 30 caracteres' : null;

    const steps = [
      {
        at: FRONT, kind: 'req', label: 'POST /pets',
        title: 'O Front-End monta e envia a requisição',
        text: `A pessoa preencheu o formulário (nome "${trimmed || '(vazio)'}", espécie "${species}") e clicou em Enviar. O navegador transforma isso em uma requisição HTTP POST com os dados em formato JSON e manda para o servidor.`,
        code: request('POST', '/pets', dto)
      },
      {
        at: CONTROLLER, kind: 'req', label: 'POST /pets',
        title: 'O Controller recebe a requisição',
        text: 'O Spring olha o método (POST) e o caminho (/pets) e encontra o método do Controller que atende essa rota. O Controller não toma decisões: ele só recebe o JSON e repassa o trabalho para o Service.',
        code: controllerCode('@PostMapping', 'ResponseEntity<Pet> criar(\n      @RequestBody PetDto dto) {\n\x01    Pet pet = servico.criar(dto);\n    return ResponseEntity\n      .status(201)\n      .body(pet);')
      }
    ];

    if (reason) {
      steps.push(
        {
          at: SERVICE, kind: 'err', label: 'dados inválidos', skipped: [REPOSITORY, DATABASE],
          title: 'O Service valida os dados… e reprova',
          text: `Aqui entram as regras de negócio. ${reason}, então o Service lança um ResponseStatusException com o status 400. Repare: a execução para ali mesmo — o Repository e o Banco nem são chamados, porque não faz sentido salvar um dado inválido.`,
          code: serviceCode(`Pet criar(PetDto dto) {\n\x02  boolean nomeVazio = dto.nome().isBlank();\n${trimmed.length === 0 ? '\x02' : ''}  if (nomeVazio) {        // ${trimmed.length === 0 ? 'FALHOU' : 'OK'}\n${trimmed.length === 0 ? '\x01' : ''}    throw new ResponseStatusException(\n${trimmed.length === 0 ? '\x01' : ''}      HttpStatus.BAD_REQUEST,\n${trimmed.length === 0 ? '\x01' : ''}      "O nome é obrigatório");\n  }\n\n${trimmed.length > 30 ? '\x02' : ''}  boolean nomeGrande = dto.nome().length() > 30;\n${trimmed.length > 30 ? '\x02' : ''}  if (nomeGrande) {    // ${trimmed.length > 30 ? 'FALHOU' : 'OK'}\n${trimmed.length > 30 ? '\x01' : ''}    throw new ResponseStatusException(\n${trimmed.length > 30 ? '\x01' : ''}      HttpStatus.BAD_REQUEST,\n${trimmed.length > 30 ? '\x01' : ''}      "Nome muito longo");\n  }\n\n  Pet pet = new Pet(\n    dto.nome(), dto.especie());  // id ainda null\n  Pet petSalvo = repositorio.save(pet);\n  return petSalvo;\n}`)
        },
        {
          at: CONTROLLER, kind: 'err', label: '400 Bad Request', skipped: [REPOSITORY, DATABASE],
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Spring converte o erro em um status HTTP',
          text: 'Quando o Service lança um ResponseStatusException, o próprio Spring captura o erro e monta a resposta com o status que veio nele: aqui, 400 Bad Request, que significa "a requisição está errada, corrija e tente de novo". O Controller não precisa escrever nada para isso.',
          code: `\x01// o Controller não escreve código para o erro:\n\x01// o Spring captura o ResponseStatusException\n\x01// e responde com o status que veio nele\n\n// resposta: 400 Bad Request`
        },
        {
          at: FRONT, kind: 'err', label: '400', skipped: [REPOSITORY, DATABASE],
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Front-End mostra o erro',
          text: `A resposta chega de volta ao navegador com a mensagem "${reason}". Nenhum dado foi gravado no banco.`,
          code: response('400 Bad Request', { status: 400, erro: 'Bad Request', mensagem: reason })
        }
      );
      attachVars(steps, [
        null,
        [['dto', `PetDto(nome="${trimmed}", especie="${species}")`]],
        [['dto.nome()', `"${trimmed}"`], ['nomeVazio', String(trimmed.length === 0)], ['dto.nome().length()', String(trimmed.length)], ['exceção', `ResponseStatusException(BAD_REQUEST, "${reason}")`]],
        [['status', '400 Bad Request']],
        null
      ]);
      return { steps, final: { pets, nextId }, view: 'site', loading: 'Salvando pet…', result: { banner: { tone: 'err', text: `Erro 400: ${reason}.` }, pets: null } };
    }

    const created = { id: nextId, name: trimmed, species };
    const after = [...clone(pets), created];

    steps.push(
      {
        at: SERVICE, kind: 'req', label: 'validar',
        title: 'O Service valida os dados',
        text: 'Aqui moram as regras de negócio: o nome não pode estar vazio nem ser muito longo. Está tudo certo, então o Service cria o objeto Pet e pede ao Repository para guardá-lo.',
        code: serviceCode(`Pet criar(PetDto dto) {\n\x02  boolean nomeVazio = dto.nome().isBlank();\n  if (nomeVazio) {        // OK\n    throw new ResponseStatusException(\n      HttpStatus.BAD_REQUEST,\n      "O nome é obrigatório");\n  }\n\n\x02  boolean nomeGrande = dto.nome().length() > 30;\n  if (nomeGrande) {    // OK\n    throw new ResponseStatusException(\n      HttpStatus.BAD_REQUEST,\n      "Nome muito longo");\n  }\n\n\x02  Pet pet = new Pet(\n\x03    dto.nome(), dto.especie());  // id ainda null\n\x01  Pet petSalvo = repositorio.save(pet);\n  return petSalvo;\n}`)
      },
      {
        at: REPOSITORY, kind: 'req', label: 'save(pet)',
        title: 'O Repository executa save()',
        text: 'O Repository é uma interface do Spring Data JPA. Você não escreve o SQL: ao chamar save(), o JPA gera o comando INSERT sozinho. Repare que o Pet chega aqui com o id vazio (null): o id não é enviado no INSERT, porque quem gera esse número é o banco (auto incremento). O método save() devolve o mesmo Pet, já com o id preenchido.',
        code: `interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n// o Pet chega sem id:\n// Pet(id=null, nome=\"${trimmed}\", especie=\"${species}\")\n\n\x01Pet petSalvo = repositorio.save(pet);\n\n// gera: INSERT INTO pets (nome, especie)\n//       VALUES ('${trimmed}', '${species}')\n// o id fica de fora: o banco gera\n\n// retorna o Pet com o id gerado:\n// Pet(id=${nextId}, nome=\"${trimmed}\", especie=\"${species}\")`
      },
      {
        at: DATABASE, kind: 'req', label: 'INSERT',
        db: { pets: after, hl: { type: 'insert', ids: [created.id] } },
        title: 'O Banco insere o registro',
        text: `O banco recebe o INSERT, grava a nova linha e gera o ID automaticamente (aqui, ${created.id}): o INSERT não trouxe id nenhum, o banco escolheu o próximo número da sequência. Olhe a tabela: o novo pet apareceu!`,
        code: `\x01INSERT INTO pets (nome, especie)\n\x01VALUES ('${trimmed}', '${species}');\n\n→ 1 linha inserida\n→ id gerado pelo banco: ${created.id}`
      },
      {
        at: REPOSITORY, kind: 'res', label: `Pet #${created.id}`,
        title: 'O Banco devolve o resultado ao Repository',
        text: `Agora a resposta faz o caminho de volta. O banco devolve o id que acabou de gerar, e o Repository preenche o Pet (que estava com id null) com o id ${created.id} e o retorna.`,
        code: `\x01Pet petSalvo = repositorio.save(pet);\n\n// antes: Pet(id=null, ...)\n\x01// agora: Pet(id=${created.id}, nome="${trimmed}", especie="${species}")`
      },
      {
        at: SERVICE, kind: 'res', label: `Pet #${created.id}`,
        title: 'O Service devolve o Pet ao Controller',
        text: 'O Service não tem mais nada a fazer: retorna o Pet salvo. Ele continua sem saber nada sobre HTTP ou status code — isso é papel do Controller.',
        code: serviceCode(`Pet criar(PetDto dto) {\n  boolean nomeVazio = dto.nome().isBlank();\n  if (nomeVazio) {        // OK\n    throw new ResponseStatusException(\n      HttpStatus.BAD_REQUEST,\n      "O nome é obrigatório");\n  }\n\n  boolean nomeGrande = dto.nome().length() > 30;\n  if (nomeGrande) {    // OK\n    throw new ResponseStatusException(\n      HttpStatus.BAD_REQUEST,\n      "Nome muito longo");\n  }\n\n  Pet pet = new Pet(\n    dto.nome(), dto.especie());  // id ainda null\n  Pet petSalvo = repositorio.save(pet);\n  // voltou: Pet(id=${created.id},\n  //   nome="${trimmed}", especie="${species}")\n\x01  return petSalvo;\n}`)
      },
      {
        at: CONTROLLER, kind: 'res', label: '201 Created',
        badge: { text: '201 Created', tone: 'ok' },
        title: 'O Controller escolhe o status 201 Created',
        text: 'Como um recurso novo foi criado, o status correto é 201 Created (e não um simples 200). O Controller empacota o Pet e o status em uma ResponseEntity.',
        code: controllerCode('@PostMapping', 'ResponseEntity<Pet> criar(\n      @RequestBody PetDto dto) {\n    Pet pet = servico.criar(dto);\n\x01    return ResponseEntity\n\x01      .status(201)\n\x01      .body(pet);') + '\n\n// resposta: 201 Created'
      },
      {
        at: FRONT, kind: 'res', label: '201',
        badge: { text: '201 Created', tone: 'ok' },
        title: 'O Front-End recebe a resposta',
        text: 'Ciclo completo! O navegador recebe o 201 e o JSON do pet criado, e a interface pode mostrar "Pet cadastrado com sucesso".',
        code: response('201 Created', { id: created.id, nome: created.name, especie: created.species })
      }
    );
    const petStr = `Pet(id=${created.id}, nome="${trimmed}", especie="${species}")`;
    const dtoStr = `PetDto(nome="${trimmed}", especie="${species}")`;
    attachVars(steps, [
      null,
      [['servico', 'PetService'], ['dto', dtoStr]],
      [['dto', dtoStr], ['nomeVazio', 'false'], ['dto.nome().length()', String(trimmed.length)]],
      [['pet', `Pet(id=null, nome="${trimmed}", especie="${species}")`]],
      [['linhas inseridas', '1'], ['id gerado pelo banco', String(created.id)]],
      [['petSalvo', petStr]],
      [['petSalvo', petStr]],
      [['pet', petStr], ['status', '201 Created'], ['corpo', 'pet']],
      null
    ]);
    return { steps, final: { pets: after, nextId: nextId + 1 }, view: 'site', loading: 'Salvando pet…', result: { banner: { tone: 'ok', text: `Pet cadastrado com sucesso! ${trimmed} foi adicionado.` }, pets: after, highlight: created.id } };
  };

  const buildGet = (pets, nextId) => {
    const list = clone(pets);
    const result = {
      final: { pets, nextId },
      view: 'site',
      loading: 'Carregando pets…',
      result: { banner: null, pets: list },
      steps: [
        {
          at: FRONT, kind: 'req', label: 'GET /pets',
          title: 'O Front-End pede a lista de pets',
          text: 'A pessoa clicou em "Carregar site" e a página precisa dos pets. Um GET não envia dados no corpo: ele só pede para ler informações. Enquanto espera, a tela fica carregando.',
          code: request('GET', '/pets')
        },
        {
          at: CONTROLLER, kind: 'req', label: 'GET /pets',
          title: 'O Controller recebe a requisição',
          text: 'A rota GET /pets é encaminhada para o método listar(). Como não há nada a validar, o Controller apenas pede os dados ao Service.',
          code: controllerCode('@GetMapping', 'ResponseEntity<List<Pet>> listar() {\n\x01    List<Pet> pets = servico.findAll();\n    return ResponseEntity.ok(pets);')
        },
        {
          at: SERVICE, kind: 'req', label: 'findAll',
          title: 'O Service pede a lista',
          text: 'Neste caso simples não há regra de negócio, então o Service só repassa o pedido. Mesmo assim ele existe: amanhã você pode filtrar, ordenar ou esconder dados aqui sem mexer no resto.',
          code: serviceCode('List<Pet> findAll() {\n\x01  return repositorio.findAll();\n}')
        },
        {
          at: REPOSITORY, kind: 'req', label: 'findAll()',
          title: 'O Repository executa findAll()',
          text: 'O método findAll() já vem pronto no JpaRepository. O JPA gera um SELECT para buscar todas as linhas da tabela.',
          code: 'interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n\x01List<Pet> pets = repositorio.findAll();\n// gera: SELECT * FROM pets'
        },
        {
          at: DATABASE, kind: 'req', label: 'SELECT',
          db: { pets: list, hl: { type: 'read', ids: list.map(p => p.id), query: 'todas as linhas' } },
          title: 'O Banco retorna os registros',
          text: `O banco lê a tabela e devolve ${list.length} linha(s). Um SELECT apenas lê: os dados continuam exatamente como estavam.`,
          code: `\x01SELECT * FROM pets;\n\n→ ${list.length} linha(s) encontrada(s)`
        },
        {
          at: REPOSITORY, kind: 'res', label: `${list.length} pet(s)`,
          title: 'O Repository converte linhas em objetos',
          text: 'Cada linha da tabela vira um objeto Pet em Java. O Repository devolve uma List<Pet> ao Service.',
          code: `\x01List<Pet> pets = repositorio.findAll();\n\x01// voltou: ${list.length} objeto(s) Pet`
        },
        {
          at: SERVICE, kind: 'res', label: `${list.length} pet(s)`,
          title: 'O Service devolve a lista',
          text: 'Sem regra extra para aplicar, o Service entrega a lista ao Controller.',
          code: serviceCode(`List<Pet> findAll() {\n\x01  return repositorio.findAll();\n\x01  // voltou: ${list.length} objeto(s) Pet\n}`)
        },
        {
          at: CONTROLLER, kind: 'res', label: '200 OK',
          badge: { text: '200 OK', tone: 'ok' },
          title: 'O Controller responde 200 OK',
          text: 'Tudo certo: o Controller devolve status 200 OK e o Spring converte a lista de objetos em JSON automaticamente.',
          code: controllerCode('@GetMapping', 'ResponseEntity<List<Pet>> listar() {\n    List<Pet> pets = servico.findAll();\n\x01    return ResponseEntity.ok(pets);') + '\n\n// resposta: 200 OK'
        },
        {
          at: FRONT, kind: 'res', label: '200',
          badge: { text: '200 OK', tone: 'ok' },
          title: 'O Front-End exibe o JSON',
          text: 'O navegador recebe o JSON, o carregamento termina e a página desenha a lista de pets na tela.',
          code: response('200 OK', list.map(({ id, name, species }) => ({ id, nome: name, especie: species })))
        }
      ]
    };
    const listStr = `List<Pet> [${list.length} item(ns)]`;
    attachVars(result.steps, [
      null,
      [['servico', 'PetService']],
      [['repositorio', 'PetRepository']],
      null,
      [['linhas encontradas', String(list.length)]],
      [['pets', listStr]],
      [['pets', listStr]],
      [['pets', listStr], ['status', '200 OK'], ['corpo', 'pets']],
      null
    ]);
    return result;
  };

  const buildDelete = (pets, nextId, { id }) => {
    const target = pets.find(p => p.id === id);
    const route = `DELETE /pets/${id}`;
    const found = Boolean(target);
    const notFoundText = `Pet ${id} não encontrado`;
    const serviceCheck = note => `void deletar(Long id) {\n\x01  boolean petExiste = repositorio.existsById(id);\n  if (!petExiste) {   // ${note}\n    throw new ResponseStatusException(\n      HttpStatus.NOT_FOUND,\n      "${notFoundText}");\n  }\n\n  repositorio.deleteById(id);\n}`;

    const steps = [
      {
        at: FRONT, kind: 'req', label: route,
        title: 'O Front-End envia o pedido de exclusão',
        text: `A pessoa clicou em Excluir no pet de ID ${id}. Note que o ID vai na própria URL, e não no corpo da requisição.`,
        code: request('DELETE', `/pets/${id}`)
      },
      {
        at: CONTROLLER, kind: 'req', label: route,
        title: 'O Controller recebe a requisição',
        text: `A parte {id} da rota captura o valor ${id} da URL com @PathVariable e o entrega ao Service.`,
        code: controllerCode('@DeleteMapping("/{id}")', 'ResponseEntity<Void> deletar(\n      @PathVariable Long id) {\n\x01    servico.deletar(id);\n    return ResponseEntity.ok().build();')
      },
      {
        at: SERVICE, kind: 'req', label: `existe #${id}?`,
        title: `O Service começa conferindo se o ID ${id} existe`,
        text: `Antes de apagar qualquer coisa, o Service precisa saber se o ID ${id} existe. Quem sabe isso é o banco, então ele pergunta ao Repository.`,
        code: serviceCode(serviceCheck('consulta o banco'))
      },
      {
        at: REPOSITORY, kind: 'req', label: 'existsById',
        title: 'O Repository pergunta se o id existe',
        text: 'O existsById() já vem pronto no JpaRepository. Ele transforma a pergunta em um SELECT e devolve true ou false.',
        code: `interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n\x01boolean petExiste = repositorio.existsById(${id}L);\n// gera: SELECT COUNT(*) > 0 FROM pets\n//       WHERE id = ${id}`
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT',
        db: { pets, hl: { type: 'read', ids: found ? [id] : [], query: `id = ${id}`, stopAtFirst: true } },
        title: found ? 'O Banco acha o pet' : 'O Banco não acha nenhum pet com esse id',
        text: found
          ? `Olhe a tabela pets: a linha do ${target.name} (id ${id}) está lá. A contagem volta 1.`
          : `Olhe a tabela pets: não existe nenhuma linha com o id ${id}. A contagem volta 0.`,
        code: `\x01SELECT COUNT(*) FROM pets\n\x01WHERE id = ${id};\n\n→ ${found ? '1 (existe)' : '0 (não existe)'}`
      },
      {
        at: REPOSITORY, kind: 'res', label: String(found),
        title: `O Repository devolve ${found}`,
        text: found
          ? 'O banco achou 1 linha, então o Repository devolve true: o pet existe.'
          : 'O banco não achou nenhuma linha, então o Repository devolve false: o pet não existe.',
        code: `\x01boolean petExiste = repositorio.existsById(${id}L);\n\x01// voltou: ${found} (${found ? 'o pet existe' : 'o pet não existe'})`
      }
    ];

    if (!found) {
      steps.push(
        {
          at: SERVICE, kind: 'err', label: 'ID não existe',
          title: `O Service recusa: o ID ${id} não existe`,
          text: 'Esta é uma regra de negócio: não dá para apagar o que não existe. O Service lança um ResponseStatusException com o status 404 (NOT_FOUND) e cancela o fluxo. O deleteById() nem chega a ser chamado, porque não há o que apagar.',
          code: serviceCode(`void deletar(Long id) {\n  boolean petExiste = repositorio.existsById(id);\n\x02  if (!petExiste) {   // FALHOU: ${id} não existe\n\x01    throw new ResponseStatusException(\n\x01      HttpStatus.NOT_FOUND,\n\x01      "${notFoundText}");\n  }\n\n  repositorio.deleteById(id);          // nunca chega aqui\n}`)
        },
        {
          at: CONTROLLER, kind: 'err', label: '404 Not Found',
          badge: { text: '404 Not Found', tone: 'err' },
          title: 'O Spring converte o erro em 404',
          text: 'O Spring captura o ResponseStatusException e responde 404 Not Found, o código HTTP que significa "o recurso que você procurou não existe". O Controller não escreve nada para isso.',
          code: `\x01// o Controller não escreve código para o erro:\n\x01// o Spring captura o ResponseStatusException\n\x01// e responde com o status que veio nele\n\n// resposta: 404 Not Found`
        },
        {
          at: FRONT, kind: 'err', label: '404',
          badge: { text: '404 Not Found', tone: 'err' },
          title: 'O Front-End recebe o erro',
          text: 'O navegador recebe o 404 e pode avisar: "Pet não encontrado". O banco continua intacto.',
          code: response('404 Not Found', { status: 404, erro: 'Not Found', mensagem: notFoundText })
        }
      );
      attachVars(steps, [
        null,
        [['id', String(id)]],
        [['id', String(id)]],
        [['id', `${id}L`]],
        [['contagem', '0']],
        [['petExiste', 'false']],
        [['petExiste', 'false'], ['exceção', `ResponseStatusException(NOT_FOUND, "${notFoundText}")`]],
        [['status', '404 Not Found']],
        null
      ]);
      return { steps, final: { pets, nextId }, view: 'site', loading: 'Excluindo pet…', result: { banner: { tone: 'err', text: `Erro 404: ${notFoundText}.` }, pets: [{ id, name: 'Pet desatualizado', species: 'este item já não existe' }] } };
    }

    const after = clone(pets).filter(p => p.id !== id);
    steps.push(
      {
        at: SERVICE, kind: 'res', label: 'apagar',
        title: 'O pet existe: o Service manda apagar',
        text: `O Repository devolveu true, então a regra de negócio foi cumprida. Agora o Service pede ao Repository para apagar o ID ${id}.`,
        code: serviceCode(`void deletar(Long id) {\n  boolean petExiste = repositorio.existsById(id);\n  if (!petExiste) {   // OK: ${id} existe\n    throw new ResponseStatusException(\n      HttpStatus.NOT_FOUND,\n      "${notFoundText}");\n  }\n\n\x01  repositorio.deleteById(id);\n}`)
      },
      {
        at: REPOSITORY, kind: 'req', label: `deleteById(${id})`,
        title: 'O Repository executa deleteById()',
        text: 'Mais um método pronto do JpaRepository. O JPA gera o comando DELETE usando o ID recebido.',
        code: `interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n\x01repositorio.deleteById(${id});\n// gera: DELETE FROM pets WHERE id = ${id}`
      },
      {
        at: DATABASE, kind: 'req', label: 'DELETE',
        db: { pets: after, hl: { type: 'delete', ids: [id], ghost: target } },
        title: 'O Banco remove o registro',
        text: `O banco apaga a linha do id ${id}. Veja na tabela: o pet "${target.name}" desaparece.`,
        code: `\x01DELETE FROM pets\n\x01WHERE id = ${id};\n\n→ 1 linha removida`
      },
      {
        at: REPOSITORY, kind: 'res', label: 'removido',
        title: 'O Banco confirma ao Repository',
        text: 'A exclusão deu certo. O deleteById() não devolve nada (void), apenas termina sem erro.',
        code: `\x01repositorio.deleteById(${id});   // void\n// voltou sem erro: nada a retornar`
      },
      {
        at: SERVICE, kind: 'res', label: 'concluído',
        title: 'O Service finaliza',
        text: 'Nenhuma exceção foi lançada, então o Service simplesmente termina e devolve o controle ao Controller.',
        code: serviceCode(`void deletar(Long id) {\n  boolean petExiste = repositorio.existsById(id);\n  if (!petExiste) {   // OK: ${id} existe\n    throw new ResponseStatusException(\n      HttpStatus.NOT_FOUND,\n      "${notFoundText}");\n  }\n\n\x01  repositorio.deleteById(id);\n\x01  // voltou: terminou sem erro\n}`)
      },
      {
        at: CONTROLLER, kind: 'res', label: '200 OK',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Controller responde 200 OK',
        text: 'Como tudo deu certo, o Controller responde 200 OK. (Muitas APIs usam 204 No Content aqui, mas neste exemplo usamos 200.)',
        code: controllerCode('@DeleteMapping("/{id}")', 'ResponseEntity<Void> deletar(\n      @PathVariable Long id) {\n    servico.deletar(id);\n\x01    return ResponseEntity.ok().build();') + '\n\n// resposta: 200 OK'
      },
      {
        at: FRONT, kind: 'res', label: '200',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Front-End recebe a confirmação',
        text: `Ciclo completo! O navegador recebe o 200 e pode remover o pet "${target.name}" da tela.`,
        code: response('200 OK')
      }
    );
    attachVars(steps, [
      null,
      [['id', String(id)]],
      [['id', String(id)]],
      [['id', `${id}L`]],
      [['contagem', '1']],
      [['petExiste', 'true']],
      [['petExiste', 'true']],
      [['id', String(id)]],
      [['linhas removidas', '1']],
      [['retorno', 'void']],
      [['id', String(id)]],
      [['status', '200 OK']],
      null
    ]);
    return { steps, final: { pets: after, nextId }, view: 'site', loading: 'Excluindo pet…', result: { banner: { tone: 'ok', text: `Pet "${target.name}" removido com sucesso.` }, pets: after } };
  };


  const MARK = '\x01';

  const markFor = (key, marks) => (!key ? '' : marks.includes(key) ? '\x01' : marks.includes('~' + key) ? '\x02' : marks.includes('^' + key) ? '\x03' : '');

  const slotStates = (agenda, mine = null) => window.Lab.SLOTS.map(time => ({
    time,
    state: time === mine ? 'mine' : agenda.some(a => a.time === time) ? 'taken' : 'free'
  }));

  const appointmentServiceCode = (marks, slotNote, petNote = 'OK') => {
    const lines = [
      [null, '@Service'],
      [null, 'class AgendamentoService {'],
      [null, '  private final PetRepository petRepositorio;'],
      [null, '  private final AgendamentoRepository repositorio;'],
      [null, ''],
      [null, '  Agendamento criar(AgendamentoDto dto) {'],
      ['petCall', '    boolean petExiste = petRepositorio.existsById(dto.petId());'],
      ['petCheck', `    if (!petExiste) {   // ${petNote}`],
      ['petCheck', '      throw new ResponseStatusException('],
      ['petCheck', '        HttpStatus.NOT_FOUND,'],
      ['petCheck', '        "Pet não encontrado");'],
      [null, '    }'],
      [null, ''],
      ['slotCall', '    boolean horarioOcupado = repositorio.existsByHorario(dto.horario());'],
      ['slotIf', `    if (horarioOcupado) {      // ${slotNote}`],
      ['throw', '      throw new ResponseStatusException('],
      ['throw', '        HttpStatus.BAD_REQUEST,'],
      ['throw', '        "Horário " + dto.horario() + " indisponível");'],
      [null, '    }'],
      [null, ''],
      ['newAg', '    Agendamento agendamento = new Agendamento('],
      ['newAgCont', '      dto.petId(), dto.horario());'],
      ['save', '    Agendamento agendamentoSalvo = repositorio.save(agendamento);'],
      ['voltou', '    // voltou: Agendamento(id=…, petId=…, horario=…)'],
      ['return', '    return agendamentoSalvo;'],
      [null, '  }'],
      [null, '}']
    ];
    return lines.map(([key, text]) => markFor(key, marks) + text).join('\n');
  };

  const appointmentControllerCode = (markCall, markReturn) =>
`@RestController
@RequestMapping("/agendamentos")
class AgendamentoController {
  private final AgendamentoService servico;

  @PostMapping
  ResponseEntity<Agendamento> criar(
      @RequestBody AgendamentoDto dto) {
${markCall ? MARK : ''}    Agendamento agendamento = servico.criar(dto);
${markReturn ? MARK : ''}    return ResponseEntity.ok(agendamento);
  }
}`;

  const buildSchedule = (pets, nextId, { pet, time }, env) => {
    const agenda = clone(env.agenda);
    const nextAgendaId = env.nextAgendaId;
    const rowAtTime = agenda.find(a => a.time === time);
    const blocked = Boolean(rowAtTime);
    const race = Boolean(rowAtTime && rowAtTime.stale);
    const atCheck = agenda;
    const dto = { petId: pet.id, horario: time };
    const dtoStr = `AgendamentoDto(petId=${pet.id}, horario="${time}")`;
    const errorText = `Horário ${time} indisponível`;
    const db = (list, hl) => ({ pets, agenda: list, hl });

    const steps = [
      {
        at: FRONT, kind: 'req', label: 'POST /agendamentos',
        title: 'O Front-End envia o pedido de agendamento',
        text: `A pessoa escolheu o horário ${time} para o ${pet.name} e clicou nele. O navegador manda um POST com o id do pet e o horário desejado.`,
        code: request('POST', '/agendamentos', dto)
      },
      {
        at: CONTROLLER, kind: 'req', label: 'POST /agendamentos',
        title: 'O Controller recebe a requisição',
        text: 'A rota POST /agendamentos cai no método criar(). O Controller só converte o JSON em objeto e entrega ao Service.',
        code: appointmentControllerCode(true, false),
        vars: [['servico', 'AgendamentoService'], ['dto', dtoStr]]
      },
      {
        at: SERVICE, kind: 'req', label: '1º: o pet existe?',
        title: 'O Service começa conferindo se o pet existe',
        text: `Antes de reservar qualquer horário, o Service confere a primeira regra: o id ${pet.id} que chegou precisa ser de um pet cadastrado. A tabela agenda guarda esse id como chave estrangeira (pet_id), então ele precisa existir na tabela pets. Para saber, o Service pergunta ao PetRepository.`,
        code: appointmentServiceCode(['petCall'], 'consulta o banco', 'consulta o banco'),
        vars: [['dto', dtoStr], ['dto.petId()', String(pet.id)]]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'existsById',
        title: 'O PetRepository pergunta se o id existe',
        text: 'Usa o existsById(), que já vem pronto no JpaRepository, igual ao do DELETE de pets. Devolve true ou false.',
        code: `interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n${MARK}boolean petExiste = petRepositorio.existsById(${pet.id}L);\n// gera: SELECT COUNT(*) > 0 FROM pets\n//       WHERE id = ${pet.id}`,
        vars: [['id', `${pet.id}L`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT pets',
        db: db(agenda, { table: 'pets', type: 'read', ids: [pet.id], query: `id = ${pet.id}`, stopAtFirst: true }),
        title: 'O Banco acha o pet na tabela pets',
        text: `Olhe a tabela pets: a linha do ${pet.name} (id ${pet.id}) está lá. A contagem volta 1.`,
        code: `${MARK}SELECT COUNT(*) FROM pets\n${MARK}WHERE id = ${pet.id};\n\n→ 1 (existe)`,
        vars: [['contagem', '1']]
      },
      {
        at: REPOSITORY, kind: 'res', label: 'true',
        title: 'O PetRepository devolve true',
        text: 'O banco achou 1 linha, então o Repository devolve true: o pet existe.',
        code: `${MARK}boolean petExiste = petRepositorio.existsById(${pet.id}L);\n${MARK}// voltou: true (o pet existe)`,
        vars: [['petExiste', 'true']]
      },
      {
        at: SERVICE, kind: 'res', label: '2º: horário livre?',
        title: 'O pet existe. Agora o Service confere se o horário está livre',
        text: 'Primeira regra cumprida. A segunda regra: o horário escolhido não pode ter dono. O Service pergunta ao AgendamentoRepository, porque só o banco sabe quem já reservou.',
        code: appointmentServiceCode(['slotCall'], 'consulta o banco'),
        vars: [['petExiste', 'true'], ['dto.horario()', `"${time}"`]]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'existsByHorario',
        title: 'O AgendamentoRepository pergunta se o horário já existe',
        text: 'O método existsByHorario() não vem pronto no JpaRepository: basta declará-lo na interface e o Spring Data cria a consulta pelo nome. Ele devolve true ou false.',
        code: `interface AgendamentoRepository\n    extends JpaRepository<Agendamento, Long> {\n  boolean existsByHorario(String horario);\n}\n\n${MARK}boolean horarioOcupado = repositorio.existsByHorario("${time}");\n// gera: SELECT COUNT(*) > 0 FROM agenda\n//       WHERE horario = '${time}'`,
        vars: [['horario', `"${time}"`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT agenda',
        db: db(atCheck, { table: 'agenda', type: 'read', ids: atCheck.filter(a => a.time === time).map(a => a.id), query: `horario = '${time}'`, stopAtFirst: true }),
        title: blocked ? 'O Banco encontra o horário já reservado' : 'O Banco confirma que o horário está livre',
        text: race
          ? `Olhe a tabela agenda: a linha das ${time}, em amarelo, já estava lá desde o começo. Outra pessoa reservou esse horário, mas a página foi carregada antes disso e ainda mostrava o horário como disponível. Para o banco, o horário já tem dono: a contagem volta 1.`
          : blocked
            ? `O banco já tem um agendamento às ${time}: a contagem volta 1.`
            : `Nenhum agendamento às ${time}, então a contagem volta 0: horário livre.`,
        code: `${MARK}SELECT COUNT(*) FROM agenda\n${MARK}WHERE horario = '${time}';\n\n→ ${blocked ? '1 (já existe!)' : '0 (livre)'}`,
        vars: [['contagem', blocked ? '1' : '0']]
      },
      {
        at: REPOSITORY, kind: 'res', label: String(blocked),
        title: 'O AgendamentoRepository devolve true ou false',
        text: blocked
          ? 'O banco disse que existe 1, então o Repository devolve true: o horário está ocupado.'
          : 'O banco disse que não existe nenhum, então o Repository devolve false: o horário está livre.',
        code: `${MARK}boolean horarioOcupado = repositorio.existsByHorario("${time}");\n${MARK}// voltou: ${blocked} (${blocked ? 'já tem agendamento' : 'nenhum agendamento'})`,
        vars: [['horarioOcupado', String(blocked)]]
      }
    ];

    if (blocked) {
      steps.push(
        {
          at: SERVICE, kind: 'err', label: 'horário ocupado',
          title: 'O Service recusa: o horário já foi reservado',
          text: `Aqui está o caso que o Service existe para proteger. A página mostrava o horário ${time} como livre, mas outra pessoa já o tinha reservado. O Service percebe, lança um ResponseStatusException com o status 400 e não salva nada.`,
          code: appointmentServiceCode(['~slotIf', 'throw'], 'FALHOU: ocupado'),
          vars: [['horarioOcupado', 'true'], ['exceção', `ResponseStatusException(BAD_REQUEST, "${errorText}")`]]
        },
        {
          at: CONTROLLER, kind: 'err', label: '400 Bad Request',
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Spring converte o erro em 400',
          text: 'O Spring captura o ResponseStatusException e responde 400 Bad Request, com a mensagem explicando o motivo. O Controller não precisa escrever nada para isso.',
          code: `\x01// o Controller não escreve código para o erro:\n\x01// o Spring captura o ResponseStatusException\n\x01// e responde com o status que veio nele\n\n// resposta: 400 Bad Request`,
          vars: [['status', '400 Bad Request']]
        },
        {
          at: FRONT, kind: 'err', label: '400',
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Front-End mostra que não deu para agendar',
          text: `A resposta 400 chega com o motivo. A página avisa a pessoa e já mostra o horário ${time} como ocupado. Nenhum agendamento foi criado para o ${pet.name}.`,
          code: response('400 Bad Request', { status: 400, erro: 'Bad Request', mensagem: errorText })
        }
      );
      const finalAgenda = agenda.map(a => ({ ...a, stale: false }));
      return {
        steps,
        final: { pets, nextId, agenda: finalAgenda, nextAgendaId },
        view: 'site', loading: 'Agendando horário…',
        result: { banner: { tone: 'err', text: `Erro 400: ${errorText}.` }, schedule: { pet, slots: slotStates(finalAgenda) } }
      };
    }

    const created = { id: nextAgendaId, petId: pet.id, time };
    const after = [...agenda, created];
    const createdStr = `Agendamento(id=${created.id}, petId=${pet.id}, horario="${time}")`;

    steps.push(
      {
        at: SERVICE, kind: 'res', label: 'salvar',
        title: 'O horário está livre: o Service segue para salvar',
        text: 'As duas regras passaram (o pet existe e o horário está livre). Agora o Service monta o Agendamento, ainda sem id, e pede ao Repository para guardá-lo.',
        code: appointmentServiceCode(['~newAg', '^newAgCont', 'save'], 'OK: livre'),
        vars: [['horarioOcupado', 'false'], ['agendamento', `Agendamento(id=null, petId=${pet.id}, horario="${time}")`]]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'save()',
        title: 'O Repository executa save()',
        text: 'Igual ao cadastro de pets: o Agendamento chega sem id, o INSERT não leva id nenhum e o banco gera o número sozinho. O pet_id vai junto, ligando a linha da agenda ao pet.',
        code: `${MARK}Agendamento agendamentoSalvo = repositorio.save(agendamento);\n\n// gera: INSERT INTO agenda (pet_id, horario)\n//       VALUES (${pet.id}, '${time}')\n// o id fica de fora: o banco gera`,
        vars: [['agendamento', `Agendamento(id=null, petId=${pet.id}, horario="${time}")`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'INSERT',
        db: db(after, { table: 'agenda', type: 'insert', ids: [created.id] }),
        title: 'O Banco grava o agendamento',
        text: `O banco insere a linha e gera o id ${created.id}. Olhe a tabela agenda: o horário ${time} agora está reservado e o pet_id ${pet.id} aponta para o ${pet.name} na tabela pets.`,
        code: `${MARK}INSERT INTO agenda (pet_id, horario)\n${MARK}VALUES (${pet.id}, '${time}');\n\n→ 1 linha inserida\n→ id gerado pelo banco: ${created.id}`,
        vars: [['linhas inseridas', '1'], ['id gerado pelo banco', String(created.id)]]
      },
      {
        at: REPOSITORY, kind: 'res', label: `Agendamento #${created.id}`,
        title: 'O Banco devolve o id ao Repository',
        text: `O Repository preenche o Agendamento, que estava com id null, com o id ${created.id} e o retorna.`,
        code: `${MARK}Agendamento agendamentoSalvo = repositorio.save(agendamento);\n\n// antes: Agendamento(id=null, ...)\n${MARK}// agora: ${createdStr}`,
        vars: [['agendamentoSalvo', createdStr]]
      },
      {
        at: SERVICE, kind: 'res', label: `Agendamento #${created.id}`,
        title: 'O Service devolve o agendamento ao Controller',
        text: 'Sem mais nada a fazer, o Service devolve o Agendamento já com o id.',
        code: appointmentServiceCode(['return'], 'OK: livre').replace('Agendamento(id=…, petId=…, horario=…)', createdStr),
        vars: [['agendamentoSalvo', createdStr]]
      },
      {
        at: CONTROLLER, kind: 'res', label: '200 OK',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Controller responde 200 OK',
        text: 'Deu tudo certo, então o Controller devolve 200 OK com o agendamento no corpo.',
        code: appointmentControllerCode(false, true) + '\n\n// resposta: 200 OK',
        vars: [['agendamento', createdStr], ['status', '200 OK'], ['corpo', 'agendamento']]
      },
      {
        at: FRONT, kind: 'res', label: '200',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Front-End confirma o agendamento',
        text: `Ciclo completo! A página recebe o 200 e mostra que o ${pet.name} está agendado para ${time}.`,
        code: response('200 OK', { id: created.id, petId: pet.id, horario: time })
      }
    );
    return {
      steps,
      final: { pets, nextId, agenda: after.map(a => ({ ...a, stale: false })), nextAgendaId: nextAgendaId + 1 },
      view: 'site', loading: 'Agendando horário…',
      result: { banner: { tone: 'ok', text: `Agendado! ${pet.name} às ${time}.` }, schedule: { pet, slots: slotStates(after, time) } }
    };
  };


  const editServiceCode = (marks, notes = {}) => {
    const lines = [
      [null, '@Service'],
      [null, 'class PetService {'],
      [null, '  private final PetRepository repositorio;'],
      [null, ''],
      [null, '  Pet editar(Long id, PetDto dto) {'],
      ['vazioCall', '    boolean nomeVazio = dto.nome().isBlank();'],
      ['vazioIf', `    if (nomeVazio) {   // ${notes.vazio || 'OK'}`],
      ['vazio', '      throw new ResponseStatusException('],
      ['vazio', '        HttpStatus.BAD_REQUEST,'],
      ['vazio', '        "O nome é obrigatório");'],
      [null, '    }'],
      [null, ''],
      ['grandeCall', '    boolean nomeGrande = dto.nome().length() > 30;'],
      ['grandeIf', `    if (nomeGrande) {   // ${notes.grande || 'OK'}`],
      ['grande', '      throw new ResponseStatusException('],
      ['grande', '        HttpStatus.BAD_REQUEST,'],
      ['grande', '        "Nome muito longo");'],
      [null, '    }'],
      [null, ''],
      ['busca', '    Optional<Pet> resultado = repositorio.findById(id);'],
      ['achou', '    if (resultado.isEmpty()) {   // OK: achou'],
      ['achou', '      throw new ResponseStatusException('],
      ['achou', '        HttpStatus.NOT_FOUND,'],
      ['achou', `        "Pet ${notes.id} não encontrado");`],
      [null, '    }'],
      [null, ''],
      ['alterar', '    Pet pet = resultado.get();'],
      ['alterar', '    pet.setNome(dto.nome());'],
      ['salvar', '    Pet petSalvo = repositorio.save(pet);'],
      ['voltou', '    // voltou: Pet com o nome novo'],
      ['return', '    return petSalvo;'],
      [null, '  }'],
      [null, '}']
    ];
    return lines.map(([key, text]) => markFor(key, marks) + text).join('\n');
  };

  const buildEdit = (pets, nextId, { id, nome }, env) => {
    const target = pets.find(p => p.id === id);
    const novo = nome.trim();
    const route = `PUT /pets/${id}`;
    const body = { nome: novo };
    const reason = novo.length === 0 ? 'O nome é obrigatório' : novo.length > 30 ? 'O nome deve ter até 30 caracteres' : null;
    const controller = marks => controllerCode('@PutMapping("/{id}")', `ResponseEntity<Pet> editar(\n      @PathVariable Long id,\n      @RequestBody PetDto dto) {\n${marks.call ? MARK : ''}    Pet pet = servico.editar(id, dto);\n${marks.ret ? MARK : ''}    return ResponseEntity.ok(pet);`);

    const steps = [
      {
        at: FRONT, kind: 'req', label: route,
        title: 'O Front-End envia o novo nome',
        text: `A pessoa clicou em Editar no pet de ID ${id}, digitou o nome "${novo || '(vazio)'}" e salvou. O ID vai na URL e o nome novo vai no corpo da requisição. Para alterar algo que já existe usamos o método PUT.`,
        code: request('PUT', `/pets/${id}`, body)
      },
      {
        at: CONTROLLER, kind: 'req', label: route,
        title: 'O Controller recebe a requisição',
        text: 'O @PutMapping liga a rota ao método editar(). O @PathVariable pega o id da URL e o @RequestBody converte o JSON em PetDto. Depois é só entregar ao Service.',
        code: controller({ call: true }),
        vars: [['servico', 'PetService'], ['id', `${id}L`], ['dto', `PetDto(nome="${novo}")`]]
      }
    ];

    if (reason) {
      const blank = novo.length === 0;
      steps.push(
        {
          at: SERVICE, kind: 'err', label: 'nome inválido',
          title: 'O Service valida o nome… e reprova',
          text: `${reason}, então o Service lança um ResponseStatusException com o status 400. A execução para ali: o Repository e o Banco nem são chamados, porque não faz sentido buscar ou salvar com um nome inválido.`,
          code: editServiceCode(blank ? ['~vazioCall', '~vazioIf', 'vazio'] : ['~vazioCall', '~grandeCall', '~grandeIf', 'grande'], { vazio: blank ? 'FALHOU' : 'OK', grande: blank ? 'OK' : 'FALHOU', id }),
          vars: [['nomeVazio', String(blank)], ['dto.nome().length()', String(novo.length)], ['exceção', `ResponseStatusException(BAD_REQUEST, "${blank ? 'O nome é obrigatório' : 'Nome muito longo'}")`]]
        },
        {
          at: CONTROLLER, kind: 'err', label: '400 Bad Request',
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Spring converte o erro em 400',
          text: 'O Spring captura o ResponseStatusException e responde 400 Bad Request. O Controller não precisa escrever nada para isso.',
          code: `\x01// o Controller não escreve código para o erro:\n\x01// o Spring captura o ResponseStatusException\n\x01// e responde com o status que veio nele\n\n// resposta: 400 Bad Request`,
          vars: [['status', '400 Bad Request']]
        },
        {
          at: FRONT, kind: 'err', label: '400',
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Front-End mostra o erro',
          text: 'A página avisa que o nome é inválido. O nome do pet no banco continua o mesmo.',
          code: response('400 Bad Request', { status: 400, erro: 'Bad Request', mensagem: reason })
        }
      );
      return {
        steps, final: { pets, nextId }, view: 'site', loading: 'Salvando nome…',
        result: { banner: { tone: 'err', text: `Erro 400: ${reason}.` }, pets, highlight: null }
      };
    }

    const before = `Pet(id=${id}, nome="${target.name}", especie="${target.species}")`;
    const after = `Pet(id=${id}, nome="${novo}", especie="${target.species}")`;
    const updated = pets.map(p => (p.id === id ? { ...p, name: novo } : p));

    steps.push(
      {
        at: SERVICE, kind: 'req', label: 'validar e buscar',
        title: 'O Service valida o nome e pede o pet ao Repository',
        text: 'Primeiro a regra do nome (não vazio, até 30 caracteres): passou. Depois o Service precisa do pet atual, porque editar é trocar o nome de um pet que já existe. Ele pede ao Repository com findById().',
        code: editServiceCode(['~vazioCall', '~grandeCall', 'busca'], { id }),
        vars: [['nomeVazio', 'false'], ['nomeGrande', 'false']]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'findById',
        title: 'O Repository executa findById()',
        text: 'O findById() já vem pronto no JpaRepository. Ele devolve um Optional, uma "caixa" que pode ter o pet dentro ou estar vazia, caso o id não exista.',
        code: `interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n${MARK}Optional<Pet> resultado = repositorio.findById(${id}L);\n// gera: SELECT * FROM pets\n//       WHERE id = ${id}`,
        vars: [['id', `${id}L`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT',
        db: { pets, hl: { type: 'read', ids: [id], query: `id = ${id}`, stopAtFirst: true } },
        title: 'O Banco devolve a linha do pet',
        text: `Olhe a tabela pets: a linha do id ${id} está lá, ainda com o nome antigo "${target.name}".`,
        code: `${MARK}SELECT * FROM pets\n${MARK}WHERE id = ${id};\n\n→ 1 linha: (${id}, "${target.name}", "${target.species}")`,
        vars: [['linhas encontradas', '1']]
      },
      {
        at: REPOSITORY, kind: 'res', label: 'Optional[Pet]',
        title: 'O Repository devolve o pet dentro de um Optional',
        text: 'A linha vira um objeto Pet e vai dentro do Optional, que agora está cheio.',
        code: `${MARK}Optional<Pet> resultado = repositorio.findById(${id}L);\n${MARK}// voltou: Optional[${before}]`,
        vars: [['resultado', `Optional[${before}]`]]
      },
      {
        at: SERVICE, kind: 'res', label: 'trocar o nome',
        title: 'O Service troca o nome do pet',
        text: 'O Optional veio cheio, então o pet existe. O Service tira o pet de dentro com get() e troca o nome com setNome(). Atenção: a troca acontece só no objeto, na memória do Java. O banco ainda tem o nome antigo até o save().',
        code: editServiceCode(['~alterar', 'salvar'], { id }),
        vars: [['resultado.isEmpty()', 'false'], ['pet', after + '  (só na memória)']]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'save()',
        title: 'O Repository executa save()',
        text: 'Este é o mesmo save() do cadastro. A diferença: agora o pet já tem id, então o JPA entende que é uma edição e gera um UPDATE em vez de um INSERT.',
        code: `${MARK}Pet petSalvo = repositorio.save(pet);\n\n// o pet já tem id: o JPA gera UPDATE\n// UPDATE pets SET nome = '${novo}', especie = '${target.species}'\n//  WHERE id = ${id}`,
        vars: [['pet', after]]
      },
      {
        at: DATABASE, kind: 'req', label: 'UPDATE',
        db: { pets: updated, hl: { type: 'update', ids: [id], query: `id = ${id}`, stopAtFirst: true } },
        title: 'O Banco atualiza a linha',
        text: `O banco troca o nome da linha ${id} de "${target.name}" para "${novo}". Olhe a tabela: a linha em destaque mudou. Nenhuma linha nova foi criada e o id continua o mesmo.`,
        code: `${MARK}UPDATE pets\n${MARK}SET nome = '${novo}'\n${MARK}WHERE id = ${id};\n\n→ 1 linha atualizada`,
        vars: [['linhas atualizadas', '1']]
      },
      {
        at: REPOSITORY, kind: 'res', label: 'atualizado',
        title: 'O Repository devolve o pet atualizado',
        text: 'O save() devolve o pet já com o nome novo salvo.',
        code: `${MARK}Pet petSalvo = repositorio.save(pet);\n${MARK}// voltou: ${after}`,
        vars: [['petSalvo', after]]
      },
      {
        at: SERVICE, kind: 'res', label: 'concluído',
        title: 'O Service devolve o pet ao Controller',
        text: 'Nenhuma exceção foi lançada. O Service devolve o pet com o nome novo.',
        code: editServiceCode(['return'], { id }).replace('Pet com o nome novo', after),
        vars: [['petSalvo', after]]
      },
      {
        at: CONTROLLER, kind: 'res', label: '200 OK',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Controller responde 200 OK',
        text: 'Deu tudo certo, então o Controller responde 200 OK com o pet atualizado no corpo.',
        code: controller({ ret: true }) + '\n\n// resposta: 200 OK',
        vars: [['pet', after], ['status', '200 OK'], ['corpo', 'pet']]
      },
      {
        at: FRONT, kind: 'res', label: '200',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Front-End mostra o nome novo',
        text: `Ciclo completo! A página recebe o 200 e passa a mostrar "${novo}" no lugar de "${target.name}".`,
        code: response('200 OK', { id, nome: novo, especie: target.species })
      }
    );
    return {
      steps, final: { pets: updated, nextId }, view: 'site', loading: 'Salvando nome…',
      result: { banner: { tone: 'ok', text: `Nome atualizado: ${target.name} → ${novo}.` }, pets: updated, highlight: id }
    };
  };

  const buildPetAgenda = (pets, nextId, { id }, env) => {
    const pet = pets.find(p => p.id === id);
    const agenda = clone(env.agenda);
    const rows = agenda.filter(a => a.petId === id);
    const petStr = `Pet(id=${id}, nome="${pet.name}")`;
    const count = rows.length;
    const listStr = `List<Agendamento> [${count} item(ns)]`;
    const json = rows.map(a => ({ id: a.id, petId: a.petId, horario: a.time }));
    const controller = marks => `@RestController\n@RequestMapping("/agendamentos")\nclass AgendamentoController {\n  private final AgendamentoService servico;\n\n  @GetMapping\n  ResponseEntity<List<Agendamento>> listarPorPet(\n      @RequestParam Long petId) {\n${marks.call ? MARK : ''}    List<Agendamento> agendamentos = servico.listarPorPet(petId);\n${marks.ret ? MARK : ''}    return ResponseEntity.ok(agendamentos);\n  }\n}`;
    const service = (marks, petNote = 'OK') => [
      [null, '@Service'],
      [null, 'class AgendamentoService {'],
      [null, '  private final PetRepository petRepositorio;'],
      [null, '  private final AgendamentoRepository repositorio;'],
      [null, ''],
      [null, '  List<Agendamento> listarPorPet(Long petId) {'],
      ['petCall', '    boolean petExiste = petRepositorio.existsById(petId);'],
      ['pet', `    if (!petExiste) {   // ${petNote}`],
      ['pet', '      throw new ResponseStatusException('],
      ['pet', '        HttpStatus.NOT_FOUND,'],
      ['pet', '        "Pet não encontrado");'],
      [null, '    }'],
      [null, ''],
      ['busca', '    List<Agendamento> agendamentos ='],
      ['busca', '      repositorio.findByPetId(petId);'],
      ['voltou', `    // voltou: ${listStr}`],
      ['return', '    return agendamentos;'],
      [null, '  }'],
      [null, '}']
    ].map(([key, text]) => markFor(key, marks) + text).join('\n');

    const steps = [
      {
        at: FRONT, kind: 'req', label: 'GET /agendamentos',
        title: 'O Front-End pede a agenda de um pet',
        text: `A pessoa clicou em Ver agenda no pet ${pet.name}. O GET não leva corpo: o id do pet vai na própria URL, depois do ponto de interrogação (?petId=${id}). Isso é um parâmetro de consulta, ou query string.`,
        code: request('GET', `/agendamentos?petId=${id}`)
      },
      {
        at: CONTROLLER, kind: 'req', label: 'GET /agendamentos',
        title: 'O Controller recebe a requisição',
        text: 'O @GetMapping atende a rota e o @RequestParam pega o valor de petId que veio na URL. Depois é só entregar ao Service.',
        code: controller({ call: true }),
        vars: [['servico', 'AgendamentoService'], ['petId', `${id}L`]]
      },
      {
        at: SERVICE, kind: 'req', label: '1º: o pet existe?',
        title: 'O Service confere se o pet existe',
        text: `Antes de buscar a agenda, o Service confere se o id ${id} é de um pet cadastrado. Para saber, pergunta ao PetRepository.`,
        code: service(['petCall'], 'consulta o banco'),
        vars: [['petId', `${id}L`]]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'existsById',
        title: 'O PetRepository pergunta se o id existe',
        text: 'Usa o existsById(), pronto no JpaRepository. Devolve true ou false.',
        code: `interface PetRepository\n    extends JpaRepository<Pet, Long> {}\n\n${MARK}boolean petExiste = petRepositorio.existsById(${id}L);\n// gera: SELECT COUNT(*) > 0 FROM pets\n//       WHERE id = ${id}`,
        vars: [['id', `${id}L`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT pets',
        db: { pets, agenda, hl: { table: 'pets', type: 'read', ids: [id], query: `id = ${id}`, stopAtFirst: true } },
        title: 'O Banco acha o pet na tabela pets',
        text: `Olhe a tabela pets: a linha do ${pet.name} (id ${id}) está lá. A contagem volta 1.`,
        code: `${MARK}SELECT COUNT(*) FROM pets\n${MARK}WHERE id = ${id};\n\n→ 1 (existe)`,
        vars: [['contagem', '1']]
      },
      {
        at: REPOSITORY, kind: 'res', label: 'true',
        title: 'O PetRepository devolve true',
        text: 'O banco achou 1 linha, então o Repository devolve true: o pet existe.',
        code: `${MARK}boolean petExiste = petRepositorio.existsById(${id}L);\n${MARK}// voltou: true (o pet existe)`,
        vars: [['petExiste', 'true']]
      },
      {
        at: SERVICE, kind: 'res', label: '2º: buscar agenda',
        title: 'O pet existe: o Service busca os agendamentos dele',
        text: 'Primeira regra cumprida. Agora o Service pede ao AgendamentoRepository todos os agendamentos daquele pet.',
        code: service(['busca'], 'OK'),
        vars: [['petExiste', 'true']]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'findByPetId',
        title: 'O AgendamentoRepository executa findByPetId()',
        text: 'Como o existsByHorario(), este método não vem pronto: basta declará-lo na interface e o Spring Data cria a consulta pelo nome. "findBy" + "PetId" vira um filtro pela coluna pet_id.',
        code: `interface AgendamentoRepository\n    extends JpaRepository<Agendamento, Long> {\n  List<Agendamento> findByPetId(Long petId);\n}\n\n${MARK}List<Agendamento> agendamentos =\n${MARK}  repositorio.findByPetId(${id}L);\n// gera: SELECT * FROM agenda\n//       WHERE pet_id = ${id}`,
        vars: [['petId', `${id}L`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT agenda',
        db: { pets, agenda, hl: { table: 'agenda', type: 'read', ids: rows.map(a => a.id), query: `pet_id = ${id}` } },
        title: count ? `O Banco devolve ${count} agendamento(s)` : 'O Banco não encontra nenhum agendamento',
        text: count
          ? `Olhe a tabela agenda: as linhas com pet_id ${id} estão em destaque. São elas que voltam.`
          : `Olhe a tabela agenda: nenhuma linha tem pet_id ${id}. O resultado é uma lista vazia, e isso não é erro: o pet existe, só não tem horários marcados.`,
        code: `${MARK}SELECT * FROM agenda\n${MARK}WHERE pet_id = ${id};\n\n→ ${count} linha(s)`,
        vars: [['linhas encontradas', String(count)]]
      },
      {
        at: REPOSITORY, kind: 'res', label: `${count} item(ns)`,
        title: 'O Repository converte as linhas em objetos',
        text: 'Cada linha vira um objeto Agendamento, e o Repository devolve a lista.',
        code: `${MARK}List<Agendamento> agendamentos =\n${MARK}  repositorio.findByPetId(${id}L);\n${MARK}// voltou: ${listStr}`,
        vars: [['agendamentos', listStr]]
      },
      {
        at: SERVICE, kind: 'res', label: `${count} item(ns)`,
        title: 'O Service devolve a lista ao Controller',
        text: 'Sem mais nada a fazer, o Service devolve a lista.',
        code: service(['return'], 'OK'),
        vars: [['agendamentos', listStr]]
      },
      {
        at: CONTROLLER, kind: 'res', label: '200 OK',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Controller responde 200 OK',
        text: 'Deu tudo certo, então o Controller responde 200 OK com a lista no corpo. Lista vazia também é 200.',
        code: controller({ ret: true }) + '\n\n// resposta: 200 OK',
        vars: [['agendamentos', listStr], ['status', '200 OK'], ['corpo', 'agendamentos']]
      },
      {
        at: FRONT, kind: 'res', label: '200',
        badge: { text: '200 OK', tone: 'ok' },
        title: 'O Front-End mostra a agenda',
        text: count ? `Ciclo completo! A página recebe a lista e mostra os horários do ${pet.name}.` : `Ciclo completo! A página recebe uma lista vazia e avisa que o ${pet.name} não tem horários.`,
        code: response('200 OK', json)
      }
    ];
    return {
      steps, final: { pets, nextId, agenda, nextAgendaId: env.nextAgendaId }, view: 'site', loading: 'Buscando agenda…',
      result: { banner: null, agendaOf: { pet, rows } }
    };
  };


  const PRODUTO_METHOD = [
    'Produto cadastrar(ProdutoDto dto) {',
    '  boolean codigoExiste =',
    '    repositorio.existsByCodigoDeBarras(dto.getCodigoDeBarras());',
    '  if (codigoExiste) {',
    '    throw new ResponseStatusException(',
    '      HttpStatus.BAD_REQUEST,',
    '      "Código de barras já cadastrado");',
    '  }',
    '',
    '  Produto produto = new Produto(',
    '    dto.getNome(), dto.getCodigoDeBarras());',
    '  Produto produtoSalvo = repositorio.save(produto);',
    '  return produtoSalvo;',
    '}'
  ];

  const produtoServiceCode = marks => ['@Service', 'class ProdutoService {', '  private final ProdutoRepository repositorio;', '']
    .concat(PRODUTO_METHOD.map((line, i) => (marks[i + 1] || '') + (line ? '  ' + line : '')))
    .concat('}').join('\n');

  const produtoControllerCode = (markCall, markReturn) =>
`@RestController
@RequestMapping("/produtos")
class ProdutoController {
  private final ProdutoService servico;

  @GetMapping
  List<Produto> listar() { ... }

  @PostMapping("/add-item")
  ResponseEntity<Produto> cadastrar(
      @RequestBody ProdutoDto dto) {
${markCall ? MARK : ''}    Produto produto = servico.cadastrar(dto);
${markReturn ? MARK : ''}    return ResponseEntity.status(201).body(produto);
  }
}`;

  const buildProduto = (pets, nextId, { nome, codigo }, env) => {
    const produtos = clone(env.produtos);
    const nextProdutoId = env.nextProdutoId;
    const row = produtos.find(p => p.codigo === codigo);
    const exists = Boolean(row);
    const dtoStr = `ProdutoDto(nome="${nome}", codigoDeBarras=${codigo})`;
    const repoIface = 'interface ProdutoRepository\n    extends JpaRepository<Produto, Long> {\n  boolean existsByCodigoDeBarras(Long codigoDeBarras);\n}';
    const dbSnap = (list, hl) => ({ pets, produtos: list, hl: { table: 'produtos', ...hl } });

    const steps = [
      {
        at: FRONT, kind: 'req', label: 'POST /produtos/add-item',
        title: 'O Front-End envia o produto',
        text: `A pessoa preencheu o nome "${nome}" e o código de barras ${codigo} e clicou em Cadastrar. A rota é POST /produtos/add-item: a rota base /produtos mais o /add-item.`,
        code: request('POST', '/produtos/add-item', { nome, codigoDeBarras: codigo })
      },
      {
        at: CONTROLLER, kind: 'req', label: 'POST /produtos/add-item',
        title: 'O Controller recebe: a rota e o dto',
        text: 'O @PostMapping("/add-item") soma o /add-item à rota base /produtos, e é por isso que este método atende o pedido. (O @GetMapping, sem parênteses, usaria só a rota base: GET /produtos.) O @RequestBody pega o JSON do corpo e preenche o dto, que é a variável parâmetro da função. Dentro dele ficam os valores.',
        code: produtoControllerCode(true, false),
        vars: [['servico', 'ProdutoService'], ['dto', dtoStr], ['dto.getNome()', `"${nome}"`], ['dto.getCodigoDeBarras()', String(codigo)]]
      },
      {
        at: SERVICE, kind: 'req', label: 'perguntar ao banco',
        title: 'O Service pergunta se o código já existe',
        text: `A primeira regra: não pode haver dois produtos com o mesmo código de barras. O cursor para na linha que pergunta ao banco: existe algum produto com o código ${codigo}? A pergunta passa pelo Repository.`,
        code: produtoServiceCode({ 2: MARK, 3: MARK }),
        vars: [['dto', dtoStr]]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'existsByCodigoDeBarras',
        title: 'O Repository faz a pergunta',
        text: 'O método existsByCodigoDeBarras() não vem pronto: basta declará-lo na interface e o Spring Data cria a consulta pelo nome.',
        code: `${repoIface}\n\n${MARK}boolean codigoExiste =\n${MARK}  repositorio.existsByCodigoDeBarras(${codigo}L);\n// gera: SELECT COUNT(*) > 0 FROM produtos\n//       WHERE codigo_de_barras = ${codigo}`,
        vars: [['codigoDeBarras', `${codigo}L`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'SELECT produtos',
        db: dbSnap(produtos, { type: 'read', ids: exists ? [row.id] : [], query: `codigo_de_barras = ${codigo}`, stopAtFirst: true }),
        title: exists ? 'O Banco acha o código' : 'O Banco não acha o código',
        text: exists
          ? `Olhe a tabela produtos: as linhas são lidas uma a uma até achar a ${row.nome}, que já tem o código ${codigo}. A contagem volta 1.`
          : `Olhe a tabela produtos: as linhas são lidas uma a uma e nenhuma tem o código ${codigo}. A contagem volta 0.`,
        code: `${MARK}SELECT COUNT(*) FROM produtos\n${MARK}WHERE codigo_de_barras = ${codigo};\n\n→ ${exists ? '1 (já existe)' : '0 (não existe)'}`,
        vars: [['contagem', exists ? '1' : '0']]
      },
      {
        at: REPOSITORY, kind: 'res', label: String(exists),
        title: `O Repository devolve ${exists}`,
        text: exists ? 'O banco achou 1 linha: o Repository devolve true, o código já existe.' : 'O banco não achou nenhuma linha: o Repository devolve false, o código está livre.',
        code: `${MARK}boolean codigoExiste =\n${MARK}  repositorio.existsByCodigoDeBarras(${codigo}L);\n${MARK}// voltou: ${exists}`,
        vars: [['codigoExiste', String(exists)]]
      }
    ];

    if (exists) {
      steps.push(
        {
          at: SERVICE, kind: 'err', label: 'código já existe',
          title: 'A condição é verdadeira: o cursor entra no if',
          text: 'codigoExiste vale true, então o if é verdadeiro: o cursor entra no bloco, executa o throw e o fluxo para ali. As linhas de baixo nunca rodam e nada é salvo.',
          code: produtoServiceCode({ 4: '\x02', 5: MARK, 6: MARK, 7: MARK }),
          vars: [['codigoExiste', 'true'], ['exceção', 'ResponseStatusException(BAD_REQUEST, "Código de barras já cadastrado")']]
        },
        {
          at: CONTROLLER, kind: 'err', label: '400 Bad Request',
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Spring converte o erro em 400',
          text: 'O Spring captura o ResponseStatusException e responde 400 Bad Request. O Controller não precisa escrever nada para isso.',
          code: '\x01// o Controller não escreve código para o erro:\n\x01// o Spring captura o ResponseStatusException\n\x01// e responde com o status que veio nele\n\n// resposta: 400 Bad Request',
          vars: [['status', '400 Bad Request']]
        },
        {
          at: FRONT, kind: 'err', label: '400',
          badge: { text: '400 Bad Request', tone: 'err' },
          title: 'O Front-End mostra o erro',
          text: 'A página avisa que o código de barras já está cadastrado. Nada foi salvo no banco.',
          code: response('400 Bad Request', { status: 400, erro: 'Bad Request', mensagem: 'Código de barras já cadastrado' })
        }
      );
      return { steps, final: { pets, nextId, produtos, nextProdutoId }, view: 'site', loading: 'Cadastrando produto…', result: { banner: { tone: 'err', text: 'Erro 400: Código de barras já cadastrado.' }, pets: null } };
    }

    const created = { id: nextProdutoId, nome, codigo };
    const after = [...produtos, created];
    const createdStr = `Produto(id=${created.id}, nome="${nome}", codigoDeBarras=${codigo})`;
    steps.push(
      {
        at: SERVICE, kind: 'res', label: 'pular o if',
        title: 'A condição é falsa: o cursor pula o if inteiro',
        text: 'codigoExiste vale false, então o if é falso. Quando isso acontece, o cursor pula o bloco inteiro, de { até } (as linhas apagadas), e vai direto para a próxima linha depois dele. Ele cria o Produto e para no save(), que manda gravar.',
        code: produtoServiceCode({ 4: '\x04', 5: '\x04', 6: '\x04', 7: '\x04', 8: '\x04', 10: '\x02', 11: '\x03', 12: MARK }),
        vars: [['codigoExiste', 'false'], ['produto', `Produto(id=null, nome="${nome}", codigoDeBarras=${codigo})`]]
      },
      {
        at: REPOSITORY, kind: 'req', label: 'save()',
        title: 'O Repository executa save()',
        text: 'O produto chega sem id. O INSERT não leva id: o banco gera sozinho.',
        code: `${MARK}Produto produtoSalvo = repositorio.save(produto);\n\n// gera: INSERT INTO produtos (nome, codigo_de_barras)\n//       VALUES ('${nome}', ${codigo})`,
        vars: [['produto', `Produto(id=null, nome="${nome}", codigoDeBarras=${codigo})`]]
      },
      {
        at: DATABASE, kind: 'req', label: 'INSERT',
        db: dbSnap(after, { type: 'insert', ids: [created.id] }),
        title: 'O Banco grava o produto',
        text: `O banco insere a linha e gera o id ${created.id}. Olhe a tabela produtos: o ${nome} apareceu.`,
        code: `${MARK}INSERT INTO produtos (nome, codigo_de_barras)\n${MARK}VALUES ('${nome}', ${codigo});\n\n→ 1 linha inserida\n→ id gerado pelo banco: ${created.id}`,
        vars: [['id gerado pelo banco', String(created.id)]]
      },
      {
        at: REPOSITORY, kind: 'res', label: `Produto #${created.id}`,
        title: 'O Repository devolve o produto com o id',
        text: `O produto, que estava com id null, volta com o id ${created.id}.`,
        code: `${MARK}Produto produtoSalvo = repositorio.save(produto);\n\n// antes: Produto(id=null, ...)\n${MARK}// agora: ${createdStr}`,
        vars: [['produtoSalvo', createdStr]]
      },
      {
        at: SERVICE, kind: 'res', label: `Produto #${created.id}`,
        title: 'O Service devolve o produto',
        text: 'Sem mais nada a fazer, o cursor vai para o return e fica ali até a resposta seguir para o Controller.',
        code: produtoServiceCode({ 13: MARK }),
        vars: [['produtoSalvo', createdStr]]
      },
      {
        at: CONTROLLER, kind: 'res', label: '201 Created',
        badge: { text: '201 Created', tone: 'ok' },
        title: 'O Controller responde 201 Created',
        text: 'O Controller monta a resposta com o status 201 e o produto no corpo.',
        code: produtoControllerCode(false, true) + '\n\n// resposta: 201 Created',
        vars: [['produto', createdStr], ['status', '201 Created']]
      },
      {
        at: FRONT, kind: 'res', label: '201',
        badge: { text: '201 Created', tone: 'ok' },
        title: 'O Front-End mostra o produto cadastrado',
        text: `Ciclo completo! A página recebe o 201 e mostra que o ${nome} foi adicionado.`,
        code: response('201 Created', { id: created.id, nome, codigoDeBarras: codigo })
      }
    );
    return { steps, final: { pets, nextId, produtos: after, nextProdutoId: nextProdutoId + 1 }, view: 'site', loading: 'Cadastrando produto…', result: { banner: { tone: 'ok', text: `Produto cadastrado com sucesso! ${nome} foi adicionado.` }, pets: null } };
  };

  window.Lab.flows = { produto: buildProduto, post: buildPost, get: buildGet, delete: buildDelete, schedule: buildSchedule, edit: buildEdit, petAgenda: buildPetAgenda };
})();
