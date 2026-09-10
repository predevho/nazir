/**
 * 절대 URL 기준값. OG 태그·사이트맵처럼 절대 경로가 필요한 곳에서 쓴다.
 *
 * 우선순위
 * 1. `NEXT_PUBLIC_SITE_URL` — 실제 도메인이 정해지면 여기에 넣는다
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel 프로덕션 도메인(프리뷰에서도 프로덕션을 가리킴)
 * 3. `VERCEL_URL` — 프리뷰 배포 주소
 * 4. localhost — 개발
 *
 * 도메인이 틀리면 공유 카드가 깨지므로, 배포 전에 1번을 채우는 것이 가장 확실하다.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod}`;

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return `https://${preview}`;

  return 'http://localhost:3000';
}
