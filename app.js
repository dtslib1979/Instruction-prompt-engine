const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let SETTINGS = null;
let deferredPrompt = null;

// PWA 설치
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt = e;
  $('#btnInstall')?.classList.remove('outline');
});
$('#btnInstall')?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt = null;
});

// 카테고리
const CATEGORIES = [
  { key:'gpt',      name:'1. ChatGPT GPT',      path:'prompts/gpt' },
  { key:'project',  name:'2. 프로젝트',         path:'prompts/project' },
  { key:'dialogs',  name:'3. 개별창',           path:'prompts/dialogs' },
  { key:'copilot',  name:'4. Copilot',         path:'prompts/copilot' },
];

document.addEventListener('DOMContentLoaded', async ()=>{
  const v = document.getElementById('appVersion'); 
  if(v) v.textContent = 'v13';

  // 카테고리 구조 정의
  const cats = [
    { id:'gpt',    name:'ChatGPT GPT', path:'prompts/gpt' },
    { id:'proj',   name:'프로젝트',      path:'prompts/project' },
    { id:'dialogs',name:'개별창',        path:'prompts/dialogs' },
    { id:'copilot',name:'Copilot',      path:'prompts/copilot' },
  ];

  // ────────── 업로드 카운트 가져오기 ──────────
  async function getFileCount(path){
    try{
      const res = await fetch(`${path}/index.json?ts=${Date.now()}`);
      if(!res.ok) return 0;
      const list = await res.json();
      return list.length;
    }catch(e){ return 0; }
  }

  async function initTree(){
    const svg = document.getElementById('tree');
    if(!svg) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M10,210 C80,40 220,40 290,210');
    path.setAttribute('fill','none'); 
    path.setAttribute('stroke','#d9c8a7'); 
    path.setAttribute('stroke-width','3');
    svg.appendChild(path);

    const wrap = svg.parentElement;
    const L = path.getTotalLength();
    const pos = t => path.getPointAtLength(L*t);

    let i=0;
    for(const c of cats){
      const t = 0.15 + i*0.23; 
      const p = pos(t);
      const count = await getFileCount(c.path);

      const b = document.createElement('button');
      b.className='node';
      b.style.left=`${p.x-80}px`; 
      b.style.top=`${p.y-18}px`;
      b.innerHTML = `
        <span class="dot"></span>
        <span>${i+1}. ${c.name}</span>
        <span class="badge">${count}</span>
      `;
      b.addEventListener('click', ()=>scrollToPrompts(c.id));
      wrap.appendChild(b);

      i++;
    }
  }

  function scrollToPrompts(catId){ 
    document.getElementById('promptList')?.scrollIntoView({behavior:'smooth'}); 
    // 추가: 해당 catId 목록만 보여주도록 필터링 로직 연결 가능
  }

  initTree();

  // v12: SW 등록
  if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register('sw.js'); } catch {} }

  // v12: 드로어 제스처
  const scrim=document.getElementById('scrim');
  const openLeft =()=>document.body.classList.add('drawer-left');
  const closeLeft=()=>document.body.classList.remove('drawer-left');
  document.getElementById('btnMenu')?.addEventListener('click',openLeft);
  scrim?.addEventListener('click',closeLeft);

  // 설정
  try{
    SETTINGS = await (await fetch('config/settings.json',{cache:'no-store'})).json();
  }catch{
    alert('config/settings.json을 확인하세요'); return;
  }

  renderCategoryListSkeleton();
  await refreshAllCounts();
  await renderFavorites();
  await loadCategory(CATEGORIES[0].key);

  $('#btnSyncAll')?.addEventListener('click', async ()=>{
    btnBusy('#btnSyncAll', true);
    await refreshAllCounts();
    const active = $('.category-list .cat-row.active')?.dataset.cat || CATEGORIES[0].key;
    await loadCategory(active);
    btnBusy('#btnSyncAll', false);
    toast('동기화 완료');
  });

  // Imprint EN/KR 토글
  initLangToggle();

  // 모바일 드로어
  initDrawers();
});

function btnBusy(sel, busy){
  const b = $(sel); if(!b) return;
  b.disabled = !!busy; b.textContent = busy ? '동기화 중…' : '동기화';
}

// 카테고리 목록
function renderCategoryListSkeleton(){
  const nav = $('#categoryList');
  nav.innerHTML = CATEGORIES.map(cat => `
    <div class="cat-row" data-cat="${cat.key}">
      <span class="cat-name">${cat.name}</span>
      <span class="cat-badge" data-badge="${cat.key}">-</span>
      <a class="cat-upload" target="_blank" data-upload="${cat.key}">업로드</a>
    </div>
  `).join('');

  nav.addEventListener('click', async (e)=>{
    const row = e.target.closest('.cat-row');
    if(!row) return;
    if (e.target.matches('a.cat-upload')) return;
    $$('.cat-row').forEach(r=>r.classList.remove('active'));
    row.classList.add('active');
    await loadCategory(row.dataset.cat);
  });

  $$('.cat-upload').forEach(a=>{
    const key = a.dataset.upload;
    a.href = ghUploadUrl(key);
  });
}

