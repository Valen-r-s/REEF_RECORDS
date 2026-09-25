/* REEF Records · Ciencia: selector de especie
   Cambia la ficha visible y avisa al mapa y al bitmap con el evento "especie". */
(() => {
  const tabs = [...document.querySelectorAll('#selector [role="tab"]')];
  const vista = document.getElementById('vista-texto');
  const mapa = document.getElementById('mapa');
  let actual = tabs.find(t => t.getAttribute('aria-selected') === 'true').dataset.especie;

  function elegir(id) {
    if (id === actual) return;
    actual = id;
    tabs.forEach(t => {
      const si = t.dataset.especie === id;
      const ficha = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', String(si));
      t.tabIndex = si ? 0 : -1;
      ficha.hidden = !si;
      if (si) {
        vista.textContent = ficha.dataset.vista;
        mapa.setAttribute('aria-label', ficha.dataset.mapa);
      }
    });
    document.dispatchEvent(new CustomEvent('especie', { detail: id }));
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => elegir(t.dataset.especie));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const otro = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      elegir(otro.dataset.especie);
      otro.focus();
    });
  });
})();
