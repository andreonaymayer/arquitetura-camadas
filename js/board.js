(() => {
  const { LANES, esc, highlight } = window.Lab;

  const lanesEl = document.getElementById('lanes');
  const explainEl = document.getElementById('explain');

  const ICON_EXPAND = '<svg class="ic-expand" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
  const ICON_RESTORE = '<svg class="ic-restore" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>';
  const ICON_CHEVRON = '<svg class="ic-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  const lanes = LANES.map((lane, index) => {
    const el = document.createElement('article');
    el.className = 'lane';
    el.style.setProperty('--c', lane.color);
    el.innerHTML = `
      <div class="lane-top">
        <div class="node" title="${esc(lane.name)}">${lane.icon}</div>
        <header class="lane-head">
          <h2>${esc(lane.name)}</h2>
          <span>${esc(lane.sub)}</span>
        </header>
        <button type="button" class="lane-btn" data-expand="${index}" aria-label="Expandir ${esc(lane.name)}" title="Expandir / restaurar">${ICON_EXPAND}${ICON_RESTORE}</button>
      </div>
      <div class="role">
        <p>${esc(lane.role)}</p>
        <button type="button" class="fold-btn" data-fold="role" aria-label="Minimizar descrição" title="Minimizar / mostrar descrição">${ICON_CHEVRON}</button>
      </div>
      <div class="slot"></div>
      <div class="activity">
        <div class="activity-head"><span class="state">Nada a mostrar</span><span class="badge" hidden></span></div>
        <pre class="code"></pre>
        <div class="vars" hidden></div>
      </div>`;
    lanesEl.appendChild(el);
    return {
      el,
      node: el.querySelector('.node'),
      head: el.querySelector('.lane-head'),
      slot: el.querySelector('.slot'),
      state: el.querySelector('.state'),
      badge: el.querySelector('.badge'),
      code: el.querySelector('.code'),
      vars: el.querySelector('.vars'),
      index
    };
  });

  const gridGap = () => parseFloat(getComputedStyle(lanesEl).columnGap) || 22;

  const inside = (point, box) => point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;

  const peek = lane => {
    if (maxIndex !== null) return;
    const active = lanesEl.querySelector('.lane.active');
    if (!active || active === lane.el) return;
    const a = active.getBoundingClientRect();
    const b = lane.el.getBoundingClientRect();
    const isLeft = b.left < a.left;
    const overlap = isLeft ? b.right - a.left : a.right - b.left;
    if (overlap <= 0) return;
    const shift = overlap + gridGap();
    const view = document.documentElement.clientWidth;
    const roomAway = isLeft ? b.left - 8 : view - 8 - b.right;
    const moveHovered = Math.max(0, Math.min(shift, roomAway));
    const nudge = shift - moveHovered;
    lane.zone = { left: isLeft ? b.left : a.right, right: isLeft ? a.left : b.right, top: b.top, bottom: b.bottom };
    lane.el.style.setProperty('--shift', `${isLeft ? -moveHovered : moveHovered}px`);
    lane.el.classList.add('peek');
    if (nudge > 0) {
      active.style.setProperty('--nudge', `${isLeft ? nudge : -nudge}px`);
      active.classList.add('nudged');
      lane.nudgedEl = active;
    }
    followLayout();
  };

  const dropPeek = lane => {
    lane.el.classList.remove('peek');
    if (lane.nudgedEl) {
      lane.nudgedEl.classList.remove('nudged');
      lane.nudgedEl = null;
      followLayout();
    }
  };

  const clearPeek = () => lanes.forEach(dropPeek);

  lanes.forEach(lane => {
    lane.el.addEventListener('pointermove', () => {
      if (!lane.el.classList.contains('peek')) peek(lane);
    });
  });

  document.addEventListener('pointermove', event => {
    const point = { x: event.clientX, y: event.clientY };
    lanes.forEach(lane => {
      if (!lane.el.classList.contains('peek')) return;
      if (!inside(point, lane.el.getBoundingClientRect()) && !inside(point, lane.zone)) dropPeek(lane);
    });
  });

  document.addEventListener('mouseleave', clearPeek);

  let maxIndex = null;

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  document.body.appendChild(backdrop);

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const linkLayer = document.createElementNS(SVG_NS, 'svg');
  linkLayer.setAttribute('class', 'links');
  const links = lanes.slice(1).map(() => {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'link');
    group.dataset.dir = 'right';
    group.dataset.kind = '';
    group.innerHTML = '<path class="link-line"></path><polygon class="link-head"></polygon>';
    linkLayer.appendChild(group);
    return group;
  });
  const pulse = document.createElement('div');
  pulse.className = 'pulse';
  pulse.hidden = true;
  pulse.innerHTML = '<span class="pulse-label"></span><span class="pulse-dot"></span>';
  lanesEl.append(linkLayer, pulse);

  lanes[0].slot.innerHTML = `
    <div class="site" id="site" hidden>
      <div class="site-bar"><i></i><i></i><i></i><span class="site-url">meusite.com/pets</span></div>
      <div class="site-view" id="site-view"></div>
    </div>`;
  const siteEl = lanes[0].slot.querySelector('#site');
  const siteView = lanes[0].slot.querySelector('#site-view');
  lanes[0].el.insertAdjacentHTML('beforeend', `
    <div class="modal site" id="post-modal" hidden>
      <div class="site-bar"><i></i><i></i><i></i><span class="site-url">meusite.com/pets/novo</span>
        <button type="button" class="modal-close" id="close-form" aria-label="Fechar">✕</button>
      </div>
      <form id="post-form" class="site-form" autocomplete="off">
        <h4>Cadastrar Pet</h4>
        <label>Nome<input id="pet-name" placeholder="Ex.: Rebuaica" value="Cacai" maxlength="40"></label>
        <label>Espécie
          <select id="pet-species">
            <option>Cachorro</option><option>Gato</option><option>Pássaro</option><option>Coelho</option><option>Hamster</option>
          </select>
        </label>
        <button class="site-btn" type="submit">Enviar</button>
      </form>
    </div>`);

  lanes[0].el.insertAdjacentHTML('beforeend', `
    <div class="modal site" id="edit-modal" hidden>
      <div class="site-bar"><i></i><i></i><i></i><span class="site-url">meusite.com/pets/editar</span>
        <button type="button" class="modal-close" id="close-edit" aria-label="Fechar">✕</button>
      </div>
      <form id="edit-form" class="site-form" autocomplete="off">
        <h4>Editar nome do pet</h4>
        <label>Novo nome<input id="edit-name" placeholder="Ex.: Rebuaica" maxlength="40"></label>
        <button class="site-btn" type="submit">Salvar</button>
      </form>
    </div>`);

  const dbSlot = lanes[4].slot;
  dbSlot.innerHTML = `
    <section class="db-block" id="table-pets">
      <div class="db-caption" data-fold="table" title="Minimizar / mostrar tabela">tabela <code>pets</code><span class="scan-note"></span>${ICON_CHEVRON}</div>
      <div class="db-scroll">
        <table class="db-table">
          <thead><tr><th>id</th><th>nome</th><th>especie</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
    <section class="db-block" id="table-agenda" hidden>
      <div class="db-caption" data-fold="table" title="Minimizar / mostrar tabela">tabela <code>agenda</code> <small>pet_id → pets.id</small><span class="scan-note"></span>${ICON_CHEVRON}</div>
      <div class="db-scroll">
        <table class="db-table">
          <thead><tr><th>id</th><th>pet_id</th><th>horario</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
    <section class="db-block" id="table-produtos" hidden>
      <div class="db-caption" data-fold="table" title="Minimizar / mostrar tabela">tabela <code>produtos</code><span class="scan-note"></span>${ICON_CHEVRON}</div>
      <div class="db-scroll">
        <table class="db-table">
          <thead><tr><th>id</th><th>nome</th><th>codigo_de_barras</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>`;
  const petsTable = dbSlot.querySelector('#table-pets');
  const tbody = petsTable.querySelector('tbody');
  const agendaTable = dbSlot.querySelector('#table-agenda');
  const agendaBody = agendaTable.querySelector('tbody');
  const produtosTable = dbSlot.querySelector('#table-produtos');
  const produtosBody = produtosTable.querySelector('tbody');

  const VISIBLE_ROWS = 5;

  const fitTable = block => {
    const scroll = block.querySelector('.db-scroll');
    const head = block.querySelector('thead').offsetHeight;
    const rows = block.querySelectorAll('tbody tr');
    const row = rows[0];
    if (!row || !row.offsetHeight) return;
    scroll.style.maxHeight = `${head + row.offsetHeight * VISIBLE_ROWS + 2}px`;
    scroll.style.overflowY = rows.length > VISIBLE_ROWS ? 'auto' : 'hidden';
  };

  const revealRow = (block, row) => {
    const scroll = block.querySelector('.db-scroll');
    const head = block.querySelector('thead').offsetHeight;
    const top = row.offsetTop - head;
    const bottom = row.offsetTop + row.offsetHeight;
    if (top < scroll.scrollTop) scroll.scrollTop = top;
    else if (bottom > scroll.scrollTop + scroll.clientHeight) scroll.scrollTop = bottom - scroll.clientHeight;
  };

  const MIN_ROWS = 5;

  let pulsePos = null;

  const center = el => {
    const box = el.getBoundingClientRect();
    const base = lanesEl.getBoundingClientRect();
    return { x: box.left - base.left + box.width / 2, y: box.top - base.top + box.height / 2 };
  };

  const place = point => {
    pulse.style.transform = `translate(${point.x}px, ${point.y}px)`;
  };

  const ARC_GAP = 14;

  const arrowHead = (tip, angle, size) => {
    const point = (da, length) => `${tip.x + Math.cos(angle + da) * length},${tip.y + Math.sin(angle + da) * length}`;
    return `${tip.x},${tip.y} ${point(Math.PI - 0.5, size)} ${point(Math.PI + 0.5, size)}`;
  };

  const layoutRail = () => {
    if (maxIndex !== null) return;
    const base = lanesEl.getBoundingClientRect();
    linkLayer.setAttribute('width', base.width);
    linkLayer.setAttribute('height', base.height);
    const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    links.forEach((group, i) => {
      const a = lanes[i].head.getBoundingClientRect();
      const b = lanes[i + 1].head.getBoundingClientRect();
      const start = { x: a.left - base.left + a.width / 2 + ARC_GAP / 2, y: a.top - base.top - unit * 0.5 };
      const end = { x: b.left - base.left + b.width / 2 - ARC_GAP / 2, y: b.top - base.top - unit * 0.5 };
      const rise = unit * 1.7;
      const reach = (end.x - start.x) * 0.3;
      const c1 = { x: start.x + reach, y: start.y - rise };
      const c2 = { x: end.x - reach, y: end.y - rise };
      group.querySelector('.link-line').setAttribute('d', `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`);

      const pointsRight = group.dataset.dir === 'right';
      const tip = pointsRight ? end : start;
      const from = pointsRight ? c2 : c1;
      const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
      group.querySelector('.link-head').setAttribute('points', arrowHead(tip, angle, unit * 0.6));
    });
    if (pulsePos !== null) place(center(lanes[pulsePos].node));
  };

  const setLinks = states => {
    links.forEach((link, i) => {
      const state = states[i];
      link.dataset.dir = state ? state.dir : 'right';
      link.dataset.kind = state ? state.kind : '';
    });
    layoutRail();
  };

  window.addEventListener('resize', layoutRail);
  layoutRail();

  const SCROLL_MARGIN = 24;

  const scrollToLane = index => {
    const container = lanesEl.getBoundingClientRect();
    const cell = (lanesEl.clientWidth - gridGap() * (lanes.length - 1)) / lanes.length;
    const origin = container.left + window.scrollX;
    const leftOf = i => origin + i * (cell + gridGap());
    const view = document.documentElement.clientWidth;

    let from = leftOf(Math.max(0, index - 1)) - SCROLL_MARGIN;
    let to = leftOf(Math.min(lanes.length - 1, index + 1)) + cell + SCROLL_MARGIN;
    if (to - from > view) {
      from = leftOf(index) - SCROLL_MARGIN;
      to = leftOf(index) + cell + SCROLL_MARGIN;
    }

    const max = document.documentElement.scrollWidth - view;
    const target = Math.min(Math.max(0, (from + to) / 2 - view / 2), Math.max(0, max));
    window.scrollTo({ left: target, behavior: 'smooth' });
  };

  const travel = async (from, to, kind, label, duration) => {
    pulse.hidden = false;
    pulse.classList.remove('rest');
    pulse.dataset.kind = kind;
    pulse.querySelector('.pulse-label').textContent = label;
    pulse.getAnimations().forEach(animation => animation.cancel());

    const target = center(lanes[to].node);
    scrollToLane(to);

    if (from === null || from === to) {
      place(target);
      pulsePos = to;
      const pop = pulse.animate(
        [{ transform: `translate(${target.x}px, ${target.y}px) scale(0.4)` }, { transform: `translate(${target.x}px, ${target.y}px) scale(1.25)` }, { transform: `translate(${target.x}px, ${target.y}px) scale(1)` }],
        { duration: Math.min(duration, 500), easing: 'ease-out' }
      );
      await pop.finished.catch(() => {});
      if (pulsePos === to) pulse.classList.add('rest');
      return;
    }

    const origin = center(lanes[from].node);
    pulsePos = to;
    const move = pulse.animate(
      [{ transform: `translate(${origin.x}px, ${origin.y}px)` }, { transform: `translate(${target.x}px, ${target.y}px)` }],
      { duration, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' }
    );
    await move.finished.catch(() => {});
    if (pulsePos === to) {
      move.cancel();
      place(target);
      pulse.classList.add('rest');
    }
  };

  const followLayout = () => {
    const end = performance.now() + 600;
    const tick = () => {
      layoutRail();
      if (performance.now() < end) requestAnimationFrame(tick);
    };
    tick();
  };

  const petOrigin = pet => pet.demo
    ? `data-tip-title="${esc(pet.name)}: criado automaticamente" data-tip-text="Você não cadastrou este pet. O sistema o criou sozinho, junto com horários já marcados na agenda, para simular outros tutores e mostrar como o Service reage a horários ocupados."`
    : `data-tip-title="${esc(pet.name)}: criado por você" data-tip-text="Este pet foi cadastrado por você no POST. Cada cadastro gera um id novo no banco."`;

  const ACTIONS = {
    delete: { label: 'Excluir', attr: 'data-delete', cls: 'del' },
    edit: { label: 'Editar', attr: 'data-edit', cls: 'act' },
    agenda: { label: 'Ver agenda', attr: 'data-agenda', cls: 'act' }
  };

  const petCards = (pets, { highlight = null, action = null } = {}) => pets.map(pet => `
    <li${pet.id === highlight ? ' class="new"' : ''} ${pet.id > 0 && pet.species !== 'este item já não existe' ? petOrigin(pet) : ''}>
      <span class="avatar">${esc(pet.name.charAt(0).toUpperCase())}</span>
      <div><b>${esc(pet.name)}${pet.demo ? ' <span class="auto-badge">auto</span>' : ''}</b><small>${esc(pet.species)}</small></div>
      ${action ? `<button type="button" class="${ACTIONS[action].cls}" ${ACTIONS[action].attr}="${pet.id}">${ACTIONS[action].label}</button>` : ''}
    </li>`).join('');

  const agendaHtml = ({ pet, rows }) => `
    <h4>Agenda de ${esc(pet.name)} <small>(${rows.length})</small></h4>
    ${rows.length ? `<ul class="pet-list">${rows.map(row => `<li><span class="avatar">${esc(row.time.slice(0, 2))}h</span><div><b>${esc(row.time)}</b><small>Horário marcado</small></div></li>`).join('')}</ul>` : '<p class="site-hint">Nenhum horário marcado para este pet.</p>'}`;

  const slotsHtml = ({ pet, slots }, clickable) => `
    <h4>Agendar horário <small>para ${esc(pet.name)}</small></h4>
    <div class="slots">${slots.map(slot => {
      const race = clickable && slot.state === 'free' && slot.race;
      const label = slot.state === 'taken' ? 'Ocupado' : slot.state === 'mine' ? 'Seu horário' : race ? 'Já reservado' : 'Livre';
      const disabled = slot.state !== 'free' || !clickable;
      return `<button type="button" class="slot-btn ${slot.state}${race ? ' race' : ''}" ${disabled ? 'disabled' : `data-slot="${slot.time}"`}><b>${slot.time}</b><small>${label}</small></button>`;
    }).join('')}</div>
    ${clickable ? '<p class="slot-warn">Aviso (simulação): outra pessoa já reservou o horário marcado com o aviso enquanto esta página estava aberta. A página ainda não sabe e o mostra como disponível, mas no banco ele não está livre de verdade.</p>' : ''}`;

  const setSite = (state, payload = null) => {
    siteEl.hidden = !state;
    if (state === 'ready') {
      const mode = payload.mode;
      if (mode === 'post') {
        siteView.innerHTML = '<h4>Novo pet</h4><p class="site-hint">Preencha os dados para cadastrar um pet.</p><button type="button" class="site-btn" id="open-form">Preencher formulário</button>';
      } else if (mode === 'produto-form') {
        const editable = Boolean(payload.editable);
        const field = (id, label, value, placeholder) => `<label>${label}<input id="${id}" autocomplete="off" ${editable ? `placeholder="${placeholder}"` : `readonly value="${esc(value)}"`}></label>`;
        siteView.innerHTML = `<h4>Cadastrar produto</h4><div class="demo-form${editable ? ' editable' : ''}">${field('demo-nome', 'Nome', payload.input.nome, 'Ex.: Guitarra')}${field('demo-codigo', 'Código de barras', payload.input.codigo, 'Ex.: 123')}<p class="demo-hint" hidden></p><button type="button" class="site-btn" id="demo-submit">Cadastrar</button></div>`;
      } else if (mode === 'schedule') {
        siteView.innerHTML = slotsHtml(payload, true);
      } else if (mode === 'get') {
        siteView.innerHTML = '<p class="site-hint">Ao acessar, vai buscar dados no servidor.</p><button type="button" class="site-btn" id="load-site">Carregar site</button>';
      } else {
        siteView.innerHTML = `<h4>${esc(payload.title || 'Meus Pets')} <small>(${payload.pets.length})</small></h4><ul class="pet-list">${petCards(payload.pets, { action: payload.action || 'delete' })}</ul>`;
      }
    } else if (state === 'loading') {
      siteView.innerHTML = `<div class="site-loading"><span class="spinner"></span><b>${esc(payload)}</b></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton short"></div>`;
    } else if (state === 'done') {
      const banner = payload.banner ? `<div class="banner ${payload.banner.tone}">${esc(payload.banner.text)}</div>` : '';
      const list = payload.agendaOf
        ? agendaHtml(payload.agendaOf)
        : payload.schedule
        ? slotsHtml(payload.schedule, false)
        : payload.pets === null ? '' : `<h4>Meus Pets <small>(${payload.pets.length})</small></h4>${payload.pets.length ? `<ul class="pet-list">${petCards(payload.pets, { highlight: payload.highlight })}</ul>` : '<p class="site-hint">Nenhum pet cadastrado ainda.</p>'}`;
      siteView.innerHTML = banner + list;
    }
  };

  let traceTimers = [];

  const cancelTrace = () => {
    traceTimers.forEach(clearTimeout);
    traceTimers = [];
  };

  const revealIn = (codeEl, line) => {
    const top = line.offsetTop;
    const bottom = top + line.offsetHeight;
    if (top < codeEl.scrollTop) codeEl.scrollTop = top;
    else if (bottom > codeEl.scrollTop + codeEl.clientHeight) codeEl.scrollTop = bottom - codeEl.clientHeight;
  };

  const runTrace = codeEl => {
    const lines = [...codeEl.querySelectorAll('.ln.trace')];
    if (!lines.length) return;
    const groups = [];
    lines.forEach(line => {
      if (line.classList.contains('cont') && groups.length) groups[groups.length - 1].push(line);
      else groups.push([line]);
    });
    const finals = [...codeEl.querySelectorAll('.ln.final')];
    finals.forEach(line => line.classList.remove('dbg'));
    const delay = 420 / (window.Lab.speed || 1);
    groups.forEach((group, i) => {
      traceTimers.push(setTimeout(() => {
        if (i > 0) groups[i - 1].forEach(line => line.classList.remove('dbg'));
        group.forEach(line => line.classList.add('dbg'));
        revealIn(codeEl, group[0]);
      }, (i + 1) * delay));
    });
    traceTimers.push(setTimeout(() => {
      groups[groups.length - 1].forEach(line => line.classList.remove('dbg'));
      finals.forEach(line => line.classList.add('dbg'));
      if (finals[0]) revealIn(codeEl, finals[0]);
    }, (groups.length + 1) * delay));
  };

  let scanTimers = [];

  const cancelScan = () => {
    scanTimers.forEach(clearTimeout);
    scanTimers = [];
    [petsTable, agendaTable, produtosTable].forEach(table => {
      table.querySelectorAll('tr.scanning').forEach(row => row.classList.remove('scanning'));
      const note = table.querySelector('.scan-note');
      note.textContent = '';
      note.dataset.state = '';
    });
  };

  const runScan = (table, hl) => {
    const rows = [...table.querySelectorAll('tbody tr[data-id]')];
    const note = table.querySelector('.scan-note');
    const delay = 420 / (window.Lab.speed || 1);
    let index = 0;
    let anyHit = false;

    const finish = () => {
      if (index > 0 && rows[index - 1]) rows[index - 1].classList.remove('scanning');
      const total = hl.ids.length;
      note.dataset.state = anyHit ? 'found' : 'miss';
      note.textContent = hl.stopAtFirst || total <= 1
        ? (anyHit ? 'encontrado' : 'não encontrado')
        : `${total} ${total === 1 ? 'linha encontrada' : 'linhas encontradas'}`;
    };

    const step = () => {
      if (index > 0) rows[index - 1].classList.remove('scanning');
      if (index >= rows.length) return finish();
      const row = rows[index];
      revealRow(table, row);
      if (row.dataset.hit === '1') {
        anyHit = true;
        row.classList.add(`hl-${hl.type}`);
        if (hl.stopAtFirst) {
          index += 1;
          return finish();
        }
      } else {
        row.classList.add('scanning');
      }
      index += 1;
      scanTimers.push(setTimeout(step, delay));
    };

    note.dataset.state = 'search';
    note.textContent = `procurando ${hl.query}…`;
    step();
  };

  const renderDb = (pets, agenda, hl, showGhost, active = false, produtos = null) => {
    cancelScan();
    const scanning = Boolean(active && hl && hl.query && (hl.type === 'read' || hl.type === 'update'));
    const hlTable = hl ? (hl.table || 'pets') : null;
    const petHl = hl && hlTable === 'pets' ? hl : null;
    const rows = pets.map(pet => {
      const matches = petHl && petHl.ids.includes(pet.id);
      const cls = matches && !(scanning && hlTable === 'pets') ? `hl-${petHl.type}` : '';
      return `<tr class="${cls}" data-id="${pet.id}" ${matches ? 'data-hit="1"' : ''} ${petOrigin(pet)}><td>${pet.id}</td><td>${esc(pet.name)}${pet.demo ? ' <span class="auto-badge">auto</span>' : ''}</td><td>${esc(pet.species)}</td></tr>`;
    });
    if (showGhost && petHl && petHl.ghost) {
      rows.push(`<tr class="hl-ghost"><td>${petHl.ghost.id}</td><td>${esc(petHl.ghost.name)}</td><td>${esc(petHl.ghost.species)}</td></tr>`);
    }
    while (rows.length < MIN_ROWS) rows.push('<tr class="slot"><td>&nbsp;</td><td></td><td></td></tr>');
    tbody.innerHTML = rows.join('');

    const demo = Boolean(window.Lab.demoActive);
    petsTable.hidden = demo;
    agendaTable.hidden = demo || (!(agenda && agenda.length) && !(hl && hl.table === 'agenda'));
    const agendaHl = hl && hl.table === 'agenda' ? hl : null;
    const agendaRows = (agenda || []).map(row => {
      const matches = agendaHl && agendaHl.ids.includes(row.id);
      const cls = `${matches && !(scanning && hlTable === 'agenda') ? `hl-${agendaHl.type}` : ''} ${row.stale ? 'stale' : ''}`;
      const tip = row.stale ? 'data-tip-title="Já existia" data-tip-text="Esta reserva já existia no banco, mas a página ainda não sabia porque não tinha sido atualizada. Por isso o horário aparece livre para quem está na tela."' : '';
      const marks = row.stale ? ' <span class="auto-badge">auto</span> <span class="warn-icon" aria-label="aviso">!</span>' : '';
      return `<tr class="${cls}" data-id="${row.id}" ${matches ? 'data-hit="1"' : ''} ${tip}><td>${row.id}</td><td>${row.petId}</td><td>${esc(row.time)}${marks}</td></tr>`;
    });
    while (agendaRows.length < 4) agendaRows.push('<tr class="slot"><td>&nbsp;</td><td></td><td></td></tr>');
    agendaBody.innerHTML = agendaRows.join('');

    const produtosHl = hl && hl.table === 'produtos' ? hl : null;
    produtosTable.hidden = !(window.Lab.store.showProdutos || produtosHl);
    const produtoRows = (produtos || []).map(row => {
      const matches = produtosHl && produtosHl.ids.includes(row.id);
      const cls = matches && !(scanning && hlTable === 'produtos') ? `hl-${produtosHl.type}` : '';
      return `<tr class="${cls}" data-id="${row.id}" ${matches ? 'data-hit="1"' : ''}><td>${row.id}</td><td>${esc(row.nome)}</td><td>${row.codigo}</td></tr>`;
    });
    while (produtoRows.length < 3) produtoRows.push('<tr class="slot"><td>&nbsp;</td><td></td><td></td></tr>');
    produtosBody.innerHTML = produtoRows.join('');

    [petsTable, agendaTable, produtosTable].forEach(block => {
      if (!block.hidden && !block.classList.contains('folded')) fitTable(block);
    });
    if (!scanning && hl) {
      const block = hlTable === 'agenda' ? agendaTable : hlTable === 'produtos' ? produtosTable : petsTable;
      const marked = block.querySelector('tbody tr[class*="hl-"]');
      if (marked && !block.hidden) revealRow(block, marked);
    }
    petsTable.classList.toggle('queried', Boolean(active && hl && hlTable === 'pets'));
    agendaTable.classList.toggle('queried', Boolean(active && hl && hlTable === 'agenda'));
    produtosTable.classList.toggle('queried', Boolean(active && hl && hlTable === 'produtos'));
    if (scanning) runScan(hlTable === 'agenda' ? agendaTable : hlTable === 'produtos' ? produtosTable : petsTable, hl);
  };

  const renderRun = (run, index) => {
    const content = new Array(lanes.length).fill(null);
    const skipped = new Set();
    let dbStep = null;

    for (let i = 0; i <= index; i++) {
      const step = run.steps[i];
      content[step.at] = step;
      (step.skipped || []).forEach(lane => skipped.add(lane));
      if (step.db) dbStep = i;
    }

    const current = run.steps[index];
    cancelTrace();
    const linkStates = new Array(links.length).fill(null);
    for (let i = 1; i <= index; i++) {
      const from = run.steps[i - 1].at;
      const to = run.steps[i].at;
      for (let l = Math.min(from, to); l < Math.max(from, to); l++) {
        linkStates[l] = { dir: to > from ? 'right' : 'left', kind: run.steps[i].kind };
      }
    }
    setLinks(linkStates.map(link => (link && link.kind !== current.kind ? { dir: link.dir, kind: 'past' } : link)));
    clearPeek();
    lanes.forEach((lane, i) => {
      const step = content[i];
      const isActive = current.at === i;
      lane.el.classList.toggle('active', isActive);
      lane.el.classList.toggle('visited', !isActive && step !== null);
      lane.el.classList.toggle('skipped', skipped.has(i) && step === null);
      lane.node.dataset.kind = isActive ? current.kind : '';

      lane.state.textContent = isActive ? 'Em execução' : step ? 'Já passou por aqui' : skipped.has(i) ? 'Não foi acionado' : 'Nada a mostrar';
      lane.code.innerHTML = step ? highlight(step.code) : '';
      if (isActive && step) runTrace(lane.code);
      const vars = step && step.vars;
      lane.vars.hidden = !vars;
      lane.vars.classList.toggle('folded', Boolean(lane.varsFolded));
      lane.vars.innerHTML = vars ? `<button type="button" class="vars-title" data-fold="vars" title="Minimizar / mostrar variáveis">Variáveis ${ICON_CHEVRON}</button>${vars.map(([name, value]) => `<div class="var"><span class="vn">${highlight(name)}</span><span class="eq">=</span><span class="vv">${highlight(String(value), false)}</span></div>`).join('')}` : '';
      lane.badge.hidden = !(step && step.badge);
      if (step && step.badge) {
        lane.badge.textContent = step.badge.text;
        lane.badge.dataset.tone = step.badge.tone;
      }
    });

    let dbPets = run.base;
    let dbAgenda = run.baseAgenda;
    let dbProdutos = run.baseProdutos || window.Lab.store.produtos;
    for (let i = 0; i <= index; i++) {
      const snapshot = run.steps[i].db;
      if (snapshot) {
        dbPets = snapshot.pets || dbPets;
        dbAgenda = snapshot.agenda || dbAgenda;
        dbProdutos = snapshot.produtos || dbProdutos;
      }
    }
    const hlStep = dbStep === null ? null : run.steps[dbStep];
    renderDb(dbPets, dbAgenda, hlStep ? hlStep.db.hl : null, dbStep === index, dbStep === index, dbProdutos);
    if (run.view === 'site') {
      const finished = index === run.steps.length - 1;
      setSite(finished ? 'done' : 'loading', finished ? run.result : run.loading);
    }
    renderExplain(run, index);
    followLayout();
  };

  const renderExplain = (run, index) => {
    const step = run.steps[index];
    explainEl.dataset.kind = step.kind;
    explainEl.innerHTML = `
      <div class="explain-main">
        <h3>${esc(step.title)}</h3>
        <p>${esc(step.text)}</p>
      </div>
      <div class="explain-meta">
        <span class="flow-name">${esc(run.title)}</span>
        <span class="dir" data-kind="${step.kind}">${step.kind === 'req' ? '→ indo' : step.kind === 'res' ? '← voltando' : 'erro'}</span>
        <span class="step-nav"><button type="button" data-step="prev" aria-label="Passo anterior">◀</button><span class="step-count">Passo ${index + 1} de ${run.steps.length}</span><button type="button" data-step="next" aria-label="Próximo passo">▶</button></span>
      </div>`;
  };

  const renderPre = (flowName, total, hint) => {
    explainEl.dataset.kind = '';
    explainEl.innerHTML = `
      <div class="explain-main">
        <h3>Passo 0: antes de enviar</h3>
        <p>${hint}</p>
      </div>
      <div class="explain-meta">
        <span class="flow-name">${esc(flowName)}</span>
        <span class="dir">pronto para enviar</span>
        <span class="step-nav"><button type="button" data-step="prev" aria-label="Passo anterior" disabled>◀</button><span class="step-count">Passo 0 de ${total}</span><button type="button" data-step="next" aria-label="Próximo passo">▶</button></span>
      </div>`;
  };

  const renderIdle = (pets, site = null) => {
    cancelTrace();
    setSite(...(site || [null]));
    setLinks([]);
    clearPeek();
    lanes.forEach(lane => {
      lane.el.classList.remove('active', 'visited', 'skipped');
      lane.node.dataset.kind = '';
      lane.state.textContent = 'Nada a mostrar';
      lane.code.innerHTML = '';
      lane.vars.hidden = true;
      lane.badge.hidden = true;
    });
    pulse.hidden = true;
    pulse.getAnimations().forEach(animation => animation.cancel());
    pulsePos = null;
    renderDb(pets, window.Lab.store.agenda, null, false, false, window.Lab.store.produtos);
    followLayout();
    explainEl.dataset.kind = '';
    explainEl.innerHTML = `
      <div class="explain-main">
        <h3>Escolha uma requisição para começar</h3>
        <p>Escolha um <b>Cenário</b> no menu abaixo, à esquerda (no POST, preencha o formulário que abre na raia Front-End). Depois clique em <b>Avançar passo</b> (ou ative o modo <b>Automático</b>) e veja a bolinha percorrer cada camada. Dica: as setas ← → do teclado também funcionam.</p>
      </div>`;
  };

  const noticeEl = document.createElement('div');
  noticeEl.className = 'notice';
  noticeEl.hidden = true;
  noticeEl.innerHTML = `
    <section class="notice-card" role="alertdialog" aria-label="Atenção">
      <header class="notice-head">
        <h3>Atenção</h3>
        <button type="button" class="notice-close" aria-label="Fechar aviso" title="Fechar aviso">✕</button>
      </header>
      <div class="notice-text"></div>
      <footer class="notice-foot"><button type="button" class="btn" id="notice-cancel" hidden>Cancelar</button><button type="button" class="btn primary" id="notice-ok">Entendi</button></footer>
    </section>`;
  document.body.appendChild(noticeEl);

  let noticeYes = null;

  const hideNotice = () => {
    noticeEl.hidden = true;
    noticeYes = null;
    noticeEl.querySelector('#notice-cancel').hidden = true;
    noticeEl.querySelector('#notice-ok').textContent = 'Entendi';
    document.body.classList.remove('modal-open');
  };

  const confirmNotice = (html, yesLabel, onYes) => {
    notice(html);
    noticeYes = onYes;
    noticeEl.querySelector('#notice-cancel').hidden = false;
    noticeEl.querySelector('#notice-ok').textContent = yesLabel;
  };

  const notice = html => {
    noticeEl.querySelector('.notice-text').innerHTML = html;
    noticeEl.hidden = false;
    document.body.classList.add('modal-open');
    noticeEl.querySelector('#notice-ok').focus();
  };

  noticeEl.querySelector('.notice-close').addEventListener('click', hideNotice);
  noticeEl.querySelector('#notice-ok').addEventListener('click', () => {
    const callback = noticeYes;
    hideNotice();
    if (callback) callback();
  });
  noticeEl.querySelector('#notice-cancel').addEventListener('click', hideNotice);
  noticeEl.addEventListener('click', event => {
    if (event.target === noticeEl) hideNotice();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !noticeEl.hidden) hideNotice();
  });


  const applyMax = index => {
    const cell = (lanesEl.clientWidth - gridGap() * (lanes.length - 1)) / lanes.length;
    const baseLeft = lanesEl.getBoundingClientRect().left;
    const cellLeft = baseLeft + index * (cell + gridGap());
    const view = document.documentElement.clientWidth;
    const targetLeft = view * 0.2;
    const targetRight = view * 0.8;
    lanes[index].el.style.setProperty('--ml', `${targetLeft - cellLeft}px`);
    lanes[index].el.style.setProperty('--mr', `${cellLeft + cell - targetRight}px`);
  };

  const restoreMax = () => {
    if (maxIndex === null) return;
    lanes[maxIndex].el.classList.remove('max');
    document.body.classList.remove('has-max');
    maxIndex = null;
    followLayout();
  };

  const toggleMax = index => {
    if (maxIndex === index) return restoreMax();
    restoreMax();
    clearPeek();
    layoutRail();
    maxIndex = index;
    applyMax(index);
    lanes[index].el.classList.add('max');
    document.body.classList.add('has-max');
  };

  window.addEventListener('resize', () => {
    if (maxIndex !== null) applyMax(maxIndex);
  });

  lanesEl.addEventListener('click', event => {
    const expand = event.target.closest('[data-expand]');
    if (expand) return toggleMax(Number(expand.dataset.expand));

    const fold = event.target.closest('[data-fold]');
    if (!fold) return;
    const laneIndex = lanes.findIndex(lane => lane.el.contains(fold));
    const kind = fold.dataset.fold;
    if (kind === 'role') fold.closest('.role').classList.toggle('folded');
    if (kind === 'table') fold.closest('.db-block').classList.toggle('folded');
    if (kind === 'vars' && laneIndex >= 0) {
      lanes[laneIndex].varsFolded = !lanes[laneIndex].varsFolded;
      lanes[laneIndex].vars.classList.toggle('folded', lanes[laneIndex].varsFolded);
    }
  });

  document.addEventListener('click', event => {
    if (maxIndex === null) return;
    if (!lanes[maxIndex].el.contains(event.target) && !event.target.closest('.tip-box')) restoreMax();
  });

  window.Lab.board = { confirmNotice, runTrace, cancelTrace, renderPre, restoreMax, travel, renderRun, renderIdle, layoutRail, notice, setSite };
})();
