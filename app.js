import { APP_VERSION } from './app-version.js?v=v23';

const bannerId = 'update-banner';

// v23: Chrome-Android 식별 클래스
const isChromeAndroid = /Android/i.test(navigator.userAgent) && /Chrome\/\d+/.test(navigator.userAgent);
if (isChromeAndroid) {
  document.documentElement.classList.add('is-chrome-android');
  // Chrome-Android 전용 CSS 동적 주입
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './css/chrome-mobile-v23.css?v=23';
  document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', ()=>{
  // version
  const v=document.getElementById('appVersion'); if(v) v.textContent=APP_VERSION;

  // categories
  const CATS=[
    {id:'gpt',name:'ChatGPT · GPT roots',path:'prompts/gpt'},
    {id:'project',name:'Projects · Studio',path:'prompts/project'},
    {id:'dialogs',name:'Chat windows · Logs',path:'prompts/dialogs'},
    {id:'copilot',name:'GitHub Copilot',path:'prompts/copilot'},
  ];

  const $acc=document.getElementById('catAccordion');
  const $favList=document.getElementById('favList');

  // ---------- data ----------
  async function loadList(path){
    try{const r=await fetch(`${path}/index.json?ts=${Date.now()}`);return r.ok?await r.json():[]}catch{return[]}
  }
  async function loadMD(url){ const r=await fetch(url); return await r.text(); }

  // ---------- favorites (localStorage) ----------
  const FKEY='ipwa:favorites';
  const getFav=()=>{try{return JSON.parse(localStorage.getItem(FKEY)||'[]')}catch{ return [] }};
  const setFav=(arr)=>localStorage.setItem(FKEY,JSON.stringify(arr.slice(0,10)));
  const isFav=(p)=>getFav().some(x=>x.path===p);
  function toggleFav(item){
    const list=getFav();
    const idx=list.findIndex(x=>x.path===item.path);
    if(idx>=0) list.splice(idx,1); else list.unshift(item);
    setFav(list); renderFav();
  }
  function renderFav(){
    const list=getFav(); $favList.innerHTML='';
    list.forEach(x=>{
      const li=document.createElement('li'); li.className='fav-item';
      li.innerHTML=`<div class="fav-title">${x.title}</div>
        <button class="fav-remove" data-path="${x.path}">Remove</button>`;
      $favList.appendChild(li);
    });
  }
  $favList.addEventListener('click',e=>{
    const btn=e.target.closest('.fav-remove'); if(!btn) return;
    toggleFav({path:btn.dataset.path,title:''});
  });

  // ---------- toast ----------
  function toast(msg){
    const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
    document.body.appendChild(t); setTimeout(()=>t.remove(),1800);
    if(navigator.vibrate) navigator.vibrate(12);
  }

  // ---------- accordion build ----------
  (async ()=>{
    for(const c of CATS){
      const list=await loadList(c.path);
      const preview=list.slice(0,3).map(f=>f.replace(/\.md$/,'').replace(/[-_]/g,' ')).join(', ');
      const item=document.createElement('div'); item.className='acc-item';
      item.innerHTML=`
        <button class="acc-btn" data-id="${c.id}" role="button" aria-expanded="false" aria-controls="panel-${c.id}" tabindex="0">
          <span class="acc-meta"><span>${c.name}</span><span class="badge">${list.length}</span></span>
          <span class="chev">▼</span>
        </button>
        <div class="preview">${preview || 'No items yet'}</div>
        <div class="acc-panel" id="panel-${c.id}"><div class="grid" id="grid-${c.id}"></div></div>`;
      $acc.appendChild(item);

      // render cards
      const grid=item.querySelector(`#grid-${c.id}`);
      for(const file of list){
        const title=file.replace(/\.md$/,'').replace(/[-_]/g,' ');
        const path=`${c.path}/${file}`;
        const el=document.createElement('div'); el.className='card';
        el.innerHTML=`
          <div class="title">${title}</div>
          <div class="actions">
            <button class="pin ${isFav(path)?'active':''}" data-title="${title}" data-path="${path}" aria-label="즐겨찾기">★</button>
            <button class="copy" data-path="${path}" aria-label="복사">📋</button>
          </div>`;
        grid.appendChild(el);
      }
    }
    const first=document.querySelector('.acc-item'); if(first) {
      first.classList.add('open');
      const btn = first.querySelector('.acc-btn');
      if(btn) {
        btn.setAttribute('aria-expanded', 'true');
        const chev = btn.querySelector('.chev');
        if(chev) chev.textContent = '▲';
      }
    }
    renderFav();
  })();

  // accordion toggle
  $acc.addEventListener('click',e=>{
    const btn=e.target.closest('.acc-btn'); if(!btn) return;
    const it=btn.parentElement, open=it.classList.contains('open');
    document.querySelectorAll('.acc-item').forEach(x=>{
      x.classList.remove('open');
      const accBtn = x.querySelector('.acc-btn');
      const chev = accBtn?.querySelector('.chev');
      if(accBtn) accBtn.setAttribute('aria-expanded', 'false');
      if(chev) chev.textContent = '▼';
    });
    if(!open) {
      it.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      const chev = btn.querySelector('.chev');
      if(chev) chev.textContent = '▲';
    }
    it.scrollIntoView({behavior:'smooth',block:'start'});
  });

  // keyboard support for accordion
  $acc.addEventListener('keydown',e=>{
    const btn=e.target.closest('.acc-btn'); if(!btn) return;
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });

  // copy & pin handlers
  document.addEventListener('click',async e=>{
    const copyBtn=e.target.closest('.copy');
    if(copyBtn){
      try{const txt=await loadMD(copyBtn.dataset.path);
        await navigator.clipboard.writeText(txt);
        toast('복사 완료!');
      }catch{ toast('Copy failed'); }
      return;
    }
    const pinBtn=e.target.closest('.pin');
    if(pinBtn){
      toggleFav({path:pinBtn.dataset.path,title:pinBtn.dataset.title});
      pinBtn.classList.toggle('active');
    }
  });

  // ---------- SW update banner ----------
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('message',e=>{
      if(e.data?.type === 'NEW_VERSION') showUpdateBanner();
    });
  }

  // optional install UI
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); const p=e;
    document.getElementById('btnInstall')?.addEventListener('click', ()=>p.prompt(), {once:true});
  });

  // Register service worker
  if('serviceWorker' in navigator){
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register('./sw.js?v=23', { scope: './' });
        navigator.serviceWorker.addEventListener('message', (e) => {
          if (e.data?.type === 'NEW_VERSION') {
            document.getElementById('update-banner')?.classList.add('show');
          }
        });
      } catch (err) {
        console.error('SW register failed', err);
      }
    });
  }
});