// GitHub URL helpers
function ghUploadUrl(catKey){
  const { repoOwner, repoName, branch } = SETTINGS;
  const cat = CATEGORIES.find(c => c.key === catKey);
  return `https://github.com/${repoOwner}/${repoName}/upload/${encodeURIComponent(branch)}/${cat.path}`;
}
function ghContentsUrl(catKey){
  const { repoOwner, repoName, branch } = SETTINGS;
  const cat = CATEGORIES.find(c => c.key === catKey);
  return `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${cat.path}?ref=${encodeURIComponent(branch)}`;
}
function ghRawUrl(path){
  const { repoOwner, repoName, branch } = SETTINGS;
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${encodeURIComponent(branch)}/${path}`;
}

// Counts
async function refreshAllCounts(){
  await Promise.all(CATEGORIES.map(async cat=>{
    const count = await getFileCount(cat.path);
    const badge = document.querySelector(`[data-badge="${cat.key}"]`);
    if (badge) badge.textContent = String(count);
  }));
}

// List .md files using index.json
async function listMdFiles(catKey){
  try{
    const cat = CATEGORIES.find(c => c.key === catKey);
    if (!cat) return [];
    
    const res = await fetch(`${cat.path}/index.json?ts=${Date.now()}`);
    if(!res.ok) return [];
    const files = await res.json();
    return files
      .filter(filename => /\.md$/i.test(filename))
      .map(filename => ({name: filename, path: `${cat.path}/${filename}`}))
      .sort((a,b)=> a.name.localeCompare(b.name,'ko'));
  }catch{ return []; }
}

// Render list
async function loadCategory(catKey){
  const listEl = $('#promptList');
  listEl.innerHTML = `<div class="card">로딩 중…</div>`;
  const files = await listMdFiles(catKey);
  if (files.length===0){
    listEl.innerHTML = `<div class="card">이 카테고리에 .md 파일이 없습니다. '업로드'로 추가하세요.</div>`;
    return;
  }
  listEl.innerHTML = files.map(f=>promptCard(f)).join('');
  $$('#promptList .copy-btn').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      btn.disabled = true;
      await copyPrompt(btn.dataset.path);
      btn.disabled = false;
    });
  });
}
function promptCard(file){
  const title = file.name.replace(/_/g,' ').replace(/-/g,' ').replace(/\.md$/i,'').trim();
  return `
    <div class="prompt-card">
      <div class="prompt-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
      <button class="copy-btn" data-path="${file.path}">📋 복사</button>
    </div>
  `;
}
async function copyPrompt(path){
  const res = await fetch(ghRawUrl(path),{cache:'no-store'});
  const text = await res.text();
  await navigator.clipboard.writeText(text);
  toast('프롬프트 복사 완료');
}

// Favorites
async function renderFavorites(){
  const ul = $('#favList');
  try{
    const res = await fetch('config/favorites.json?ts='+Date.now(),{cache:'no-store'});
    const json = await res.json();
    const favs = (json && Array.isArray(json.favorites)) ? json.favorites.slice(0,10) : [];
    if (favs.length===0){ ul.innerHTML = `<li class="hint">즐겨찾기가 비어 있습니다.</li>`; return; }
    ul.innerHTML = favs.map(f=>`
      <li class="fav-item">
        <span class="prompt-title" title="${escapeHtml(f.title)}">${escapeHtml(f.title)}</span>
        <button class="copy-btn" data-path="${f.path}">📋</button>
      </li>
    `).join('');
    $$('#favList .copy-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        btn.disabled = true;
        await copyPrompt(btn.dataset.path);
        btn.disabled = false;
      });
    });
  }catch{
    ul.innerHTML = `<li class="hint">favorites.json 로드 실패</li>`;
  }
}

// Imprint EN/KR 토글 (localStorage 기억)
function initLangToggle(){
  const buttons = document.querySelectorAll('.lang-toggle button');
  if (!buttons.length) return;
  const saved = localStorage.getItem('imprint.lang') || 'en';
  setLang(saved);
  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const lang = btn.dataset.lang;
      setLang(lang);
      localStorage.setItem('imprint.lang', lang);
    });
  });
}
function setLang(lang){
  document.querySelectorAll('.imprint-list, .imprint-note').forEach(el=>{
    el.hidden = el.dataset.lang !== lang;
  });
  document.querySelectorAll('.lang-toggle button').forEach(b=>{
    const active = b.dataset.lang === lang;
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

// 모바일 드로어/스크림
function initDrawers(){
  $('#btnMenu')?.addEventListener('click', openLeft);
  $('#btnFav')?.addEventListener('click', ()=>{
    const fav = document.querySelector('.favorites');
    if (fav && !fav.classList.contains('drawer')) fav.classList.add('drawer');
    openRight();
  });
  $('#scrim')?.addEventListener('click', closeDrawers);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDrawers(); });
  document.querySelector('.sidebar')?.addEventListener('click',(e)=>{
    const row = e.target.closest('.cat-row');
    if (row && window.matchMedia('(max-width: 820px)').matches) closeDrawers();
  });
}
function openLeft(){ document.body.classList.add('drawer-open-left');  $('#scrim').hidden = false; }
function openRight(){ document.body.classList.add('drawer-open-right'); $('#scrim').hidden = false; }
function closeDrawers(){ document.body.classList.remove('drawer-open-left','drawer-open-right'); $('#scrim').hidden = true; }

// Utils
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style,{
    position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
    background:'var(--accent)',color:'#111',padding:'8px 12px',borderRadius:'12px',zIndex:1000
  });
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1300);
}
function escapeHtml(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}