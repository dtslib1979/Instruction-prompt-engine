name: Tech debt / Hardening
description: 누적된 기술 부채/품질 문제를 정리합니다.
title: "chore(hardening): <주제>"
labels: ["tech-debt", "refactor"]
body:

- type: textarea
  id: context
  attributes:
  label: Context
  description: 문제 배경/영향/관련 코드
  validations:
  required: true
- type: textarea
  id: plan
  attributes:
  label: Plan
  description: 단계별 해결 계획(작은 PR로 분할)
  validations:
  required: true
- type: textarea
  id: tests
  attributes:
  label: Tests
  description: 검증 방법(단위/통합/E2E/측정)
  validations:
  required: false