function showUpdateBanner() {
  if (document.getElementById(bannerId)) return;
  const el = document.createElement('div');
  el.id = bannerId;
  el.style.cssText = `
    position:fixed;top:0;left:0;right:0;z-index:9999;
    background:#0b74de;color:#fff;padding:12px 16px;
    display:flex;gap:8px;justify-content:center;align-items:center;
    box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:14px
  `;
  el.innerHTML = `
    New version (${APP_VERSION}) is ready.
    <button id="upd-refresh" style="background:#fff;border:0;border-radius:6px;padding:6px 10px;color:#0b74de;">Refresh</button>
    <button id="upd-dismiss" style="background:transparent;border:1px solid rgba(255,255,255,.7);border-radius:6px;padding:6px 10px;color:#fff;">Later</button>
  `;
  document.body.appendChild(el);

  document.getElementById('upd-refresh').onclick = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => location.reload(), 150);
  };
  document.getElementById('upd-dismiss').onclick = () => el.remove();
}

function refreshNow() {
  navigator.serviceWorker?.controller?.postMessage({ type: 'SKIP_WAITING' });
  const u = new URL(location.href);
  u.searchParams.set('v', '23');
  location.replace(u.toString());
}

// Make refreshNow globally available
window.refreshNow = refreshNow;