/* REEF Records · Menú móvil de las páginas interiores */
(() => {
  const nav = document.getElementById('navegacion');
  const menu = document.getElementById('nav-menu');
  const cerrar = () => { nav.classList.remove('abierto'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(nav.classList.toggle('abierto'))));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    if (a.getAttribute('href') === '#') e.preventDefault();
    cerrar();
  }));
})();
