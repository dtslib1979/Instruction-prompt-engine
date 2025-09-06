// Instruction Prompt PWA - Main Application
class InstructionPromptPWA {
  constructor() {
    this.categories = {
      'chatgpt-gpt': 'ChatGPT GPT',
      'chatgpt-project': 'ChatGPT 프로젝트', 
      'chatgpt-thread': 'ChatGPT 개별창',
      'github-copilot': 'GitHub Copilot'
    };
    
    this.currentCategory = null;
    this.prompts = {};
    this.favorites = [];
    this.settings = {};
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadFavorites();
    this.setupEventListeners();
    this.renderCategories();
    this.registerServiceWorker();
    this.setupPWAInstall();
    
    // Load first category by default
    const firstCategory = Object.keys(this.categories)[0];
    this.loadCategory(firstCategory);
  }

  async loadSettings() {
    try {
      const response = await fetch('./config/settings.json');
      this.settings = await response.json();
    } catch (error) {
      console.warn('Settings not found, using defaults');
      this.settings = {
        repoOwner: 'dtslib1979',
        repoName: 'Instruction-prompt-engine',
        branch: 'main'
      };
    }
  }

  async loadFavorites() {
    try {
      const response = await fetch('./config/favorites.json');
      const data = await response.json();
      this.favorites = data.favorites || [];
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
});