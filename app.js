const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let SETTINGS=null,deferredPrompt=null;

// PWA install
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#btnInstall')?.classList.remove('outline')});
$('#btnInstall')?.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt=null});

// Categories
const CATEGORIES=[
  {key:'chatgpt-gpt',name:'1. ChatGPT GPT'},
  {key:'chatgpt-project',name:'2. ChatGPT 프로젝트'},
  {key:'chatgpt-thread',name:'3. ChatGPT 개별창'},
  {key:'github-copilot',name:'4. GitHub Copilot 지침'},
];

document.addEventListener('DOMContentLoaded',async()=>{
  if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('sw.js')}catch{}}
  const ver=$('#appVersion'); if(ver) ver.textContent='v9';
  try{SETTINGS=await (await fetch('config/settings.json',{cache:'no-store'})).json();}catch{alert('config/settings.json 확인');return}
  renderCategoryList(); await refreshAllCounts(); await renderFavorites(); await loadCategory(CATEGORIES[0].key);
  $('#btnSyncAll')?.addEventListener('click',async()=>{busy('#btnSyncAll',1);await refreshAllCounts();await loadCategory($('.cat-row.active')?.dataset.cat||CATEGORIES[0].key);busy('#btnSyncAll',0);toast('동기화 완료')});
  initLangToggle(); initDrawers();
});

function busy(sel,b){const x=$(sel); if(!x) return; x.disabled=!!b; x.textContent=b?'동기화 중…':'동기화'}
function renderCategoryList(){
  const nav=$('#categoryList');
  nav.innerHTML=CATEGORIES.map(c=>`
    <div class="cat-row" data-cat="${c.key}">
      <span class="cat-name">${c.name}</span>
      <span class="cat-badge" data-badge="${c.key}">-</span>
      <a class="cat-upload" target="_blank" data-upload="${c.key}">업로드</a>
    </div>`).join('');
  nav.addEventListener('click',async e=>{
    const row=e.target.closest('.cat-row'); if(!row) return;
    if(e.target.matches('a.cat-upload')) return;
    $$('.cat-row').forEach(r=>r.classList.remove('active')); row.classList.add('active');
    await loadCategory(row.dataset.cat);
  });
  $$('.cat-upload').forEach(a=>{a.href=ghUploadUrl(a.dataset.upload)});
}
function ghUploadUrl(cat){const {repoOwner,repoName,branch}=SETTINGS;return `https://github.com/${repoOwner}/${repoName}/upload/${encodeURIComponent(branch)}/library/${cat}`}
function ghContentsUrl(cat){const {repoOwner,repoName,branch}=SETTINGS;return `https://api.github.com/repos/${repoOwner}/${repoName}/contents/library/${cat}?ref=${encodeURIComponent(branch)}`}
function ghRawUrl(p){const {repoOwner,repoName,branch}=SETTINGS;return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${encodeURIComponent(branch)}/${p}`}

async function refreshAllCounts(){await Promise.all(CATEGORIES.map(async c=>{const f=await listMd(c.key); const n=f.length; const b=document.querySelector(`[data-badge="${c.key}"]`); if(b) b.textContent=String(n)}))}
async function listMd(cat){try{const r=await fetch(ghContentsUrl(cat),{cache:'no-store'}); if(!r.ok) return []; const j=await r.json(); return (Array.isArray(j)?j:[]).filter(x=>x.type==='file'&&/\.md$/i.test(x.name)).map(x=>({name:x.name,path:`library/${cat}/${x.name}`})).sort((a,b)=>a.name.localeCompare(b.name,'ko'))}catch{return[]}}
async function loadCategory(cat){const el=$('#promptList'); el.innerHTML=`<div class="card">로딩 중…</div>`; const files=await listMd(cat);
  if(files.length===0){el.innerHTML=`<div class="card">이 카테고리에 .md 가 없습니다.</div>`;return}
  el.innerHTML=files.map(f=>`<div class="prompt-card"><div class="prompt-title" title="${esc(titleOf(f))}">${esc(titleOf(f))}</div><button class="copy-btn" data-path="${f.path}">📋 복사</button></div>`).join('');
  $$('#promptList .copy-btn').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;await copyPrompt(b.dataset.path);b.disabled=false}));
}
function titleOf(f){return f.name.replace(/[_-]/g,' ').replace(/\.md$/i,'').trim()}
async function copyPrompt(p){const r=await fetch(ghRawUrl(p),{cache:'no-store'}); const t=await r.text(); await navigator.clipboard.writeText(t); toast('복사 완료')}

async function renderFavorites(){
  const ul=$('#favList');
  try{const r=await fetch('config/favorites.json?ts='+Date.now(),{cache:'no-store'}); const j=await r.json(); const L=(j&&Array.isArray(j.favorites))?j.favorites.slice(0,10):[];
    if(L.length===0){ul.innerHTML=`<li class="hint">즐겨찾기 비어 있음</li>`;return}
    ul.innerHTML=L.map(f=>`<li class="fav-item"><span class="prompt-title" title="${esc(f.title)}">${esc(f.title)}</span><button class="copy-btn" data-path="${f.path}">📋</button></li>`).join('');
    $$('#favList .copy-btn').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;await copyPrompt(b.dataset.path);b.disabled=false}));
  }catch{ul.innerHTML=`<li class="hint">favorites.json 로드 실패</li>`}
}

// Lang toggle
function initLangToggle(){
  const btns=document.querySelectorAll('.lang-toggle button'); if(!btns.length) return;
  const saved=localStorage.getItem('imprint.lang')||'en'; setLang(saved);
  btns.forEach(b=>b.addEventListener('click',()=>{setLang(b.dataset.lang);localStorage.setItem('imprint.lang',b.dataset.lang)}));
}
function setLang(l){document.querySelectorAll('.imprint-list,.imprint-note').forEach(el=>el.hidden=el.dataset.lang!==l);
  document.querySelectorAll('.lang-toggle button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.lang===l?'true':'false'))}

// Drawers
function initDrawers(){
  $('#btnMenu')?.addEventListener('click',()=>openSide('left'));
  $('#btnFav')?.addEventListener('click',()=>{const f=document.querySelector('.favorites'); if(f&&!f.classList.contains('drawer')) f.classList.add('drawer'); openSide('right')});
  $('#scrim')?.addEventListener('click',closeSides);
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSides()});
  document.querySelector('.sidebar')?.addEventListener('click',e=>{if(e.target.closest('.cat-row')&&match('(max-width:1280px)')) closeSides()});
}
const match=q=>window.matchMedia(q).matches;
function openSide(d){document.body.classList.add(d==='left'?'drawer-open-left':'drawer-open-right'); $('#scrim').hidden=false}
function closeSides(){document.body.classList.remove('drawer-open-left','drawer-open-right'); $('#scrim').hidden=true}

// Utils
function toast(m){const t=document.createElement('div'); t.textContent=m; Object.assign(t.style,{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',background:'var(--accent)',color:'#111',padding:'8px 12px',borderRadius:'12px',zIndex:1000}); document.body.appendChild(t); setTimeout(()=>t.remove(),1100)}
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));