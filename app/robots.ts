import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

/** 관리자 화면과 API는 색인에서 뺀다. 로그인으로 막혀 있지만 검색 결과에 뜰 이유도 없다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
