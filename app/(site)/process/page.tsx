import { redirect } from 'next/navigation';
import { PROCESS_SECTIONS } from '@/content/process';

/**
 * GNB의 `제작 과정`은 `/process`로 걸려 있고, 시안에는 2개 서브페이지만 있다.
 * 다른 상위 메뉴와 같은 방식으로 전부 `/process/[slug]`에 두고 여기서는 첫 장으로 보낸다.
 */
export default function Process() {
  redirect(`/process/${PROCESS_SECTIONS[0].slug}`);
}
