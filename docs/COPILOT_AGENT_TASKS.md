# 목표

- Instruction-prompt-engine 레포를 전수 점검하고, 빌드/테스트/품질 기준을 재정립하여 안정적인 개발 속도를 회복한다.
- 코드 스멜/죽은 코드/중복/성능/보안/구조 문제를 자동 진단 + 점진적으로 수정한다.

# 브랜치 전략

- 작업 브랜치: chore/repo-hardening-instruction-prompt-engine
- 커밋 단위는 "한 가지 목적" 원칙으로 쪼갠다: 진단/포맷/린트/타입/의존성/테스트/리팩토링/문서/CI

# 에이전트 실행 절차

## 0) 준비

- 현재 브랜치 확인 후 작업 브랜치 생성
- .gitignore 확인, 빌드 산출물/캐시가 추적되지 않도록 점검
- 스냅샷 기록: git ls-files -z | xargs -0 sha1sum > .pre_hardening_snapshot.sha

## 1) 자동 진단

- bash scripts/repo_diagnose.sh 실행
- .repo-diagnostics/ 디렉터리의 산출물 확인: 린트/타입/빌드/테스트 결과, 의존성 충돌, 후보 스멜 리포트

## 2) 패키지/의존성 정리

- package manager 단일화(pnpm 권장. lock 파일 1개만 유지)
- peer/unmet dependencies 해결
- semver patch/minor 업데이트 가능 범위 내에서 최신화(major는 별도 PR)

## 3) 품질 기본선 복원

- 포맷: Prettier 적용(대규모 포맷 변경은 단독 커밋)
- 린트: eslint/ruff 등 도구 결과를 기준으로 경미한 룰 위반을 우선 정리
- 타입: TypeScript가 있다면 tsc --noEmit 통과, Python이면 mypy(선택)
- 테스트: 최소 스모크 테스트 추가 및 깨지는 테스트 수정

## 4) 구조/성능/가독성 개선(점진)

- 파일 길이 300LOC 이상 컴포넌트/모듈 분해
- 중복 로직을 유틸/훅/서비스로 추출
- 불변성 보장/메모이제이션(useMemo/useCallback)으로 불필요 재렌더 감소(프론트엔드인 경우)
- 동기 I/O, O(n^2) hot path, 불필요 JSON.stringify/parse 제거
- API/IO 경계(에러 처리/타임아웃/재시도/backoff) 보강
- ts-prune/depcruise로 죽은 코드/순환 의존 제거
- 번들 사이즈 분석 후 지연 로딩/아이콘 트리셰이킹 적용(웹 클라이언트가 있을 경우)

## 5) 보안/구성

- .env.example 최신화(민감정보 제외, 최소 실행 변수 명시)
- 의도치 않은 비밀유출 검색: git-secrets 또는 간단 grep로 key/token 패턴 탐지
- 의존성 악성 패키지/라이선스 스캔(선택: npm audit, osv-scanner)

## 6) 문서화

- README 최소 실행 가이드(설치/실행/테스트/빌드/배포) 정리
- CONTRIBUTING, 코드 스타일, 커밋 컨벤션 추가

## 7) CI

- .github/workflows/ci.yml로 린트/타입/테스트/빌드/진단 자동화
- PR에서 진단 아티팩트 업로드

## 8) PR 규칙

- PR 템플릿 사용(문제/원인/해결/테스트/리스크/스크린샷)
- 스크린샷/로그/측정 결과(전/후) 첨부
- 대규모 포맷/리네이밍은 기능 변경과 분리

# 권장 커밋 순서 예시

- chore(ci): add repo diagnose script and CI workflow
- chore(format): apply prettier across repo
- chore(lint): fix eslint violations
- chore(types): fix tsc errors
- chore(deps): dedupe and resolve peer conflicts
- refactor(core): extract prompt rules engine; remove dead code
- test: add smoke tests for core prompt evaluation
- docs: update README and .env.example

# 인증 체크리스트

- [ ] lint/type/test/build CI 통과
- [ ] .env.example 및 README 업데이트
- [ ] 죽은 코드/순환 의존 제거
- [ ] 중복/거대 파일 분해
- [ ] 보안/비밀값 누락 확인
- [ ] 성능 핫스팟 개선(측정/근거 포함)
