import { redirect } from 'next/navigation';
import { JOIN_SECTIONS } from '@/content/join';

/**
 * GNB의 `후원과 기도`는 `/join`으로 걸려 있고, 시안에는 2개 서브페이지만 있다.
 * 〈나지르〉에 대하여와 같은 방식으로 전부 `/join/[slug]`에 두고 여기서는 첫 장으로 보낸다.
 */
export default function Join() {
  redirect(`/join/${JOIN_SECTIONS[0].slug}`);
}
