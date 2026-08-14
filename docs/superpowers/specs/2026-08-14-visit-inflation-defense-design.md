# 나지르 — 방문자 집계 인플레이션 방어 설계

작성일: 2026-08-14
상태: 확정 (구현 대기)

## 목표

방문자 집계(`visits`)가 봇·조작으로 부풀려지는 것을 서버에서 조용히 방어한다.
방문자 UX·페이지 로딩에는 전혀 영향을 주지 않는다(캡차·인터스티셜 없음).

## 결정 사항

| 항목 | 결정 |
|---|---|
| A. 봇 UA 필터 | `/api/visit`에서 User-Agent가 비었거나 봇/스크립트 패턴이면 집계 스킵(204) |
| B. IP당 하루 상한 | 한 IP가 하루에 만들 수 있는 새 방문자 행을 **100개**로 제한 |
| IP 처리 | 라우트에서 **SHA-256(IP + 솔트)** 해시만 계산·전달. **원본 IP는 저장 안 함** |
| 솔트 | 환경변수 `VISIT_IP_SALT`(미설정 시 기본값 폴백, 추후 Vercel에 추가) |
| 페이지 영향 | 없음(집계 여부만 서버에서 결정) |

## 아키텍처

### 순수 헬퍼 `lib/visitorGuard.ts`

```
isBotUserAgent(ua: string): boolean
```
- ua가 빈 문자열이면 true(봇 취급).
- 봇/크롤러/스크립트 패턴(대소문자 무시) 매칭 시 true:
  `bot, crawl, spider, slurp, headless, bingpreview, facebookexternalhit,
   slackbot, telegrambot, whatsapp, discordbot, python-requests, curl, wget,
   axios, node-fetch, google-inspectiontool`
- 순수 함수 → 단위 테스트 대상.

### 라우트 `app/api/visit/route.ts` (수정)

1. `User-Agent` 확인 → `isBotUserAgent` true면 즉시 204(기록 안 함).
2. `visitorId` 길이(8~64) 검증(기존).
3. IP 해시 계산: `x-real-ip` 또는 `x-forwarded-for` 첫 항목 → `sha256(ip + ':' + salt)`(Node `crypto`). IP 없으면 빈 문자열.
4. `rpc('record_visit', { p_visitor_id, p_ip_hash })` 호출.
5. 항상 204 반환(실패 무시).

### 마이그레이션 `supabase/migrations/0006_visits_ip_cap.sql`

- `visits`에 `ip_hash text not null default ''` 추가.
- `record_visit(text)`를 drop하고 `record_visit(p_visitor_id text, p_ip_hash text default '')`로 재정의:
  - visitor_id 길이 검증.
  - `p_ip_hash <> ''`이면 오늘(KST) 해당 ip_hash 행 수가 **100 미만일 때만** 진행(상한).
  - `(visitor_id, visited_on)` upsert(중복 무시), ip_hash 함께 저장.
  - `p_ip_hash`에 default '' → 배포 중 옛 라우트(1-arg 호출)도 무해하게 동작(하위호환).
- anon·authenticated 실행 권한 재부여.
- `get_visit_stats`는 변경 없음(여전히 distinct visitor_id·오늘·7일 집계; ip_hash 미노출).

## 데이터 흐름

```
[방문자] 페이지 로드 → 비콘 POST /api/visit
  → 봇 UA면 스킵(204)
  → 아니면 ip_hash 계산 → record_visit(visitor_id, ip_hash)
     → ip_hash 오늘 100 미만이면 (visitor_id, 오늘) upsert
```

## 에러 처리 / 엣지

- UA 빈 값 → 봇 취급(스킵). 정상 브라우저는 항상 UA를 보냄.
- IP 미확보(로컬 등) → ip_hash '' → 상한 미적용(그냥 기록). 프로덕션은 Vercel이 IP 헤더 세팅.
- 상한 도달 → 조용히 스킵. 방문자 화면 영향 없음.
- 배포 순서: `0006` 먼저 적용해도 옛 라우트가 default로 동작하므로 공백 없음.

## 보안 / 개인정보

- 원본 IP는 **저장·전달 안 함**(라우트에서 즉시 해시). 저장값은 솔트 해시(가명·복원 불가).
- 솔트 미설정 시 기본값으로 동작하나, `VISIT_IP_SALT`를 Vercel에 설정하면 해시 프라이버시 강화.
- 통계 조회는 여전히 authenticated만.

## 테스트

- `lib/visitorGuard.test.ts`: `isBotUserAgent` — 실제 브라우저 UA false, 봇/스크립트/빈값 true.
- DB 함수·라우트·IP 해시는 통합 영역이라 단위 테스트 제외.
- 기존 60개 유지, `npm test`·`npm run build` 통과.

## 범위 밖 (YAGNI)

- 엣지 레벨 rate limit(요청 수 자체 제한), 캡차/JS 챌린지.
- 지역·기기·유입경로 분석.
