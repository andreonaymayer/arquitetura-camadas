(() => {
  const byId = id => document.getElementById(id);
  const union = (...elements) => () => {
    const boxes = elements.map(element => (typeof element === 'function' ? element() : element)).filter(Boolean).map(element => element.getBoundingClientRect());
    if (!boxes.length) return null;
    const left = Math.min(...boxes.map(box => box.left));
    const top = Math.min(...boxes.map(box => box.top));
    const right = Math.max(...boxes.map(box => box.right));
    const bottom = Math.max(...boxes.map(box => box.bottom));
    return { left, top, width: right - left, height: bottom - top, right, bottom };
  };

  const HEART = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c1.9 0 3.4 1 4.2 2.4h3.6C14.6 6 16.1 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"/></svg>';

  const laneFull = index => () => {
    const el = document.querySelectorAll('.lane')[index];
    return union(el, el.querySelector('.node'), el.querySelector('.lane-head'))();
  };

  const GUITARRA = { nome: 'Guitarra', codigo: 123 };
  const VIOLAO = { nome: 'Violão', codigo: 456 };

  const exForm = (input, title, text, editable = false) => ({ title, target: laneFull(0), demo: { input, form: true, editable }, text });

  const ex = (input, index, lane, title, text) => ({ title, target: laneFull(lane), demo: { input, index }, text });

  const EXAMPLE_STEPS = [
    {
      title: 'Exemplo: cadastrar um produto',
      text: '<p>Agora vamos juntar tudo em um exemplo, <b>nas próprias raias</b>, olhando o código de perto. Quando o tutorial terminar, tudo volta ao programa dos pets.</p><p>Vamos cadastrar dois produtos em uma loja:</p><ul><li><b>Guitarra</b>, código de barras <b>123</b>: esse código <b>já existe no banco</b>, então vai dar erro, porque não se pode repetir o mesmo código de barras.</li><li><b>Violão</b>, código de barras <b>456</b>: esse código <b>não existe</b>, então vai cadastrar com sucesso.</li></ul><p>Vamos seguir cada pedido, raia por raia, sem pular nenhuma, para você ver por onde ele <b>entra</b>, o que o cursor faz linha por linha e como a resposta <b>sai</b>.</p>'
    },
    exForm(GUITARRA, 'Agora é com você: cadastre a Guitarra', '<p>Esta é a página da loja, e o formulário está vazio. Os campos são de verdade: é assim que a pessoa usa o sistema.</p><ol><li>Escreva <b>Guitarra</b> no nome</li><li>Escreva <b>123</b> no código de barras</li><li>Clique em <b>Cadastrar</b></li></ol><p>O botão <b>Avançar</b> só libera depois que você cadastrar.</p>', true),
    ex(GUITARRA, 0, 0, 'Guitarra (123): a pessoa clica em Cadastrar', '<p>Agora a pessoa clica em <b>Cadastrar</b>. A página fica carregando enquanto o front monta o pedido e envia.</p><p>Para saber onde bater, o front usa a rota. A rota completa junta duas partes do Controller:</p><ul><li><code>@RequestMapping("/produtos")</code>: a rota base, <code>/produtos</code></li><li><code>@PostMapping("/add-item")</code>: soma o <code>/add-item</code></li></ul><p>Juntando o <code>/produtos</code> com o <code>/add-item</code>, a rota fica: <code>POST /produtos/add-item</code>.</p><p>Os dados vão no corpo do pedido, em JSON.</p>'),
    ex(GUITARRA, 1, 1, 'Guitarra (123): o Controller recebe', '<p>O pedido chegou ao Controller pela rota <code>POST /produtos/add-item</code>, e é por isso que o método <code>cadastrar</code> é chamado. (O <code>@GetMapping</code>, sem parênteses, usaria só a rota base: <code>GET /produtos</code>.)</p><p>O <code>dto</code> é uma <b>variável parâmetro</b> da função. O <code>@RequestBody</code> pega o JSON e preenche essa variável. Olhe o painel <b>Variáveis</b>: dentro do <code>dto</code> estão os valores, e dá para pegar cada um com <code>dto.getNome()</code> e <code>dto.getCodigoDeBarras()</code>.</p><p>O cursor está na linha que entrega o <code>dto</code> ao Service.</p>'),
    ex(GUITARRA, 2, 2, 'Guitarra (123): o Service pergunta ao banco', '<p>No Service, o cursor para na linha que <b>pergunta ao banco</b>: existe algum produto com o código 123? Essa regra existe porque não pode haver dois produtos com o mesmo código de barras.</p><p>O Service não fala com o banco. Ele pede ao <b>Repository</b>.</p>'),
    ex(GUITARRA, 3, 3, 'Guitarra (123): o Repository faz a pergunta', '<p>O Repository recebe a pergunta pelo método <code>existsByCodigoDeBarras()</code>. Ele não vem pronto: basta declará-lo na interface e o Spring Data cria a consulta pelo nome.</p><p>Ele transforma a pergunta em um <code>SELECT</code> e manda ao banco.</p>'),
    ex(GUITARRA, 4, 4, 'Guitarra (123): o banco acha o código', '<p>O banco lê as linhas da tabela <b>produtos</b> uma a uma e <b>acha</b> a Guitarra, que já tem o código 123. A contagem volta 1.</p>'),
    ex(GUITARRA, 5, 3, 'Guitarra (123): o Repository devolve true', '<p>O banco achou 1 linha, então o Repository devolve <code>true</code>: o código já existe. A resposta volta ao Service.</p>'),
    ex(GUITARRA, 6, 2, 'Guitarra (123): o cursor entra no if', '<p>De volta ao Service, <code>codigoExiste</code> vale <code>true</code>. A condição do <code>if</code> é verdadeira, então o cursor <b>entra no bloco</b>, executa o <code>throw</code> e o fluxo <b>para ali</b>. As linhas de baixo nunca rodam e nada é salvo.</p><p>O erro sobe para o Controller.</p>'),
    ex(GUITARRA, 7, 1, 'Guitarra (123): o Spring converte o erro em 400', '<p>O erro passa pelo Controller. Quem o converte é o Spring: ele captura o <code>ResponseStatusException</code> e responde <b>400 Bad Request</b>. O Controller não precisa escrever nada para isso.</p>'),
    ex(GUITARRA, 8, 0, 'Guitarra (123): o erro chega ao front', '<p>A resposta 400 chega ao front, que avisa que o código de barras já está cadastrado. Nada foi salvo no banco.</p>'),
    exForm(VIOLAO, 'Agora é com você: cadastre o Violão', '<p>De novo, o formulário está vazio e você faz o papel da pessoa.</p><ol><li>Escreva <b>Violão</b> no nome</li><li>Escreva <b>456</b> no código de barras</li><li>Clique em <b>Cadastrar</b></li></ol>', true),
    ex(VIOLAO, 0, 0, 'Violão (456): a pessoa clica em Cadastrar', '<p>A pessoa clica em <b>Cadastrar</b> e o front envia o pedido.</p><p>A rota é a mesma: <code>POST /produtos/add-item</code>. Só os dados do corpo mudam.</p>'),
    ex(VIOLAO, 1, 1, 'Violão (456): o Controller recebe', '<p>O pedido entra pela mesma rota. Agora o <code>dto</code> guarda o nome <b>"Violão"</b> e o código de barras <b>456</b>: <code>dto.getNome()</code> e <code>dto.getCodigoDeBarras()</code>. O cursor entrega o <code>dto</code> ao Service.</p>'),
    ex(VIOLAO, 2, 2, 'Violão (456): o Service pergunta ao banco', '<p>O cursor para na linha que pergunta ao banco: existe algum produto com o código 456? Quem leva a pergunta é o <b>Repository</b>.</p>'),
    ex(VIOLAO, 3, 3, 'Violão (456): o Repository faz a pergunta', '<p>De novo, o Repository transforma a pergunta em um <code>SELECT</code> e manda ao banco, agora com o código 456.</p>'),
    ex(VIOLAO, 4, 4, 'Violão (456): o banco não acha', '<p>O banco lê a tabela inteira, linha por linha, e <b>não acha</b> nenhum produto com o código 456. A contagem volta 0.</p>'),
    ex(VIOLAO, 5, 3, 'Violão (456): o Repository devolve false', '<p>O banco não achou nenhuma linha, então o Repository devolve <code>false</code>: o código está livre. A resposta volta ao Service.</p>'),
    ex(VIOLAO, 6, 2, 'Violão (456): o cursor pula o if', '<p>De volta ao Service, <code>codigoExiste</code> vale <code>false</code>. A condição do <code>if</code> é falsa, então o cursor <b>pula o bloco inteiro</b>, de <code>{</code> até <code>}</code> (as linhas apagadas), e vai direto para a próxima linha depois dele.</p><p>Ele cria o <code>Produto</code> e para no <code>save()</code>, que manda gravar.</p>'),
    ex(VIOLAO, 7, 3, 'Violão (456): o Repository grava', '<p>O Repository recebe o produto, ainda sem id, e gera um <code>INSERT</code>. O id não vai no comando: quem gera é o banco.</p>'),
    ex(VIOLAO, 8, 4, 'Violão (456): o banco insere a linha', '<p>O banco grava a linha nova e gera o id 2. Olhe a tabela <b>produtos</b>: o Violão apareceu.</p>'),
    ex(VIOLAO, 9, 3, 'Violão (456): o Repository devolve o produto', '<p>O banco devolve o id gerado e o Repository preenche o produto, que estava com id null, com o id 2. A resposta volta ao Service.</p>'),
    ex(VIOLAO, 10, 2, 'Violão (456): o Service devolve o produto', '<p>De volta ao Service, o cursor vai para o <code>return</code> e fica ali, até a resposta seguir para o Controller.</p>'),
    ex(VIOLAO, 11, 1, 'Violão (456): o Controller responde 201', '<p>O Controller monta a resposta com o status <b>201 Created</b> e o produto no corpo.</p>'),
    ex(VIOLAO, 12, 0, 'Violão (456): a resposta chega ao front', '<p>Ciclo completo! A resposta <b>sai</b> e chega ao front, que mostra que o Violão foi adicionado.</p>')
  ];

  const STEPS = [
    {
      title: 'Bem-vinda, Ghaby, sua gostosa',
      heart: true,
      text: '<p>Agora é a hora de aprender esse padrão de projetos e o fluxo de dados para ser uma grande vencedora e sustentar o seu namorado Andreo, que não aguenta mais trabalhar.</p><p>Este painel mostra, passo a passo, o caminho que um dado percorre em um Back-End em camadas:<br><b>Front-End → Controller → Service → Repository → Banco de Dados</b><br>e a volta da resposta.</p><p>Use <b>Avançar</b> e <b>Voltar</b>, ou as teclas <b>← →</b>.</p>'
    },
    {
      title: 'As cinco raias',
      target: () => byId('lanes'),
      text: '<p>Cada coluna é uma camada, com uma cor e uma responsabilidade:</p><ul><li><b>Front-End</b>: a tela que a pessoa usa</li><li><b>Controller</b>: rotas e códigos HTTP</li><li><b>Service</b>: regras de negócio</li><li><b>Repository</b>: acesso aos dados</li><li><b>Banco de Dados</b>: as tabelas</li></ul><p>Controller, Service e Repository são, na prática, <b>arquivos Java</b>: <code>PetController.java</code>, <code>PetService.java</code> e <code>PetRepository.java</code>. O código de cada raia é o que está dentro deles.</p>'
    },
    {
      title: 'Escolha um cenário',
      target: () => byId('scenario'),
      text: '<p>Abra este menu para escolher o que simular:</p><ul><li><b>POST</b> — Cadastrar Pet</li><li><b>GET</b> — Listar Pets</li><li><b>PUT</b> — Editar nome do pet</li><li><b>POST</b> — Agendar horário<br><small>você precisa cadastrar um pet antes</small></li><li><b>GET</b> — Ver agenda de um pet</li><li><b>DELETE</b> — Sucesso</li><li><b>DELETE</b> — Erro 404</li></ul><p>Para começar, cadastre um pet.</p>'
    },
    {
      title: 'A página do Front-End',
      target: laneFull(0),
      text: '<p>Depois de escolher o cenário, esta raia mostra uma página simulada. É nela que você dispara a requisição:</p><ul><li>preenche o formulário do POST</li><li>clica em <b>Carregar site</b></li><li>escolhe um horário</li><li>clica em <b>Excluir</b>, <b>Editar</b> ou <b>Ver agenda</b></li></ul><p>Enquanto a resposta não chega, a página fica carregando. Depois, mostra o resultado. Se a lista ficar grande, a própria página rola por dentro.</p>'
    },
    {
      title: 'Avance passo a passo',
      target: () => document.querySelector('.step-nav') || byId('explain'),
      text: '<p>Nesta faixa aparece o <b>◀ Passo x de y ▶</b>.</p><p>Use as setinhas, ou as teclas <b>← →</b>, para avançar e voltar.</p><p>Voltando do passo 1, você chega ao <b>Passo 0</b>: antes de enviar. Ali dá para mudar os dados (por exemplo, o nome) e enviar de novo.</p><p>A bolinha percorre as camadas e o texto explica, em linguagem simples, o que acontece em cada passo.</p>'
    },
    {
      title: 'Automático e velocidade',
      target: () => document.querySelectorAll('.controls .group')[1],
      text: '<p>Marque <b>Automático</b> para o fluxo andar sozinho.</p><p>A <b>Velocidade</b> vai de 0,5x a 3x.</p>'
    },
    {
      title: 'O que cada passo mostra',
      target: laneFull(2),
      text: '<ul><li>A raia ativa ganha <b>destaque</b>.</li><li>No código, a <b>linha em destaque</b> é a que está sendo executada, como num debugger.</li><li>Abaixo do código, <b>Variáveis</b> mostra o valor de cada coisa naquele momento.</li><li>As raias que já passaram ficam como "Já passou por aqui".</li><li>Se o card ativo cobrir uma raia vizinha, passe o mouse nela: ela sai de trás e vem para a frente.</li></ul>'
    },
    {
      title: 'Passe o mouse no código',
      target: laneFull(1),
      text: '<p>Termos com sublinhado pontilhado explicam o que são, com um exemplo em Java, quando você passa o mouse por cima.</p><p>Por exemplo: <b>@RestController</b>, <b>Pet</b> e <b>save</b>.</p><p>Isso vale em todas as raias.</p>'
    },
    {
      title: 'As setas entre as raias',
      target: () => {
        const lanes = byId('lanes').getBoundingClientRect();
        const head = document.querySelector('.lane-head').getBoundingClientRect();
        const top = head.top - 40;
        const height = head.height + 52;
        return { left: lanes.left, top, width: lanes.width, height, right: lanes.right, bottom: top + height };
      },
      text: '<ul><li><b>Azul</b>: o dado indo</li><li><b>Verde</b>: a resposta voltando</li><li><b>Vermelho</b>: erro</li><li><b>Cinza e parado</b>: o que já aconteceu</li></ul><p>As pontas das setas mostram o sentido do fluxo.</p>'
    },
    {
      title: 'Expandir um card',
      target: () => document.querySelector('.lane-btn'),
      text: '<p>O quadradinho no canto de cada card o expande (60% da tela), para ler o código sem rolar.</p><p>Para restaurar: clique no mesmo botão, clique fora do card ou avance/volte um passo.</p>'
    },
    {
      title: 'Minimizar descrições',
      target: () => document.querySelector('.fold-btn'),
      text: '<p>As setinhas minimizam:</p><ul><li>a descrição da camada</li><li>o painel de <b>Variáveis</b></li><li>cada tabela do banco</li></ul><p>Assim sobra espaço quando o conteúdo aperta.</p>'
    },
    {
      title: 'O Banco de Dados',
      target: laneFull(4),
      text: '<p>Há duas tabelas: <b>pets</b> e <b>agenda</b>. A coluna <code>pet_id</code> é chave estrangeira para <code>pets.id</code>.</p><p>Quando o banco é consultado, a tabela ganha uma moldura e as linhas são lidas uma a uma. O aviso embaixo do nome mostra o que está sendo procurado. Cada tabela mostra até 5 linhas e o resto rola, com o cabeçalho fixo.</p><p>Na agenda, a linha com <b>AUTO</b> e <b>!</b> já existia no banco, mas a página ainda não sabia. Passe o mouse nela para ver.</p><p>Passe o mouse num pet: o balão diz se foi criado por você ou automaticamente (etiqueta <b>AUTO</b>: criados automaticamente para simular outros tutores).</p>'
    },
    {
      title: 'Cenário: agendar horário',
      text: '<p>O Service confere duas coisas, nesta ordem:</p><ol><li>se o pet existe</li><li>se o horário está livre</li></ol><p>O horário das <b>10:00</b> aparece disponível na página, mas já foi reservado por outra pessoa (a linha amarela com <b>AUTO</b> e <b>!</b> no banco). O Service descobre e a resposta é <b>400</b>.</p><p>O das <b>09:00</b> dá certo e volta <b>200</b>.</p>'
    },
    {
      title: 'Reiniciar e resetar',
      target: union(() => byId('btn-restart'), () => byId('btn-reset-db')),
      text: '<ul><li><b>Reiniciar fluxo</b>: volta o cenário atual ao passo 1</li><li><b>Resetar banco</b>: devolve os dados ao estado inicial, com as tabelas vazias</li></ul>'
    },
    ...EXAMPLE_STEPS,
    {
      title: 'Pronto!',
      heart: true,
      text: '<p>Agora, quando tu aprender essa porra, tu deve 1000 beijos ao Andreo por ele ser o melhor namorado do mundo e fazer esse negócio pra ti. Vai estudar, muié!</p><p>Comece escolhendo <b>POST — Cadastrar Pet</b>, preencha o formulário e vá avançando os passos.</p><p>Para rever este tutorial, use o botão <b>Tutorial</b> no topo.</p>',
      last: true
    }
  ];

  const layer = document.createElement('div');
  layer.className = 'tour';
  layer.hidden = true;
  layer.innerHTML = `
    <div class="tour-spot"></div>
    <section class="tour-card" role="dialog" aria-label="Tutorial">
      <div class="tour-bar"><i></i></div>
      <header class="tour-head">
        <span class="tour-count"></span>
        <button type="button" class="tour-close" aria-label="Fechar tutorial" title="Fechar tutorial">✕</button>
      </header>
      <div class="tour-body">
        <h3 class="tour-title"></h3>
        <div class="tour-text"></div>
        <footer class="tour-foot">
          <button type="button" class="btn" data-tour="prev">◀ Voltar</button>
          <button type="button" class="btn primary" data-tour="next">Avançar ▶</button>
        </footer>
      </div>
      <div class="tour-confirm" hidden>
        <h3 class="tour-title">Fechar o tutorial?</h3>
        <div class="tour-text"><p>Você pode abrir o tutorial de novo a qualquer momento pelo botão <b>Tutorial</b>, lá em cima, no canto direito da tela (destacado agora).</p></div>
        <footer class="tour-foot">
          <button type="button" class="btn" data-tour="keep">Continuar tutorial</button>
          <button type="button" class="btn primary" data-tour="leave">Sim, fechar</button>
        </footer>
      </div>
    </section>`;
  document.body.appendChild(layer);

  const love = document.createElement('div');
  love.className = 'love';
  love.hidden = true;
  love.innerHTML = `
    <section class="love-card" role="dialog" aria-label="Mensagem">
      <button type="button" class="love-close" aria-label="Fechar mensagem" title="Fechar mensagem">✕</button>
      <img class="love-photo" src="img/casal.jpeg" alt="Andreo e Ghaby juntos">
      <p class="love-text">Te amo, e tô contigo no bom e no mau tempo.<br>Tu é esperta, e vai conseguir. <span class="tour-heart">${HEART}</span></p>
    </section>`;
  document.body.appendChild(love);


  const spot = layer.querySelector('.tour-spot');
  const card = layer.querySelector('.tour-card');
  const countEl = layer.querySelector('.tour-count');
  const bodyEl = layer.querySelector('.tour-body');
  const confirmEl = layer.querySelector('.tour-confirm');
  const titleEl = bodyEl.querySelector('.tour-title');
  const textEl = bodyEl.querySelector('.tour-text');
  const barFill = layer.querySelector('.tour-bar i');
  const prevBtn = layer.querySelector('[data-tour="prev"]');
  const nextBtn = layer.querySelector('[data-tour="next"]');

  let index = 0;
  let isOpen = false;
  let demoOn = false;
  let confirming = false;

  const resolveBox = step => {
    const target = step.target && step.target();
    if (!target) return null;
    if (target.getBoundingClientRect) {
      if (target.scrollIntoView) target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return target.getBoundingClientRect();
    }
    return target;
  };

  const place = () => {
    const step = confirming ? { target: () => byId('btn-tutorial') } : STEPS[index];
    const box = resolveBox(step);
    const view = { width: window.innerWidth, height: window.innerHeight };
    const pad = 8;
    const gap = 14;

    if (box) {
      spot.style.left = `${box.left - pad}px`;
      spot.style.top = `${box.top - pad}px`;
      spot.style.width = `${box.width + pad * 2}px`;
      spot.style.height = `${box.height + pad * 2}px`;
    } else {
      spot.style.left = `${view.width / 2}px`;
      spot.style.top = `${view.height / 2}px`;
      spot.style.width = '0px';
      spot.style.height = '0px';
    }

    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const clampX = x => Math.min(Math.max(gap, x), view.width - width - gap);
    const clampY = y => Math.min(Math.max(gap, y), view.height - height - gap);
    let left = (view.width - width) / 2;
    let top = (view.height - height) / 2;

    if (box) {
      const centerX = box.left + box.width / 2 - width / 2;
      const centerY = box.top + box.height / 2 - height / 2;
      if (box.bottom + pad + gap + height <= view.height) {
        left = clampX(centerX);
        top = box.bottom + pad + gap;
      } else if (box.top - pad - gap - height >= 0) {
        left = clampX(centerX);
        top = box.top - pad - gap - height;
      } else if (box.right + pad + gap + width <= view.width) {
        left = box.right + pad + gap;
        top = clampY(centerY);
      } else if (box.left - pad - gap - width >= 0) {
        left = box.left - pad - gap - width;
        top = clampY(centerY);
      } else {
        left = clampX(centerX);
        top = clampY(view.height - height - gap);
      }
    }

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  };

  let followTimer = 0;

  const follow = (ms = 1300) => {
    const end = performance.now() + ms;
    layer.classList.add('follow');
    cancelAnimationFrame(followTimer);
    const tick = () => {
      if (!isOpen) return;
      place();
      if (performance.now() < end) followTimer = requestAnimationFrame(tick);
      else layer.classList.remove('follow');
    };
    tick();
  };

  const render = () => {
    const step = STEPS[index];
    countEl.textContent = `Tutorial · ${index + 1} de ${STEPS.length}`;
    titleEl.innerHTML = '';
    titleEl.append(step.title);
    if (step.heart) {
      const heart = document.createElement('span');
      heart.className = 'tour-heart';
      heart.setAttribute('aria-label', 'coração');
      heart.innerHTML = HEART;
      titleEl.append(' ', heart);
    }
    textEl.innerHTML = step.text;
    const editable = Boolean(step.demo && step.demo.editable);
    window.Lab.demoExpect = editable ? { nome: step.demo.input.nome, codigo: step.demo.input.codigo, onOk: () => go(1) } : null;
    if (step.demo) {
      demoOn = true;
      const shown = step.demo.form ? window.Lab.demo.form(step.demo.input, editable) : window.Lab.demo.show(step.demo.input, step.demo.index);
      shown.then(() => {
        place();
        follow();
      });
    } else if (demoOn) {
      demoOn = false;
      window.Lab.demo.reset();
    }
    barFill.style.width = `${((index + 1) / STEPS.length) * 100}%`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = editable;
    nextBtn.textContent = step.last ? 'Concluir' : 'Avançar ▶';
    place();
  };

  const showConfirm = value => {
    confirming = value;
    bodyEl.hidden = value;
    confirmEl.hidden = !value;
    place();
  };

  const open = (start = 0) => {
    index = start;
    isOpen = true;
    layer.hidden = false;
    document.body.classList.add('tour-open');
    showConfirm(false);
    render();
  };

  const close = () => {
    isOpen = false;
    confirming = false;
    if (demoOn) {
      demoOn = false;
      window.Lab.demo.reset();
    }
    layer.hidden = true;
    document.body.classList.remove('tour-open');
  };

  const askClose = () => showConfirm(true);

  const showLove = () => {
    love.hidden = false;
    document.body.classList.add('tour-open');
  };

  const hideLove = () => {
    love.hidden = true;
    document.body.classList.remove('tour-open');
  };

  const go = delta => {
    const next = index + delta;
    if (next < 0) return;
    if (next >= STEPS.length) {
      close();
      return showLove();
    }
    index = next;
    render();
  };

  love.querySelector('.love-close').addEventListener('click', hideLove);
  layer.querySelector('.tour-close').addEventListener('click', askClose);
  layer.querySelector('[data-tour="keep"]').addEventListener('click', () => showConfirm(false));
  layer.querySelector('[data-tour="leave"]').addEventListener('click', close);
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  document.addEventListener('keydown', event => {
    if (!love.hidden) {
      if (event.key === 'Escape') hideLove();
      return;
    }
    if (!isOpen) return;
    if (event.key === 'Escape') return confirming ? showConfirm(false) : askClose();
    if (confirming) return;
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  });

  window.addEventListener('resize', () => {
    if (isOpen) place();
  });

  window.addEventListener('scroll', () => {
    if (isOpen) place();
  });

  const button = byId('btn-tutorial');
  if (button) {
    button.addEventListener('click', () => {
      if (!window.Lab.hasProgress()) return open(0);
      window.Lab.board.confirmNotice(
        '<p><b>Abrir o tutorial vai resetar o banco.</b></p><p>Os pets e os agendamentos que você criou, e o fluxo que está em andamento, serão apagados.</p><p>Quer continuar?</p>',
        'Resetar e abrir tutorial',
        () => {
          byId('btn-reset-db').click();
          open(0);
        }
      );
    });
  }

  window.Lab.tutorial = { open, close };

  setTimeout(() => open(0), 400);
})();
