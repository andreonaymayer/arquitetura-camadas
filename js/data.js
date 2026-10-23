window.Lab = window.Lab || {};

(() => {
  const svg = body => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  const ICONS = {
    monitor: svg('<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>'),
    map: svg('<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>'),
    brain: `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M21.33,12.91C21.42,14.46 20.71,15.95 19.44,16.86L20.21,18.35C20.44,18.8 20.47,19.33 20.27,19.8C20.08,20.27 19.69,20.64 19.21,20.8L18.42,21.05C18.25,21.11 18.06,21.14 17.88,21.14C17.37,21.14 16.89,20.91 16.56,20.5L14.44,18C13.55,17.85 12.71,17.47 12,16.9C11.5,17.05 11,17.13 10.5,17.13C9.62,17.13 8.74,16.86 8,16.34C7.47,16.5 6.93,16.57 6.38,16.56C5.59,16.57 4.81,16.41 4.08,16.11C2.65,15.47 1.7,14.07 1.65,12.5C1.57,11.78 1.69,11.05 2,10.39C1.71,9.64 1.68,8.82 1.93,8.06C2.3,7.11 3,6.32 3.87,5.82C4.45,4.13 6.08,3 7.87,3.12C9.47,1.62 11.92,1.46 13.7,2.75C14.12,2.64 14.56,2.58 15,2.58C16.36,2.55 17.65,3.15 18.5,4.22C20.54,4.75 22,6.57 22.08,8.69C22.13,9.8 21.83,10.89 21.22,11.82C21.29,12.18 21.33,12.54 21.33,12.91M16.33,11.5C16.9,11.57 17.35,12 17.35,12.57A1,1 0 0,1 16.35,13.57H15.72C15.4,14.47 14.84,15.26 14.1,15.86C14.35,15.95 14.61,16 14.87,16.07C20,16 19.4,12.87 19.4,12.82C19.34,11.39 18.14,10.27 16.71,10.33A1,1 0 0,1 15.71,9.33A1,1 0 0,1 16.71,8.33C17.94,8.36 19.12,8.82 20.04,9.63C20.09,9.34 20.12,9.04 20.12,8.74C20.06,7.5 19.5,6.42 17.25,6.21C16,3.25 12.85,4.89 12.85,5.81V5.81C12.82,6.04 13.06,6.53 13.1,6.56A1,1 0 0,1 14.1,7.56C14.1,8.11 13.65,8.56 13.1,8.56V8.56C12.57,8.54 12.07,8.34 11.67,8C11.19,8.31 10.64,8.5 10.07,8.56V8.56C9.5,8.61 9.03,8.21 9,7.66C8.92,7.1 9.33,6.61 9.88,6.56C10.04,6.54 10.82,6.42 10.82,5.79V5.79C10.82,5.13 11.07,4.5 11.5,4C10.58,3.75 9.59,4.08 8.59,5.29C6.75,5 6,5.25 5.45,7.2C4.5,7.67 4,8 3.78,9C4.86,8.78 5.97,8.87 7,9.25C7.5,9.44 7.78,10 7.59,10.54C7.4,11.06 6.82,11.32 6.3,11.13C5.57,10.81 4.75,10.79 4,11.07C3.68,11.34 3.68,11.9 3.68,12.34C3.68,13.08 4.05,13.77 4.68,14.17C5.21,14.44 5.8,14.58 6.39,14.57C6.24,14.31 6.11,14.04 6,13.76C5.81,13.22 6.1,12.63 6.64,12.44C7.18,12.25 7.77,12.54 7.96,13.08C8.36,14.22 9.38,15 10.58,15.13C11.95,15.06 13.17,14.25 13.77,13C14,11.62 15.11,11.5 16.33,11.5M18.33,18.97L17.71,17.67L17,17.83L18,19.08L18.33,18.97M13.68,10.36C13.7,9.83 13.3,9.38 12.77,9.33C12.06,9.29 11.37,9.53 10.84,10C10.27,10.58 9.97,11.38 10,12.19A1,1 0 0,0 11,13.19C11.57,13.19 12,12.74 12,12.19C12,11.92 12.07,11.65 12.23,11.43C12.35,11.33 12.5,11.28 12.66,11.28C13.21,11.31 13.68,10.9 13.68,10.36Z"/></svg>`,
    packageOpen: svg('<path d="M12 22v-9"/><path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z"/><path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13"/><path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z"/>'),
    database: svg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>')
  };

  const LANES = [
    {
      key: 'front', name: 'Front-End', sub: 'Interface', icon: ICONS.monitor, color: '#60a5fa',
      role: 'É o que a pessoa usuária vê e clica. Monta a requisição HTTP, envia ao servidor e mostra a resposta na tela.'
    },
    {
      key: 'controller', name: 'Controller', sub: 'Rotas e envio', icon: ICONS.map, color: '#fbbf24',
      role: 'Na prática, um arquivo Java (PetController.java). É a porta de entrada da API (@RestController): recebe a requisição, entrega para o Service e devolve o código de status HTTP.'
    },
    {
      key: 'service', name: 'Service', sub: 'Regras de negócio', icon: ICONS.brain, color: '#a78bfa',
      role: 'Na prática, um arquivo Java (PetService.java). É o cérebro da aplicação: valida dados, confere se o ID existe e decide se a operação pode ou não continuar.'
    },
    {
      key: 'repository', name: 'Repository', sub: 'Acesso aos dados', icon: ICONS.packageOpen, color: '#34d399',
      role: 'Na prática, um arquivo Java (PetRepository.java): interface do Spring Data / JPA. Só sabe conversar com o banco: save(), findAll(), deleteById()... sem regra de negócio.'
    },
    {
      key: 'database', name: 'Banco de Dados', sub: 'Database', icon: ICONS.database, color: '#f472b6',
      role: 'Onde os dados ficam guardados de forma permanente, organizados em tabelas, linhas e colunas.'
    }
  ];

  const SEED = [];

  const clone = value => JSON.parse(JSON.stringify(value));

  const SLOTS = ['08:00', '09:00', '10:00', '11:00'];
  const RACE_SLOT = '10:00';

  const store = {
    pets: clone(SEED),
    nextId: 1,
    agenda: [],
    nextAgendaId: 1,
    produtos: [{ id: 1, nome: 'Guitarra', codigo: 123 }],
    nextProdutoId: 2,
    showProdutos: false,
    reset() {
      this.pets = clone(SEED);
      this.nextId = 1;
      this.agenda = [];
      this.nextAgendaId = 1;
      this.produtos = [{ id: 1, nome: 'Guitarra', codigo: 123 }];
      this.nextProdutoId = 2;
      this.showProdutos = false;
    },
    ensureAgendaDemo() {
      if (this.pets.some(p => p.demo)) return;
      const safuaira = { id: this.nextId++, name: 'Safuaira', species: 'Gato', demo: true };
      const violenta = { id: this.nextId++, name: 'Violenta', species: 'Cachorro', demo: true };
      this.pets.push(safuaira, violenta);
      this.agenda.push(
        { id: this.nextAgendaId++, petId: safuaira.id, time: SLOTS[0] },
        { id: this.nextAgendaId++, petId: violenta.id, time: SLOTS[3] },
        { id: this.nextAgendaId++, petId: violenta.id, time: RACE_SLOT, stale: true }
      );
    }
  };

  const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const TOKEN = /(\/\/.*$)|(@\w+)|("(?:[^"\\]|\\.)*")|(\b(?:200 OK|201 Created|400 Bad Request|404 Not Found)\b)|(INSERT INTO|SELECT \* FROM|DELETE FROM|Corpo da requisição|Corpo da resposta|Resposta do servidor|Código)|\b([A-Za-z_]\w*)\b/gm;

  const KEYWORDS = new Set(['throw', 'new', 'if', 'return', 'public', 'void', 'var', 'class', 'interface', 'extends', 'private', 'final', 'null']);

  const attr = text => esc(text).replace(/"/g, '&quot;');

  const MARK = '\u0001';

  const highlightLine = (code, withTips) => {
    const glossary = window.Lab.glossary || {};
    const wrap = (cls, text, key) => {
      const tip = withTips && Object.hasOwn(glossary, key) ? ` tip" data-tip="${attr(key)}` : '';
      return `<span class="${cls}${tip}">${esc(text)}</span>`;
    };

    let out = '';
    let last = 0;
    for (const match of code.matchAll(TOKEN)) {
      out += esc(code.slice(last, match.index));
      const [text] = match;
      if (match[1]) out += `<span class="t-c">${esc(text)}</span>`;
      else if (match[2]) out += wrap('t-a', text, text);
      else if (match[3]) out += wrap('t-s', text, text.slice(1, -1));
      else if (match[4] || match[5]) out += wrap('t-x', text, text);
      else out += wrap(KEYWORDS.has(text) ? 't-k' : 't-w', text, text);
      last = match.index + text.length;
    }
    return out + esc(code.slice(last));
  };

  const MARKERS = /[\u0001\u0002\u0003\u0004]/g;
  const HAS_MARKER = /[\u0001-\u0004]/;

  const highlight = (code, withTips = true) => {
    if (!HAS_MARKER.test(code)) return highlightLine(code, withTips);
    return code.split('\n').map(line => {
      const kind = line.includes('\u0001') ? ' dbg final' : line.includes('\u0002') ? ' trace' : line.includes('\u0003') ? ' trace cont' : line.includes('\u0004') ? ' skip' : '';
      const content = highlightLine(line.replace(MARKERS, ''), withTips) || '&#8203;';
      return `<span class="ln${kind}">${content}</span>`;
    }).join('');
  };

  Object.assign(window.Lab, { LANES, store, clone, esc, highlight, SLOTS, RACE_SLOT });
})();
