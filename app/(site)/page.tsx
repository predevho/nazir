import { LANDING_CARDS } from '@/content/landing';
import { LandingCards } from '@/components/LandingCards';

export const revalidate = 60;

/**
 * 시안 `랜딩페이지`(355:945, 1920×2019).
 * 히어로 Rectangle 14: 1920×757, 채우기 `1.png`(자르기) + 검정 20% 오버레이.
 * 히어로에 텍스트가 없고 카피가 이미지 안에 그려져 있어, h1은 화면에서 숨기고
 * 스크린리더에만 남긴다.
 *
 * 히어로·카드 아이콘 이미지는 public/images/ 에 둔다 (public/images/README.md 참고).
 * 파일이 없으면 배경만 비고 레이아웃은 그대로 유지된다.
 */
export default function Home() {
  return (
    <section>
      <h1 className="sr-only">창작뮤지컬 &lt;나지르&gt; 기록 및 후원 안내</h1>

      <div
        className="w-full bg-ds-bg bg-cover bg-center bg-no-repeat"
        style={{
          aspectRatio: '1920 / 757',
          backgroundImage:
            'linear-gradient(0deg, rgba(0,0,0,.2), rgba(0,0,0,.2)), url(/images/landing-hero.png)',
        }}
      />

      <div className="mx-auto max-w-content px-8 py-[clamp(48px,9vw,120px)]">
        <LandingCards cards={LANDING_CARDS} />
      </div>
    </section>
  );
}
