(() => {
  const { store, clone, flows, board, SLOTS } = window.Lab;
  const slotStates = agenda => SLOTS.map(time => {
    const row = agenda.find(a => a.time === time);
    return { time, state: row && !row.stale ? 'taken' : 'free', race: Boolean(row && row.stale) };
  });

  const $ = id => document.getElementById(id);
  const btnRestart = $('btn-restart');
  const autoToggle = $('auto');
  const speedInput = $('speed');

  const state = { pre: false, editPetId: null, schedulePet: null, run: null, index: -1, busy: false, auto: false, speed: 1, token: 0 };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const updateButtons = () => {
    const run = state.run;
    document.querySelectorAll('[data-step="next"]').forEach(button => {
      button.disabled = !run || state.busy || state.index >= run.steps.length - 1;
    });
    document.querySelectorAll('[data-step="prev"]').forEach(button => {
      button.disabled = !run || state.busy || state.index < 0;
    });
    btnRestart.disabled = !run;
  };

  const commitRun = () => {
    const run = state.run;
    if (run && run.completed) {
      store.pets = clone(run.final.pets);
      store.nextId = run.final.nextId;
      if (run.final.agenda) {
        store.agenda = clone(run.final.agenda);
        store.nextAgendaId = run.final.nextAgendaId;
      }
    }
  };

  const PRE_HINT = {
    post: 'A requisição ainda não foi enviada. O formulário está aberto: troque o nome ou a espécie e clique em <b>Avançar ▶</b> (ou em <b>Enviar</b>) para mandar.',
    edit: 'A requisição ainda não foi enviada. Troque o novo nome no formulário e clique em <b>Avançar ▶</b> (ou em <b>Salvar</b>) para mandar.',
    schedule: 'Nada foi enviado ainda. Escolha um horário na página ou clique em <b>Avançar ▶</b> para enviar o mesmo pedido de antes.',
    other: 'Nada foi enviado ainda. Escolha a ação na página ou clique em <b>Avançar ▶</b> para enviar o mesmo pedido de antes.'
  };

  const enterPre = () => {
    const run = state.run;
    if (!run || state.busy) return;
    board.restoreMax();
    hideForm();
    state.token++;
    state.busy = false;
    state.pre = true;
    state.index = -1;
    run.completed = false;
    board.renderIdle(run.base);
    const input = run.input;
    if (run.kind === 'post') {
      board.setSite('ready', { mode: 'post' });
      $('post-modal').hidden = false;
    } else if (run.kind === 'edit') {
      board.setSite('ready', { mode: 'edit', action: 'edit', pets: run.base });
      state.editPetId = input.id;
      $('edit-name').value = input.nome;
      $('edit-modal').hidden = false;
    } else if (run.kind === 'get') {
      board.setSite('ready', { mode: 'get' });
    } else if (run.kind === 'schedule') {
      state.schedulePet = input.pet;
      board.setSite('ready', { mode: 'schedule', pet: input.pet, slots: slotStates(run.baseAgenda) });
    } else if (run.kind === 'petAgenda') {
      board.setSite('ready', { mode: 'agenda', action: 'agenda', title: 'Escolha um pet', pets: run.base });
    } else if (run.base.some(p => p.id === input.id)) {
      board.setSite('ready', { mode: 'delete', pets: run.base.filter(p => !run.baseAgenda.some(a => a.petId === p.id)) });
    } else {
      board.setSite('ready', { mode: 'delete', pets: [{ id: input.id, name: 'Pet desatualizado', species: 'este item já não existe' }] });
    }
    board.renderPre(run.title, run.steps.length, PRE_HINT[run.kind] || PRE_HINT.other);
    updateButtons();
  };

  const submitPre = () => {
    const run = state.run;
    let input = run.input;
    if (run.kind === 'post') input = postInput();
    if (run.kind === 'edit') input = { id: run.input.id, nome: $('edit-name').value };
    startFlow(run.kind, input);
  };

  const goTo = async index => {
    board.restoreMax();
    if (state.pre && index === 0) return submitPre();
    if (index === -1 && state.run && !state.pre) return enterPre();
    const run = state.run;
    if (!run || state.busy || index < 0 || index >= run.steps.length) return;
    state.busy = true;
    updateButtons();

    const previous = state.index;
    const step = run.steps[index];
    const from = previous >= 0 ? run.steps[previous].at : null;
    state.index = index;

    await board.travel(from, step.at, step.kind, step.label, 1000 / state.speed);
    if (run !== state.run) return;

    board.renderRun(run, index);
    if (index === run.steps.length - 1) run.completed = true;
    state.busy = false;
    updateButtons();
  };

  const autoplay = async () => {
    const token = ++state.token;
    while (state.auto && token === state.token && state.run && state.index < state.run.steps.length - 1) {
      await sleep(1300 / state.speed);
      if (!state.auto || token !== state.token) return;
      await goTo(state.index + 1);
    }
  };

  const begin = run => {
    board.restoreMax();
    hideForm();
    state.pre = false;
    state.token++;
    commitRun();
    state.busy = false;
    state.index = -1;
    state.run = run;
    run.base = clone(store.pets);
    run.baseAgenda = clone(store.agenda);
    run.completed = false;
    board.renderIdle(run.base, run.view === 'site' ? ['loading', run.loading] : null);
    goTo(0).then(() => {
      if (state.auto) autoplay();
    });
  };

  const startFlow = (kind, input) => {
    const run = flows[kind](clone(store.pets), store.nextId, input, { agenda: clone(store.agenda), nextAgendaId: store.nextAgendaId });
    run.title = {
      post: 'POST /pets — Cadastrar Pet',
      get: 'GET /pets — Listar Pets',
      schedule: `POST /agendamentos — Agendar ${input.time}`,
      edit: `PUT /pets/${input.id} — Editar nome`,
      petAgenda: `GET /agendamentos — Agenda do pet ${input.id}`,
      delete: `DELETE /pets/${input.id} — ${store.pets.some(p => p.id === input.id) ? 'Sucesso' : 'ID inexistente'}`
    }[kind];
    run.kind = kind;
    run.input = input;
    begin(run);
  };

  const hideForm = () => {
    $('post-modal').hidden = true;
    $('edit-modal').hidden = true;
  };

  const resetToIdle = () => {
    hideForm();
    state.token++;
    commitRun();
    state.busy = false;
    state.run = null;
    state.pre = false;
    state.index = -1;
    board.renderIdle(store.pets);
    updateButtons();
  };

  const awaitPostForm = () => {
    resetToIdle();
    board.setSite('ready', { mode: 'post' });
  };

  const awaitSite = () => {
    resetToIdle();
    board.setSite('ready', { mode: 'get' });
  };

  const postInput = () => ({ name: $('pet-name').value, species: $('pet-species').value });

  const runScenario = scenario => {
    if (scenario === 'post') return awaitPostForm();
    if (scenario === 'get') return awaitSite();
    if (scenario === 'edit') {
      resetToIdle();
      if (!store.pets.length) {
        return board.notice('<p><b>Não há nenhum pet para editar.</b></p><p>Cadastre um pet em <b>POST — Cadastrar Pet</b> e depois volte aqui.</p>');
      }
      return board.setSite('ready', { mode: 'edit', action: 'edit', pets: store.pets });
    }
    if (scenario === 'agenda') {
      resetToIdle();
      if (!store.pets.some(p => !p.demo)) {
        return board.notice('<p><b>Você ainda não tem um pet cadastrado.</b></p><p>Para ver a agenda, cadastre um pet em <b>POST — Cadastrar Pet</b> e depois volte aqui.</p><p>Assim você também vê o caso de um pet sem horários marcados.</p>');
      }
      store.ensureAgendaDemo();
      board.renderIdle(store.pets);
      return board.setSite('ready', { mode: 'agenda', action: 'agenda', title: 'Escolha um pet', pets: store.pets });
    }
    if (scenario === 'schedule') {
      resetToIdle();
      const dog = store.pets.find(p => p.species === 'Cachorro' && !p.demo);
      if (!dog) {
        return board.notice('<p><b>Falta um cachorro cadastrado.</b></p><p>Para agendar, cadastre um em <b>POST — Cadastrar Pet</b>, escolhendo a espécie <b>Cachorro</b>, e depois volte aqui.</p>');
      }
      store.ensureAgendaDemo();
      board.renderIdle(store.pets);
      state.schedulePet = dog;
      return board.setSite('ready', { mode: 'schedule', pet: dog, slots: slotStates(store.agenda) });
    }
    if (scenario === 'delete-ok') {
      const deletable = store.pets.filter(p => !store.agenda.some(a => a.petId === p.id));
      resetToIdle();
      if (!deletable.length) {
        return board.notice('<p><b>Não há nenhum pet que possa ser apagado.</b></p><p>Isso acontece quando:</p><ul><li>o banco está vazio, ou</li><li>todos os pets têm horário na agenda (a chave estrangeira impede apagar)</li></ul><p>Cadastre um pet em <b>POST — Cadastrar Pet</b> e depois volte aqui.</p>');
      }
      return board.setSite('ready', { mode: 'delete', pets: deletable });
    }
    resetToIdle();
    board.setSite('ready', { mode: 'delete', pets: [{ id: 999, name: 'Pet desatualizado', species: 'este item já não existe' }] });
  };

  const dropdown = $('scenario');
  const ddButton = dropdown.querySelector('.dd-btn');
  const ddList = dropdown.querySelector('.dd-list');
  const ddItems = [...ddList.querySelectorAll('li')];

  const setDropdown = open => {
    ddList.hidden = !open;
    ddButton.setAttribute('aria-expanded', String(open));
  };

  const pickScenario = item => {
    setDropdown(false);
    ddButton.focus();
    runScenario(item.dataset.value);
  };

  ddButton.addEventListener('click', () => setDropdown(ddList.hidden));

  ddItems.forEach(item => {
    item.addEventListener('click', () => pickScenario(item));
    item.addEventListener('keydown', event => {
      const index = ddItems.indexOf(item);
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pickScenario(item);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        ddItems[Math.max(0, index - 1)].focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        ddItems[Math.min(ddItems.length - 1, index + 1)].focus();
      }
    });
  });

  ddButton.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setDropdown(true);
      ddItems[event.key === 'ArrowUp' ? ddItems.length - 1 : 0].focus();
    }
  });

  document.addEventListener('click', event => {
    if (!dropdown.contains(event.target)) setDropdown(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !ddList.hidden) {
      setDropdown(false);
      ddButton.focus();
    }
  });

  $('close-form').addEventListener('click', () => {
    $('post-modal').hidden = true;
  });
  $('close-edit').addEventListener('click', () => {
    $('edit-modal').hidden = true;
  });
  $('edit-form').addEventListener('submit', event => {
    event.preventDefault();
    startFlow('edit', { id: state.editPetId, nome: $('edit-name').value });
  });
  $('post-form').addEventListener('submit', event => {
    event.preventDefault();
    startFlow('post', postInput());
  });

  document.addEventListener('click', event => {
    if (event.target.closest('#load-site')) startFlow('get', {});
    if (event.target.closest('#open-form')) {
      $('post-modal').hidden = false;
      $('pet-name').focus();
    }
    const step = event.target.closest('[data-step]');
    if (step && !step.disabled) goTo(state.index + (step.dataset.step === 'next' ? 1 : -1));
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const pet = store.pets.find(p => p.id === Number(edit.dataset.edit));
      if (pet) {
        state.editPetId = pet.id;
        $('edit-name').value = pet.name;
        $('edit-modal').hidden = false;
        $('edit-name').focus();
      }
    }
    const agendaButton = event.target.closest('[data-agenda]');
    if (agendaButton) startFlow('petAgenda', { id: Number(agendaButton.dataset.agenda) });
    const slot = event.target.closest('[data-slot]');
    if (slot && state.schedulePet) startFlow('schedule', { pet: state.schedulePet, time: slot.dataset.slot });
    const del = event.target.closest('[data-delete]');
    if (del) startFlow('delete', { id: Number(del.dataset.delete) });
  });


  btnRestart.addEventListener('click', () => {
    if (!state.run) return;
    state.token++;
    state.busy = false;
    state.pre = false;
    hideForm();
    state.index = -1;
    state.run.completed = false;
    board.renderIdle(state.run.base, state.run.view === 'site' ? ['loading', state.run.loading] : null);
    goTo(0).then(() => {
      if (state.auto) autoplay();
    });
  });

  $('btn-reset-db').addEventListener('click', () => {
    state.token++;
    state.busy = false;
    state.run = null;
    state.index = -1;
    store.reset();
    board.renderIdle(store.pets);
    updateButtons();
  });

  autoToggle.addEventListener('change', () => {
    state.auto = autoToggle.checked;
    if (state.auto) autoplay();
    else state.token++;
  });

  speedInput.addEventListener('input', () => {
    state.speed = Number(speedInput.value);
    window.Lab.speed = state.speed;
    $('speed-out').textContent = `${state.speed}x`;
  });

  document.addEventListener('keydown', event => {
    if (document.body.classList.contains('tour-open') || document.body.classList.contains('modal-open')) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight') goTo(state.index + 1);
    if (event.key === 'ArrowLeft') goTo(state.index - 1);
  });

  const sizeBoard = () => {
    const chrome = document.querySelector('.top').offsetHeight + document.querySelector('.dock').offsetHeight + 16;
    document.documentElement.style.setProperty('--chrome-h', `${chrome}px`);
    board.layoutRail();
  };
  window.addEventListener('resize', sizeBoard);
  new ResizeObserver(sizeBoard).observe(document.querySelector('.dock'));
  sizeBoard();

  window.Lab.hasProgress = () => store.pets.length > 0 || store.agenda.length > 0 || Boolean(state.run);

  const PRODUTO_SEED = [{ id: 1, nome: 'Guitarra', codigo: 123 }];

  window.Lab.demo = {
    show: async (input, index) => {
      board.restoreMax();
      hideForm();
      state.token++;
      state.busy = false;
      state.pre = false;
      window.Lab.demoActive = true;
      store.showProdutos = true;
      const run = flows.produto([], 1, input, { produtos: clone(PRODUTO_SEED), nextProdutoId: 2 });
      run.kind = 'produto';
      run.input = input;
      run.title = 'POST /produtos/add-item — Cadastrar produto';
      run.base = [];
      run.baseAgenda = [];
      run.baseProdutos = clone(PRODUTO_SEED);
      run.completed = false;
      state.run = run;
      state.index = index;
      board.renderIdle(run.base, null);
      const step = run.steps[index];
      await board.travel(null, step.at, step.kind, step.label, 10);
      board.renderRun(run, index);
      updateButtons();
    },
    form: async input => {
      board.restoreMax();
      hideForm();
      state.token++;
      state.busy = false;
      state.pre = false;
      window.Lab.demoActive = true;
      store.showProdutos = true;
      state.run = null;
      state.index = -1;
      board.renderIdle([], null);
      board.setSite('ready', { mode: 'produto-form', input });
      updateButtons();
    },
    reset: () => {
      window.Lab.demoActive = false;
      store.showProdutos = false;
      state.run = null;
      state.index = -1;
      state.pre = false;
      board.renderIdle(store.pets);
      updateButtons();
    }
  };

  board.renderIdle(store.pets);
  updateButtons();
})();
