# 방문자 집계 인플레이션 방어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 봇 UA 필터(A)와 IP당 하루 상한 100(B)으로 방문자 집계 인플레이션을 서버에서 조용히 방어한다.

**Architecture:** `/api/visit`에서 봇 UA를 거르고 SHA-256(IP+솔트) 해시를 계산해 `record_visit(visitor_id, ip_hash)`로 전달. 마이그레이션 `0006`이 `ip_hash` 컬럼과 IP당 하루 상한 로직을 추가한다.

**Tech Stack:** Next.js 16(Route Handler), TypeScript, Node crypto, Supabase(RPC/RLS), Vitest.

---

## 파일 구조
- Create: `supabase/migrations/0006_visits_ip_cap.sql`
- Create: `lib/visitorGuard.ts` + `lib/visitorGuard.test.ts`
- Modify: `app/api/visit/route.ts`
- Modify: `README.md`

---

## Task 1: 마이그레이션 0006 (ip_hash + 상한)

**Files:** Create `supabase/migrations/0006_visits_ip_cap.sql`

- [ ] **Step 1: 작성**

```sql
-- 방문자 집계 인플레이션 방어: ip_hash 컬럼 + IP당 하루 상한(100)
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. 재실행 안전.
alter table visits add column if not exists ip_hash text not null default '';

-- record_visit를 (visitor_id, ip_hash default '')로 재정의(1-arg 호출도 하위호환).
drop function if exists record_visit(text);

create or replace function record_visit(p_visitor_id text, p_ip_hash text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_cap constant int := 100;
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 64 then
    return;
  end if;
  if p_ip_hash <> '' then
    if (select count(*) from visits where ip_hash = p_ip_hash and visited_on = v_today) >= v_cap then
      return;
    end if;
  end if;
  insert into visits (visitor_id, visited_on, ip_hash)
  values (p_visitor_id, v_today, p_ip_hash)
  on conflict (visitor_id, visited_on) do nothing;
end;
$$;
revoke all on function record_visit(text, text) from public;
grant execute on function record_visit(text, text) to anon, authenticated;
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/0006_visits_ip_cap.sql
git commit -m "feat: 방문자 ip_hash 컬럼·IP당 하루 상한 마이그레이션(0006)"
```

> 배포 Supabase에 수동 적용 필요. 구현 중 실제 DB에 적용하지 말 것.

---

## Task 2: 봇 UA 판별 헬퍼 (TDD)

**Files:** Create `lib/visitorGuard.ts`, `lib/visitorGuard.test.ts`

- [ ] **Step 1: 실패 테스트**

`lib/visitorGuard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isBotUserAgent } from './visitorGuard';

describe('isBotUserAgent', () => {
  it('빈 UA는 봇으로 취급', () => {
    expect(isBotUserAgent('')).toBe(true);
    expect(isBotUserAgent('   ')).toBe(true);
  });
  it('알려진 봇/스크립트는 true', () => {
    expect(isBotUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true);
    expect(isBotUserAgent('python-requests/2.31.0')).toBe(true);
    expect(isBotUserAgent('curl/8.4.0')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true);
    expect(isBotUserAgent('HeadlessChrome/120.0')).toBe(true);
  });
  it('실제 브라우저 UA는 false', () => {
    expect(isBotUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe(false);
    expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run lib/visitorGuard.test.ts` → FAIL(미정의).

- [ ] **Step 3: 구현**

`lib/visitorGuard.ts`:

```typescript
const BOT_PATTERN =
  /(bot|crawl|spider|slurp|headless|bingpreview|facebookexternalhit|slackbot|telegrambot|whatsapp|discordbot|python-requests|curl|wget|axios|node-fetch|google-inspectiontool)/i;

/** 봇/스크립트/빈 User-Agent면 true(집계 스킵 대상). */
export function isBotUserAgent(ua: string): boolean {
  if (!ua || ua.trim() === '') return true;
  return BOT_PATTERN.test(ua);
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run lib/visitorGuard.test.ts` → PASS(3 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/visitorGuard.ts lib/visitorGuard.test.ts
git commit -m "feat: 봇 User-Agent 판별 헬퍼 isBotUserAgent 추가"
```

---

## Task 3: 라우트에 봇 필터 + IP 해시 적용

**Files:** Modify `app/api/visit/route.ts`

- [ ] **Step 1: 라우트 교체**

`app/api/visit/route.ts` 전체를 다음으로 교체:

```typescript
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerClient } from '@/lib/supabase';
import { isBotUserAgent } from '@/lib/visitorGuard';

function hashIp(req: Request): string {
  const ip =
    req.headers.get('x-real-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!ip) return '';
  const salt = process.env.VISIT_IP_SALT || 'nazir-visit';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

export async function POST(req: Request) {
  try {
    if (isBotUserAgent(req.headers.get('user-agent') ?? '')) {
      return new NextResponse(null, { status: 204 });
    }
    const { visitorId } = await req.json();
    if (typeof visitorId === 'string' && visitorId.length >= 8 && visitorId.length <= 64) {
      const supabase = createServerClient();
      if (supabase) {
        await supabase.rpc('record_visit', { p_visitor_id: visitorId, p_ip_hash: hashIp(req) });
      }
    }
  } catch {
    // 집계 실패는 무시(사용자 경험 우선)
  }
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: 타입체크·빌드** — `npx tsc --noEmit && npm run build` → 성공(`/api/visit` 확인).

- [ ] **Step 3: 커밋**

```bash
git add app/api/visit/route.ts
git commit -m "feat: 방문 기록에 봇 UA 필터·IP 해시 상한 적용"
```

---

## Task 4: README 갱신

**Files:** Modify `README.md`

- [ ] **Step 1: 반영**
- 마이그레이션 목록에 `0006_visits_ip_cap.sql`(ip_hash·IP당 하루 상한 100, 배포 Supabase 수동 적용) 추가.
- 방문자 대시보드 설명에 "봇 UA 필터 + IP당 하루 상한(솔트 해시, 원본 IP 미저장)로 인플레이션 방어" 한 줄.
- 환경변수 안내에 `VISIT_IP_SALT`(선택, IP 해시 솔트) 추가.

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: 방문자 인플레이션 방어·0006·VISIT_IP_SALT 안내"
```

---

## 최종 검증
- [ ] `npx vitest run` — 기존 60 + 신규(visitorGuard 3) PASS
- [ ] `npx tsc --noEmit` · `npm run build` 성공
- [ ] 배포 Supabase에 `0006` 수동 적용 안내(적용 전에도 앱은 정상, 상한만 미동작)
- [ ] (선택) Vercel에 `VISIT_IP_SALT` 추가 안내
