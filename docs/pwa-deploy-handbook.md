# 🚀 PWA 배포 운영 매뉴얼

## Instruction Prompt Engine v10+ 배포 가이드

### 개요

이 문서는 dtslib1979/Instruction-prompt-engine 레포지토리의 PWA 배포 과정을 표준화한 운영 매뉴얼입니다. Apple-like 다크 스킨, 모바일 1컬럼 드로어, Imprint 정돈, 캐시 무감각 배포를 위한 완전한 가이드를 제공합니다.

### 버전 업그레이드 절차

#### 1단계: 새 CSS 파일 생성

```bash
# 현재 최신 CSS를 다음 버전으로 복사
cp styles.v{current}.css styles.v{next}.css

# 예시: v10 → v11
cp styles.v10.css styles.v11.css
```

#### 2단계: index.html 수정

```html
<!-- CSS 링크 교체 -->
<link rel="stylesheet" href="styles.v{next}.css" />

<!-- 푸터 버전 배지 교체 -->
<footer class="app-footer">
  <small>© dtslib. All rights reserved. · <span id="appVersion">v{next}</span></small>
</footer>
```

#### 3단계: sw.js 수정

```javascript
// 캐시 키 및 CORE 배열 업데이트
const CACHE = 'instruction-pwa-v{next}';
const CORE = [
  './',
  './index.html',
  './styles.v{next}.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/cover.webp',
];
```

#### 4단계: app.js 수정

```javascript
// 버전 뱃지 텍스트 업데이트
document.addEventListener('DOMContentLoaded', () => {
  const ver = $('#appVersion');
  if (ver) ver.textContent = 'v{next}';
});
```

#### 5단계: 커밋 & 푸시

```bash
git add index.html styles.v{next}.css sw.js app.js
git commit -m "release(v{next}): rotate SW cache, update css link, bump footer badge"
git push origin main
```

### 배포 후 확인 절차

#### 1. GitHub Actions 확인

- GitHub Actions → "Pages build and deployment" 워크플로 ✅ 확인
- 빌드 로그에서 에러 없이 완료되었는지 확인

#### 2. 캐시 무감각 테스트

- **시크릿 모드/인코그니토** 브라우저에서 사이트 접속
- 푸터에 새 버전 번호 표시 확인
- 하드 리프레시 (Ctrl+F5 또는 Cmd+Shift+R) 테스트

#### 3. 핵심 기능 검증

- **☰ 메뉴 버튼**: 사이드바 드로어 열림 확인
- **★ 즐겨찾기 버튼**: 우측 드로어 열림 확인
- **동기화 버튼**: 카테고리 카운트 반영 확인
- **복사 버튼**: 클립보드 복사 동작 확인
- **Imprint**: EN/KR 토글, 모바일 1컬럼 자연스러운 줄바꿈 확인

#### 4. PWA 동작 확인

- 기존 PWA 앱 삭제 후 재설치
- 앱에서 새 버전 번호 표시 확인
- 오프라인 모드에서 캐시된 콘텐츠 로드 확인

### 캐시 전략 이해

#### Service Worker 캐시 회전

- 각 버전은 독립적인 캐시 키를 사용 (`instruction-pwa-v{n}`)
- 새 버전 배포 시 이전 캐시는 자동으로 정리됨
- CSS 파일명 버저닝으로 브라우저 캐시 무력화

#### 캐시 대상 파일

- **정적 자원**: HTML, CSS, JS, 이미지, 매니페스트
- **동적 콘텐츠**: GitHub API 호출은 `cache: 'no-store'`로 항상 최신 데이터

### 디자인 시스템

#### Apple-like 다크 스킨

- 메인 컬러: `--primary: #1d1d1f` (Apple 다크)
- 액센트: `--accent: #cd853f` (페루 골드)
- 카드 배경: `--card-bg: #2d2d30`
- 텍스트: `--text: #f5f5f7`

#### 반응형 레이아웃

- **데스크톱** (821px+): 3컬럼 레이아웃 (사이드바-메인-즐겨찾기)
- **모바일** (820px-): 1컬럼 + 드로어 시스템
- **터치 최적화**: 44px+ 터치 타겟

### 문제 해결

#### 캐시 문제

```bash
# 브라우저 개발자 도구 → Application → Storage → Clear storage
# 또는 시크릿 모드에서 테스트
```

#### Service Worker 갱신 안됨

```javascript
// 콘솔에서 강제 갱신
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}
```

#### PWA 설치 문제

- HTTPS 필수 (GitHub Pages는 자동 제공)
- 매니페스트 파일 유효성 확인
- 아이콘 파일 존재 확인 (192px, 512px)

### 모니터링

#### 성능 지표

- **Core Web Vitals**: Lighthouse에서 90+ 점수 유지
- **PWA 점수**: 100점 달성 목표
- **접근성**: AA 등급 준수

#### 사용자 피드백

- GitHub Issues를 통한 버그 리포트 수집
- PWA 설치율 및 사용 패턴 모니터링

### 버전 관리 정책

#### 시맨틱 버저닝

- **Major** (v10 → v20): 대규모 UI/UX 변경
- **Minor** (v10 → v11): 기능 추가, 디자인 개선
- **Patch** (v10.1): 버그 수정, 마이너 조정

#### CSS 파일 관리

- 이전 버전 CSS 파일 유지 (롤백 대비)
- 3개 버전 이상 차이 시 정리 고려

---

**📝 마지막 업데이트**: v10 릴리스 (2024년)  
**✅ 검증됨**: Apple-like 다크 스킨, 모바일 드로어, 캐시 회전  
**🔗 레포지토리**: [dtslib1979/Instruction-prompt-engine](https://github.com/dtslib1979/Instruction-prompt-engine)
