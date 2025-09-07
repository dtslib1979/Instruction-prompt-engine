# Agent Runbook

이 문서는 "docs/COPILOT_AGENT_TASKS.md"를 운영 관점에서 보완한 상세 런북입니다.

## 사전 조건

- Node 20.x(없으면 18.x), pnpm 설치 권장
- GitHub Actions 권한으로 CI 구동 가능 상태

## 실행 요약

1. chore/repo-hardening-instruction-prompt-engine 브랜치 생성
2. scripts/repo_diagnose.sh 실행 → 산출물 확인
3. 포맷/린트/타입/테스트/빌드 정리 커밋
4. 구조/성능/보안/문서 개선을 작은 PR 여러 개로 분리
5. CI 통합 및 기준선 확보

## 의존성 정리 가이드

- lock 파일 하나만 유지. 중복 시 현재 사용 pm을 기준으로 나머지 삭제
- peerDependency 충돌은 상향/하향 일치화
- audit 이슈는 high/critical 우선, break-change는 별도 PR

## 테스트 최소 기준

- 코어 규칙/프롬프트 평가 엔진에 스모크 테스트 2-3개
- 오류 경로(잘못된 입력, 타임아웃) 1-2개
- 성능 리그레션 방지를 위한 간단 벤치마크(선택)

## 릴리즈/머지 정책

- CI가 lint/type/test/build 성공해야 머지
- 대규모 리팩토링은 기능 플래그 또는 점진 적용
