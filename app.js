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
  { key:'chatgpt-gpt',     name:'1. ChatGPT GPT' },
  { key:'chatgpt-project', name:'2. ChatGPT 프로젝트' },
  { key:'chatgpt-thread',  name:'3. ChatGPT 개별창' },
  { key:'github-copilot',  name:'4. GitHub Copilot 지침' },
];

document.addEventListener('DOMContentLoaded', async ()=>{
  // v6: SW 등록
  if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register('sw.js'); } catch {} }

  // 버전 표기
  const ver = $('#appVersion'); if (ver) ver.textContent = 'v6';

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
  return `https://github.com/${repoOwner}/${repoName}/upload/${encodeURIComponent(branch)}/library/${catKey}`;
}
function ghContentsUrl(catKey){
  const { repoOwner, repoName, branch } = SETTINGS;
  return `https://api.github.com/repos/${repoOwner}/${repoName}/contents/library/${catKey}?ref=${encodeURIComponent(branch)}`;
}
function ghRawUrl(path){
  const { repoOwner, repoName, branch } = SETTINGS;
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${encodeURIComponent(branch)}/${path}`;
}

// Counts
async function refreshAllCounts(){
  await Promise.all(CATEGORIES.map(async cat=>{
    const files = await listMdFiles(cat.key);
    const n = files.length;
    const badge = document.querySelector(`[data-badge="${cat.key}"]`);
    if (badge) badge.textContent = String(n);
  }));
}

// List .md
async function listMdFiles(catKey){
  try{
    const res = await fetch(ghContentsUrl(catKey),{cache:'no-store'});
    if(!res.ok) return [];
    const json = await res.json();
    return (Array.isArray(json)?json:[])
      .filter(it=>it.type==='file' && /\.md$/i.test(it.name))
      .map(it=>({name:it.name, path:`library/${catKey}/${it.name}`}))
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
      this.renderFavorites();
    } catch (error) {
      console.warn('Favorites not found');
      this.favorites = [];
    }
  }

  setupEventListeners() {
    // Menu toggle (mobile)
    document.getElementById('btnMenu').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('active');
    });

    // Sync all button
    document.getElementById('btnSyncAll').addEventListener('click', () => {
      this.syncAllCategories();
    });

    // Install PWA button
    document.getElementById('btnInstall').addEventListener('click', () => {
      this.installPWA();
    });
  }

  renderCategories() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';

    Object.entries(this.categories).forEach(([key, name]) => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.dataset.category = key;
      
      const count = this.prompts[key] ? this.prompts[key].length : 0;
      item.innerHTML = `
        ${name}
        <span class="count">${count}</span>
      `;
      
      item.addEventListener('click', () => this.loadCategory(key));
      categoryList.appendChild(item);
    });
  }

  async loadCategory(categoryKey) {
    this.currentCategory = categoryKey;
    
    // Update active category UI
    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.toggle('active', item.dataset.category === categoryKey);
    });

    try {
      await this.fetchCategoryPrompts(categoryKey);
      this.renderPrompts();
    } catch (error) {
      console.error('Error loading category:', error);
      this.renderPrompts(); // Render empty state
    }
  }

  async fetchCategoryPrompts(categoryKey) {
    const apiUrl = `https://api.github.com/repos/${this.settings.repoOwner}/${this.settings.repoName}/contents/library/${categoryKey}`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Category not found');
      
      const files = await response.json();
      const mdFiles = files.filter(file => file.name.endsWith('.md') && file.name !== '.keep');
      
      const prompts = await Promise.all(
        mdFiles.map(async (file) => {
          const contentResponse = await fetch(file.download_url);
          const content = await contentResponse.text();
          
          return {
            title: file.name.replace('.md', '').replace(/^\d+-/, ''),
            filename: file.name,
            path: file.path,
            content: content,
            size: file.size
          };
        })
      );
      
      this.prompts[categoryKey] = prompts;
    } catch (error) {
      console.warn(`No prompts found for ${categoryKey}`);
      this.prompts[categoryKey] = [];
    }
  }

  renderPrompts() {
    const promptList = document.getElementById('promptList');
    const prompts = this.prompts[this.currentCategory] || [];
    
    if (prompts.length === 0) {
      promptList.innerHTML = `
        <div class="card">
          <p>이 카테고리에는 아직 프롬프트가 없습니다.</p>
          <p>새 .md 파일을 업로드하고 '동기화' 버튼을 클릭하세요.</p>
        </div>
      `;
      return;
    }

    promptList.innerHTML = prompts.map(prompt => `
      <div class="prompt-card">
        <div class="prompt-header">
          <h4 class="prompt-title">${this.escapeHtml(prompt.title)}</h4>
          <div class="prompt-actions">
            <button class="fav-btn ${this.isFavorite(prompt.path) ? 'active' : ''}" 
                    onclick="app.toggleFavorite('${prompt.path}', '${this.escapeHtml(prompt.title)}')">
              ⭐
            </button>
            <button class="copy-btn" onclick="app.copyPrompt('${this.escapeHtml(prompt.content)}')">
              📋 복사
            </button>
          </div>
        </div>
        <div class="prompt-content" id="content-${prompt.filename}">
          ${this.formatContent(prompt.content)}
        </div>
        ${prompt.content.length > 200 ? `
          <button class="expand-btn" onclick="app.toggleExpand('content-${prompt.filename}', this)">
            더보기 ▼
          </button>
        ` : ''}
      </div>
    `).join('');

    // Update category count
    this.renderCategories();
  }

  formatContent(content) {
    // Simple markdown-like formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggleExpand(contentId, button) {
    const content = document.getElementById(contentId);
    const isExpanded = content.classList.contains('expanded');
    
    content.classList.toggle('expanded');
    button.textContent = isExpanded ? '더보기 ▼' : '접기 ▲';
  }

  async copyPrompt(content) {
    try {
      await navigator.clipboard.writeText(content);
      this.showToast('프롬프트가 복사되었습니다! 📋');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('프롬프트가 복사되었습니다! 📋');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1000;
      background: var(--accent); color: white; padding: 12px 20px;
      border-radius: 8px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }

  isFavorite(path) {
    return this.favorites.some(fav => fav.path === path);
  }

  toggleFavorite(path, title) {
    const existingIndex = this.favorites.findIndex(fav => fav.path === path);
    
    if (existingIndex >= 0) {
      this.favorites.splice(existingIndex, 1);
    } else {
      this.favorites.push({ title, path });
    }
    
    this.saveFavorites();
    this.renderFavorites();
    this.renderPrompts(); // Update star states
  }

  async saveFavorites() {
    // In a real implementation, you'd save to a backend or localStorage
    localStorage.setItem('instruction-prompt-favorites', JSON.stringify(this.favorites));
  }

  renderFavorites() {
    const favList = document.getElementById('favList');
    
    if (this.favorites.length === 0) {
      favList.innerHTML = '<li class="fav-item">즐겨찾기가 없습니다</li>';
      return;
    }

    favList.innerHTML = this.favorites.map(fav => `
      <li class="fav-item" onclick="app.loadFavoritePrompt('${fav.path}')">
        ${this.escapeHtml(fav.title)}
      </li>
    `).join('');
  }

  async loadFavoritePrompt(path) {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.settings.repoOwner}/${this.settings.repoName}/contents/${path}`);
      const file = await response.json();
      const contentResponse = await fetch(file.download_url);
      const content = await contentResponse.text();
      
      this.copyPrompt(content);
    } catch (error) {
      this.showToast('즐겨찾기 프롬프트를 불러올 수 없습니다');
    }
  }

  async syncAllCategories() {
    const syncBtn = document.getElementById('btnSyncAll');
    const originalText = syncBtn.textContent;
    syncBtn.textContent = '동기화 중...';
    syncBtn.disabled = true;

    try {
      for (const categoryKey of Object.keys(this.categories)) {
        await this.fetchCategoryPrompts(categoryKey);
      }
      
      this.renderCategories();
      if (this.currentCategory) {
        this.renderPrompts();
      }
      
      this.showToast('모든 카테고리가 동기화되었습니다! 🔄');
    } catch (error) {
      this.showToast('동기화 중 오류가 발생했습니다');
    } finally {
      syncBtn.textContent = originalText;
      syncBtn.disabled = false;
    }
  }

  // PWA Installation
  setupPWAInstall() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('btnInstall').style.display = 'block';
    });

    this.deferredPrompt = deferredPrompt;
  }

  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.showToast('PWA가 설치되었습니다! 📱');
      }
      
      this.deferredPrompt = null;
      document.getElementById('btnInstall').style.display = 'none';
    }
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new InstructionPromptPWA();
  
  // Set version display
  const el = document.getElementById('appVersion');
  if (el) el.textContent = 'v4';
});