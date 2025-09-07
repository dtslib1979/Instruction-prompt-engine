(function () {
  const qs = new URLSearchParams(location.search);
  if (!qs.get('debug')) return;

  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;font:12px/1.4 system-ui;background:#111c;border:1px solid #333;color:#fff;padding:10px;border-radius:10px';
  function rootNode() {
    return document.querySelector('[data-layout-root],.main-grid,.layout,.columns,.categories-row');
  }
  function info() {
    const root = rootNode();
    const cs = root ? getComputedStyle(root) : null;
    el.innerHTML = `
      <b>Debug</b> · UA:${navigator.userAgent}<br>
      vw:${window.innerWidth} · vh:${window.innerHeight} · DPR:${window.devicePixelRatio}<br>
      root:${root ? root.className : '(not found)'}<br>
      display:${cs?.display} · cols:${cs?.gridTemplateColumns}<br>
      sw:${navigator.serviceWorker?.controller ? 'on' : 'off'} · fix:${getComputedStyle(document.documentElement).getPropertyValue('--fix-v24-1') || 0}
      <button id="_force1" style="margin-left:8px">1-Column</button>
      <button id="_reload" style="margin-left:8px">Reload</button>
    `;
  }
  info();
  window.addEventListener('resize', info, { passive: true });
  el.addEventListener('click', (e) => {
    if (e.target.id === '_force1') {
      const root = rootNode();
      if (root) Object.assign(root.style, { display: 'grid', gridTemplateColumns: '1fr' });
      info();
    }
    if (e.target.id === '_reload') location.reload(true);
  });
  document.body.appendChild(el);
})();
