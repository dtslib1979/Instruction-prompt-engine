document.addEventListener('DOMContentLoaded', ()=>{
  // 버전
  const v = document.getElementById('appVersion'); if(v) v.textContent = 'v14';

  // PWA 설치
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt = e;
  });
  document.getElementById('btnInstall')?.addEventListener('click', async ()=>{
    if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt = null;
  });

  // 카테고리 정의 (폴더 경로)
  const CATS = [
    { id:'gpt',    name:'ChatGPT GPT', path:'prompts/gpt' },
    { id:'project',name:'프로젝트',      path:'prompts/project' },
    { id:'dialogs',name:'개별창',        path:'prompts/dialogs' },
    { id:'copilot',name:'Copilot',      path:'prompts/copilot' },
  ];

  // ------- 업로드 카운트/목록 로드 (index.json 사용) -------
  async function loadList(path){
    try{
      const res = await fetch(`${path}/index.json?ts=${Date.now()}`);
      if (!res.ok) return [];
      return await res.json(); // ["a.md","b.md",...]
    }catch(e){ return []; }
  }

  // ------- 트리 SVG + 노드 배치 -------
  async function drawTree(){
    const svg = document.getElementById('treeSvg'); if(!svg) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M10,150 C90,10 210,10 290,150');
    path.setAttribute('fill','none'); path.setAttribute('stroke','#d9c9a8'); path.setAttribute('stroke-width','3');
    svg.appendChild(path);
    const L = path.getTotalLength();
    const pos = t => path.getPointAtLength(L*t);

    // 노드 버튼
    let i=0;
    for(const c of CATS){
      const list = await loadList(c.path);
      const t=0.18 + i*0.22, p = pos(t);
      const btn = document.createElement('button');
      btn.className = 'node';
      btn.style.left = `${p.x}px`;
      btn.style.top  = `${p.y}px`;
      btn.innerHTML  = `<span class="dot"></span><span>${i+1}. ${c.name}</span><span class="badge">${list.length}</span>`;
      btn.addEventListener('click', ()=>openSection(c.id));
      svg.parentElement.appendChild(btn);
      i++;
    }
  }

  // ------- 아코디언 구성 -------
  async function buildAccordion(){
    const root = document.getElementById('acc'); if(!root) return;
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

      // 카드 렌더
      const grid = item.querySelector(`#grid-${c.id}`);
      list.forEach(file=>{
        const title = file.replace(/\.md$/,'').replace(/[-_]/g,' ');
        const el = document.createElement('div'); el.className='card';
        el.innerHTML = `<div class="title">${title}</div>
                        <button class="copy" data-path="${c.path}/${file}">복사</button>`;
        grid.appendChild(el);
      });
    }

    // 아코디언 토글
    root.addEventListener('click',e=>{
      const btn = e.target.closest('.acc-btn'); if(!btn) return;
      const it = btn.parentElement;
      const opened = it.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(x=>x.classList.remove('open'));
      if(!opened) it.classList.add('open');
    });

    // 복사 핸들러
    root.addEventListener('click', async e=>{
      const b = e.target.closest('.copy'); if(!b) return;
      const url = b.dataset.path;
      try{
        const res = await fetch(url); const txt = await res.text();
        await navigator.clipboard.writeText(txt);
        b.textContent='복사됨'; setTimeout(()=>b.textContent='복사',1200);
      }catch(err){ b.textContent='실패'; setTimeout(()=>b.textContent='복사',1200); }
    });
  }

  // ------- 즐겨찾기 -------
  async function renderFavorites(){
    const ul = document.getElementById('favList');
    if (!ul) return;
    try{
      const res = await fetch('config/favorites.json?ts='+Date.now(),{cache:'no-store'});
      const json = await res.json();
      const favs = (json && Array.isArray(json.favorites)) ? json.favorites.slice(0,10) : [];
      if (favs.length===0){ ul.innerHTML = `<li class="hint">즐겨찾기가 비어 있습니다.</li>`; return; }
      ul.innerHTML = favs.map(f=>`
        <li class="fav-item">
          <span class="prompt-title" title="${f.title}">${f.title}</span>
          <button class="copy" data-path="${f.path}">복사</button>
        </li>
      `).join('');
    }catch{
      ul.innerHTML = `<li class="hint">favorites.json 로드 실패</li>`;
    }
  }

  // ------- 동기화 버튼 -------
  document.getElementById('btnSyncAll')?.addEventListener('click', async ()=>{
    const btn = document.getElementById('btnSyncAll');
    btn.disabled = true; btn.textContent = '동기화 중…';
    
    // 트리와 아코디언 다시 그리기
    document.getElementById('treeSvg').innerHTML = '';
    document.getElementById('acc').innerHTML = '';
    await drawTree();
    await buildAccordion();
    await renderFavorites();
    
    btn.disabled = false; btn.textContent = '동기화';
    toast('동기화 완료');
  });

  function openSection(catId){
    const btn = document.querySelector(`.acc-btn[data-id="${catId}"]`);
    if(!btn) return; btn.scrollIntoView({behavior:'smooth',block:'start'});
    document.querySelectorAll('.acc-item').forEach(x=>x.classList.remove('open'));
    btn.parentElement.classList.add('open');
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

  // SW 등록
  if ('serviceWorker' in navigator) { 
    try { 
      navigator.serviceWorker.register('sw.js'); 
    } catch(e) {} 
  }

  // 초기화
  drawTree();
  buildAccordion();
  renderFavorites();
});