document.addEventListener('DOMContentLoaded', ()=>{
  // version
  const v = document.getElementById('appVersion'); if (v) v.textContent = 'v15';

  // PWA installation
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt = e;
  });
  document.getElementById('btnInstall')?.addEventListener('click', async ()=>{
    if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt = null;
  });

  // categories (folders)
  const CATS = [
    { id:'gpt',     name:'ChatGPT · GPT roots', path:'prompts/gpt' },
    { id:'project', name:'Projects · Studio',   path:'prompts/project' },
    { id:'dialogs', name:'Chat windows · Logs', path:'prompts/dialogs' },
    { id:'copilot', name:'GitHub Copilot',      path:'prompts/copilot' },
  ];

  const $acc = document.getElementById('catAccordion');
  const $grid = document.getElementById('promptGrid');

  async function loadList(path){
    try{
      const res = await fetch(`${path}/index.json?ts=${Date.now()}`);
      if(!res.ok) return [];
      return await res.json(); // ["file1.md", ...]
    }catch{ return []; }
  }

  // Build accordion & initial grid
  (async ()=>{
    for (const c of CATS){
      const list = await loadList(c.path);
      const item = document.createElement('div');
      item.className = 'acc-item';
      item.innerHTML = `
        <button class="acc-btn" data-id="${c.id}">
          <span>${c.name}</span>
          <span class="badge">${list.length}</span>
        </button>
        <div class="acc-panel" id="panel-${c.id}">
          <div class="grid" id="grid-${c.id}"></div>
        </div>`;
      $acc.appendChild(item);

      // render cards inside panel
      const panelGrid = item.querySelector(`#grid-${c.id}`);
      list.forEach(file=>{
        const title = file.replace(/\.md$/,'').replace(/[-_]/g,' ');
        const el = document.createElement('div'); el.className='card';
        el.innerHTML = `
          <div class="title">${title}</div>
          <button class="copy" data-path="${c.path}/${file}">Copy</button>`;
        panelGrid.appendChild(el);
      });
    }
    // open first by default
    const first = document.querySelector('.acc-item'); if(first) first.classList.add('open');
  })();

  // accordion toggle
  $acc.addEventListener('click', e=>{
    const btn = e.target.closest('.acc-btn'); if(!btn) return;
    const it = btn.parentElement;
    const wasOpen = it.classList.contains('open');
    document.querySelectorAll('.acc-item').forEach(x=>x.classList.remove('open'));
    if(!wasOpen) it.classList.add('open');
  });

  // copy handler (delegation)
  document.addEventListener('click', async e=>{
    const b = e.target.closest('.copy'); if(!b) return;
    try{
      const res = await fetch(b.dataset.path);
      const txt = await res.text();
      await navigator.clipboard.writeText(txt);
      b.textContent = 'Copied'; setTimeout(()=>b.textContent='Copy',1100);
    }catch{
      b.textContent = 'Failed'; setTimeout(()=>b.textContent='Copy',1100);
    }
  });

  // ------- Favorites -------
  async function renderFavorites(){
    const ul = document.getElementById('favList');
    if (!ul) return;
    try{
      const res = await fetch('config/favorites.json?ts='+Date.now(),{cache:'no-store'});
      const json = await res.json();
      const favs = (json && Array.isArray(json.favorites)) ? json.favorites.slice(0,10) : [];
      if (favs.length===0){ ul.innerHTML = `<li class="hint">No favorites yet.</li>`; return; }
      ul.innerHTML = favs.map(f=>`
        <li class="fav-item">
          <span class="prompt-title" title="${f.title}">${f.title}</span>
          <button class="copy" data-path="${f.path}">Copy</button>
        </li>
      `).join('');
    }catch{
      ul.innerHTML = `<li class="hint">Failed to load favorites.json</li>`;
    }
  }

  // ------- Sync button -------
  document.getElementById('btnSyncAll')?.addEventListener('click', async ()=>{
    const btn = document.getElementById('btnSyncAll');
    btn.disabled = true; btn.textContent = 'Syncing…';
    
    // Rebuild accordion
    document.getElementById('catAccordion').innerHTML = '';
    await buildAccordion();
    await renderFavorites();
    
    btn.disabled = false; btn.textContent = 'Sync';
    toast('Sync complete');
  });

  async function buildAccordion(){
    const root = document.getElementById('catAccordion'); if(!root) return;
    for(const c of CATS){
      const list = await loadList(c.path);
      const item = document.createElement('div');
      item.className='acc-item';
      item.innerHTML = `
        <button class="acc-btn" data-id="${c.id}">
          <span>${c.name}</span><span class="badge">${list.length}</span>
        </button>
        <div class="acc-panel" id="panel-${c.id}">
          <div class="grid" id="grid-${c.id}"></div>
        </div>`;
      root.appendChild(item);

      // render cards
      const grid = item.querySelector(`#grid-${c.id}`);
      list.forEach(file=>{
        const title = file.replace(/\.md$/,'').replace(/[-_]/g,' ');
        const el = document.createElement('div'); el.className='card';
        el.innerHTML = `<div class="title">${title}</div>
                        <button class="copy" data-path="${c.path}/${file}">Copy</button>`;
        grid.appendChild(el);
      });
    }

    // accordion toggle
    root.addEventListener('click',e=>{
      const btn = e.target.closest('.acc-btn'); if(!btn) return;
      const it = btn.parentElement;
      const opened = it.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(x=>x.classList.remove('open'));
      if(!opened) it.classList.add('open');
    });
  }

  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style,{
      position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
      background:'var(--ok)',color:'#fff',padding:'8px 12px',borderRadius:'12px',zIndex:1000
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1300);
  }

  // SW registration
  if ('serviceWorker' in navigator) { 
    try { 
      navigator.serviceWorker.register('sw.js'); 
    } catch(e) {} 
  }

  // Initialize
  renderFavorites();
});