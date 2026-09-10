import { LANDING_CARDS } from '@/content/landing';
import { LandingCards } from '@/components/LandingCards';

export const revalidate = 60;

/**
 * 시안 `랜딩페이지`(355:945, 1920×2019).
 * 히어로 Rectangle 14: 1920×757, 채우기 `1.png`(자르기) + 검정 20% 오버레이.
 * 히어로에 텍스트가 없고 카피가 이미지 안에 그려져 있어, h1은 화면에서 숨기고
 * 스크린리더에만 남긴다.
 *
 * 오버레이는 CSS로 얹지 않는다. 원본 포스터가 2904×3871 세로 이미지를 잘라 쓰는
 * 구조라 노드째 내보냈고, 그 결과물에 검정 20%가 이미 반영돼 있다
 * (내보낸 PNG의 채널 최대값이 204 = 255×0.8). 한 번 더 얹으면 이중으로 어두워진다.
 *
 * 이미지는 public/images/ 에 둔다 (public/images/README.md 참고).
 */
export default function Home() {
  return (
    <section>
      <h1 className="sr-only">창작뮤지컬 &lt;나지르&gt; 기록 및 후원 안내</h1>

      <div
        className="w-full bg-ds-bg bg-cover bg-center bg-no-repeat"
        style={{
          aspectRatio: '1920 / 757',
          backgroundImage: 'url(/images/landing-hero.webp)',
        }}
      />

      <div className="mx-auto max-w-content px-8 py-[clamp(48px,9vw,120px)]">
        <LandingCards cards={LANDING_CARDS} />
      </div>
    </section>
  );
}
