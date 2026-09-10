import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';
import { getContent } from '@/lib/content';
import { ABOUT_SECTIONS } from '@/content/about';
import { JOIN_SECTIONS } from '@/content/join';
import { PROCESS_SECTIONS } from '@/content/process';

export const revalidate = 3600;

/**
 * 공개 페이지만 넣는다. `/admin/*` 과 API는 제외.
 * 상위 경로(`/about` 등)는 첫 장으로 리다이렉트만 하므로 빼고 실제 페이지만 올린다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const paths = [
    '/',
    ...ABOUT_SECTIONS.map((s) => `/about/${s.slug}`),
    ...PROCESS_SECTIONS.map((s) => `/process/${s.slug}`),
    '/people',
    ...JOIN_SECTIONS.map((s) => `/join/${s.slug}`),
    '/guestbook',
  ];

  // 개인 상세는 콘텐츠에서 끌어온다. 실패해도 사이트맵 전체가 깨지지 않게 감싼다.
  let people: string[] = [];
  try {
    const { people: groups } = await getContent();
    people = groups.flatMap((g) => g.members.map((m) => `/people/${m.id}`));
  } catch {
    people = [];
  }

  return [...paths, ...people].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === '/guestbook' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : 0.7,
  }));
}
