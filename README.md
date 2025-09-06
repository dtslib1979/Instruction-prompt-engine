# 📱 Instruction Prompt PWA

A Progressive Web App for managing and organizing your AI prompts and instructions.

## 🚀 Features

- **4 Organized Categories**: ChatGPT GPT, ChatGPT Project, ChatGPT Thread, GitHub Copilot
- **📱 PWA Support**: Install on mobile devices for offline access
- **⭐ Favorites System**: Quick access to frequently used prompts
- **📋 One-click Copy**: Copy prompts directly to clipboard
- **🔄 Real-time Sync**: Sync with GitHub repository for latest prompts
- **📱 Mobile-first Design**: Responsive design optimized for mobile devices
- **🌐 Offline Ready**: Service worker for offline functionality

## 🛠 Installation

1. **GitHub Pages Deployment**:
   ```bash
   # Enable GitHub Pages in repository settings
   # Settings → Pages → Deploy from a branch
   # Branch: main, Folder: / (root)
   ```

2. **Access the PWA**:
   - Visit: `https://dtslib1979.github.io/Instruction-prompt-engine/`
   - On mobile, tap "설치" button to install as PWA

## 📁 Directory Structure

```
├── assets/                   # PWA icons and images
├── config/                   # Configuration files
│   ├── settings.json        # Repository settings
│   └── favorites.json       # Favorites management
├── library/                 # Prompt categories
│   ├── chatgpt-gpt/        # GPT persona prompts
│   ├── chatgpt-project/    # Project studio prompts
│   ├── chatgpt-thread/     # Individual thread prompts
│   └── github-copilot/     # Copilot instructions
├── index.html              # Main PWA interface
├── app.js                  # Application logic
├── styles.css              # Styling
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
└── .nojekyll              # Disable Jekyll processing
```

## 📝 Adding New Prompts

1. Create `.md` files in the appropriate `library/` subdirectory
2. Use format: `01-prompt-name.md`, `02-another-prompt.md`
3. Click "동기화" button in the PWA to refresh content

## 🔧 Configuration

### Settings (`config/settings.json`)
```json
{
  "repoOwner": "dtslib1979",
  "repoName": "Instruction-prompt-engine", 
  "branch": "main"
}
```

### Favorites (`config/favorites.json`)
```json
{
  "favorites": [
    { "title": "System Prompt 뼈대", "path": "library/chatgpt-gpt/01-basic-system.md" },
    { "title": "커밋 스타일", "path": "library/github-copilot/01-commit-style.md" }
  ]
}
```

## 🎯 Usage

1. **Browse Categories**: Click on category names to view prompts
2. **Copy Prompts**: Use the 📋 button to copy prompt content
3. **Manage Favorites**: Star/unstar prompts for quick access
4. **Sync Updates**: Click "동기화" to fetch latest prompts from GitHub
5. **Install PWA**: Use "설치" button on mobile for offline access

## 🌟 Key Benefits

- **Organized**: Categorized prompt library for different use cases
- **Accessible**: Works on any device with a web browser
- **Offline**: PWA functionality for offline prompt access
- **Synced**: Real-time updates from GitHub repository
- **Mobile-optimized**: Touch-friendly interface for mobile devices

## 📱 PWA Features

- Installable on iOS/Android devices
- Offline functionality via service worker
- Native app-like experience
- Background sync capabilities
- Push notification ready (future enhancement)

---

© Parksy · 실시간 카운트 · 오프라인 PWA
