# v24.1 Hotfix Guide (Chrome Android layout breakage)

목표
- 기기·브라우저가 달라도 재현/수집/임시 보정/영구 반영이 가능하도록 안전장치 도입

구성
1) Remote no-cache & Debug
2) Runtime guard (Chrome Android일 때 1열 강제)
3) CSS 커버리지 확장
4) 배포/검증 루틴

## A. 원격·무캐시 테스트

- 링크 예시:
  - https://<host>/?v=24.1&nuke=1&debug=1
  - 필요 시 ?force1=1 로 1열 수동 강제

- 기대 동작:
  - nuke=1 → 브라우저/서비스워커 캐시 무시
  - debug=1 → 하단 디버그 패널(UA, vw/vh, root/cols, 1-Column 버튼, Reload)
  - force1=1 → 런타임 1열 강제

## B. 런타임 가드

- 조건:
  - Chrome(Android) + 좁은 폭(≤900px) → grid 1fr 강제
  - UA-CH(navigator.userAgentData) 사용, 미지원 폴백은 UA

- 디버그 플래그:
  - documentElement --fix-v24-1=1

## C. CSS 강화

- 컨테이너 선택자 커버리지 확장: [data-layout-root], .main-grid, .layout, .columns, .categories-row
- 100dvh/svh + --vh 폴백
- overflow-x: hidden, min-width:0 누락 방지
- Safe area inset 적용

## D. 실제 기기 재현·수정 루틴

1. 내 폰 크롬에서:
   - https://<host>/?v=24.1&nuke=1&debug=1
   - 디버그 패널에서 root/cols 확인
   - 1-Column 버튼 클릭 시 즉시 정상화 되는지 확인

2. 여전히 다열이면:
   - 패널 root class명을 기록 → styles.css 선택자 목록에 추가
   - app.js 런타임 가드 fix 플래그(--fix-v24-1)가 1인지 확인

3. 정상화되면:
   - CSS에 영구 반영(선택자 추가/간격 조정)
   - 다음 버전에서 JS 가드 범위를 축소/제거

## E. 원격 디버깅(권장)

- 크롬 DevTools: chrome://inspect/#devices
- Android: 개발자 옵션 + USB 디버깅 ON → "inspect"로 DOM/CSS 실측 확인

## 배포 체크리스트

- [ ] sw.js CACHE_NAME = 'ipwa-cache-v24-1' 로 업데이트
- [ ] 정적 자산 캐시 해시(가능하면 filename hash 병행)
- [ ] 배포 직후 실제 기기에서 nuke=1로 진입해 SW가 교체됐는지 확인(sw:on)
- [ ] 디버그 패널 값(root/cols/DPR/vw/vh) 캡쳐
- [ ] CSS 커버리지 누락 시 선택자 추가 후 재배포
- [ ] 이슈/PR에 스크린샷과 재현 링크 첨부