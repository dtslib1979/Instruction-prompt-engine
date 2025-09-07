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

## 🔧 Development

### Prerequisites

- Node.js 18+ (recommended: Node.js 20)
- pnpm (preferred package manager)

### Quick Start

```bash
# Clone repository
git clone https://github.com/dtslib1979/Instruction-prompt-engine.git
cd Instruction-prompt-engine

# Install dependencies
pnpm install

# Start development server
pnpm run dev
# Opens at http://localhost:8080

# Run quality checks
pnpm run lint          # ESLint code linting
pnpm run typecheck     # TypeScript type checking
pnpm run format        # Prettier code formatting
pnpm test             # Run smoke tests
pnpm run diagnose     # Full repository diagnosis
```

### Scripts

- `pnpm run lint` - Run ESLint for code quality
- `pnpm run lint:fix` - Auto-fix ESLint issues
- `pnpm run format` - Apply Prettier formatting
- `pnpm run format:check` - Check formatting without changes
- `pnpm run typecheck` - TypeScript type checking
- `pnpm test` - Run test suite
- `pnpm run diagnose` - Run comprehensive repo diagnosis
- `pnpm run dev` - Start development server
- `pnpm run serve` - Serve production build

### Quality Assurance

This project uses comprehensive quality tools:

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Type checking for JavaScript files
- **Automated CI**: GitHub Actions for continuous integration
- **Repository Diagnosis**: Custom script for health monitoring

### CI/CD

GitHub Actions automatically:

- ✅ Runs linting and type checking
- ✅ Executes test suite
- ✅ Performs repository diagnosis
- ✅ Uploads diagnostic artifacts
- ✅ Validates code formatting

See `.github/workflows/ci.yml` for complete pipeline configuration.

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
├── .github/                  # GitHub configuration
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── workflows/           # CI/CD workflows
│   └── pull_request_template.md
├── assets/                   # PWA icons and images
├── config/                   # Configuration files
│   ├── settings.json        # Repository settings
│   └── favorites.json       # Favorites management
├── docs/                     # Documentation
│   ├── COPILOT_AGENT_TASKS.md  # Agent execution guide
│   ├── AGENT_RUNBOOK.md     # Operational runbook
│   ├── REVIEW_CHECKLIST.md  # Code review checklist
│   └── pwa-deploy-handbook.md
├── library/                 # Prompt categories
│   ├── chatgpt-gpt/        # GPT persona prompts
│   ├── chatgpt-project/    # Project studio prompts
│   ├── chatgpt-thread/     # Individual thread prompts
│   └── github-copilot/     # Copilot instructions
├── scripts/                 # Utility scripts
│   └── repo_diagnose.sh    # Repository diagnosis tool
├── tests/                   # Test files
│   └── smoke.test.js       # Basic functionality tests
├── index.html              # Main PWA interface
├── app.js                  # Application logic
├── app-version.js          # Version management
├── sw.js                   # Service worker
├── styles.css              # Main styling
├── manifest.webmanifest    # PWA manifest
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .env.example            # Environment variables template
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

## 🤝 Contributing

### Code Quality Standards

Before submitting any changes:

```bash
# Check code quality
pnpm run lint
pnpm run typecheck
pnpm run format:check
pnpm test

# Auto-fix common issues
pnpm run lint:fix
pnpm run format
```

### Commit Conventions

Follow conventional commit format:

- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `docs(scope): update documentation`
- `style(scope): format code`
- `refactor(scope): refactor code`
- `test(scope): add tests`
- `chore(scope): maintenance tasks`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with descriptive commits
3. Run quality checks: `pnpm run lint && pnpm run typecheck && pnpm test`
4. Submit PR with filled template
5. Ensure CI passes before requesting review

### Repository Health Monitoring

Use the diagnostic script to monitor repository health:

```bash
bash scripts/repo_diagnose.sh
```

This generates detailed reports in `.repo-diagnostics/` covering:

- Code quality metrics
- Dependency analysis
- Security scan results
- Performance indicators
- File size analysis

See `docs/COPILOT_AGENT_TASKS.md` for comprehensive maintenance procedures.

---

© Parksy · 실시간 카운트 · 오프라인 PWA
