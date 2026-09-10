import type { Metadata } from 'next';

/**
 * 공유 카드의 고정 부분. 루트 레이아웃과 각 페이지가 함께 쓴다.
 *
 * Next는 metadata를 **얕게** 병합한다. 하위 페이지가 `openGraph`를 선언하는 순간
 * 부모의 `openGraph`는 통째로 사라진다 — url 하나 넣자고 선언했다가 og:image까지
 * 날아가는 사고가 여기서 난다. 그래서 공통 항목을 상수로 두고 매번 다시 얹는다.
 */
export const OG_BASE = {
  type: 'website',
  locale: 'ko_KR',
  siteName: '나지르',
  images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: '창작뮤지컬 〈나지르〉' }],
} as const satisfies Metadata['openGraph'];

/**
 * 페이지가 "내 주소는 여기다"라고 밝히는 부분.
 *
 * - `og:url` — 카톡·인스타 공유 카드를 눌렀을 때 열리는 주소다. 비워 두면
 *   루트의 `/`가 상속돼서, 후원 페이지를 공유해도 카드가 홈으로 간다.
 * - `canonical` — 같은 내용이 여러 주소로 열릴 때 검색엔진에 대표 주소를 알린다.
 *   지금 `www.nazir.cloud`와 `nazir-rosy.vercel.app`이 둘 다 200으로 열리므로 필요하다.
 *
 * 경로는 상대 경로로 넘긴다. 루트의 `metadataBase`(= NEXT_PUBLIC_SITE_URL)가
 * 절대 URL로 펼쳐 준다.
 */
export function pageMeta(path: string): Pick<Metadata, 'alternates' | 'openGraph'> {
  return {
    alternates: { canonical: path },
    openGraph: { ...OG_BASE, url: path },
  };
}
