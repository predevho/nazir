import { redirect } from 'next/navigation';
import { ABOUT_SECTIONS } from '@/content/about';

/**
 * GNB의 `나지르에 대하여`는 `/about`으로 걸려 있고, 시안에는 4개 서브페이지만 있다.
 * 네 페이지를 대칭으로 다루려고 전부 `/about/[slug]`에 두고 여기서는 첫 장으로 보낸다.
 */
export default function About() {
  redirect(`/about/${ABOUT_SECTIONS[0].slug}`);
}
