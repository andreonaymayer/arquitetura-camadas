(() => {
  const { glossary, esc, highlight } = window.Lab;

  const box = document.createElement('div');
  box.className = 'tip-box';
  box.hidden = true;
  document.body.appendChild(box);

  let current = null;

  const hide = () => {
    box.hidden = true;
    current = null;
  };

  const show = target => {
    if (target === current) return;
    current = target;
    const data = target.dataset.tipText ? { title: target.dataset.tipTitle, text: target.dataset.tipText } : glossary[target.dataset.tip];
    if (!data) return hide();

    box.innerHTML = `<h5>${esc(data.title)}</h5><p>${esc(data.text)}</p>${data.example ? `<pre>${highlight(data.example, false)}</pre>` : ''}`;
    box.hidden = false;

    const rect = target.getBoundingClientRect();
    const margin = 8;
    const width = box.offsetWidth;
    const height = box.offsetHeight;
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
    const below = rect.bottom + 6;
    const top = below + height + margin > window.innerHeight ? Math.max(margin, rect.top - height - 6) : below;
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
  };

  document.addEventListener('mouseover', event => {
    const target = event.target.closest && event.target.closest('[data-tip], [data-tip-text]');
    if (target) show(target);
    else if (!box.contains(event.target)) hide();
  });

  document.addEventListener('scroll', hide, true);
})();
