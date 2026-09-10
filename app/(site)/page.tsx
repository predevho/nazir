import { LANDING_CARDS } from '@/content/landing';
import { LandingCards } from '@/components/landing/LandingCards';
import { Curtain } from '@/components/shell/Curtain';

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
      {/* 막은 홈에만 있다. 공통 레이아웃이 아니라 여기 있는 것이 곧 "홈에서만 뜬다"는 보장이다. */}
      <Curtain />
      <h1 className="sr-only">창작뮤지컬 &lt;나지르&gt; 기록 및 후원 안내</h1>

      {/*
        시안 히어로(1920×757)는 세로 포스터를 얇은 띠로 잘라 쓰는데, 그러면 헤드라인
        `이 뮤지컬은 무대에 올라갈 수 있을까요?`의 윗줄이 통째로 잘려 나간다.
        포스터에서 글자가 차지하는 세로 범위가 70%를 넘어서, 2.5:1 띠에는 구조적으로
        들어가지 않는다.

        그래서 자르지 않고 포스터를 통째로 얹고, 히어로 배경색을 포스터의 배경 노랑과
        같은 값으로 깔았다. 포스터 가장자리가 배경과 이어져 레터박스처럼 보이지 않는다.
        잘라내지 않으니 어떤 비율을 줘도 글자가 상하지 않는다. 화면이 넓어질수록
        포스터 양옆의 노랑만 넓어진다.
        - 모바일(~767): 3:4 — 포스터 비율과 같아 화면을 꽉 채운다
        - 태블릿(768~1279): 3:2 — 3:4로 두면 아이패드 세로에서 히어로가 한 화면을 다 먹는다
        - 데스크톱(1280~): 16:9

        배경색 `#AE9B22`는 브라우저가 이 webp에서 실제로 디코딩하는 모서리 픽셀 값이다.
        원본 PNG를 이미지 라이브러리로 재면 다른 값이 나오는데(색 프로파일 처리 차이),
        화면에서 이음매가 보이는지는 브라우저가 보는 값이 정하므로 그쪽을 따랐다.
        검정 20% 오버레이는 이미지에 구워져 있어 CSS로 다시 얹지 않는다.
      */}
      <div
        className="aspect-[39/52] w-full bg-[url(/images/landing-poster.webp)] bg-contain bg-center bg-no-repeat md:aspect-[3/2] xl:aspect-[16/9]"
        style={{ backgroundColor: '#AE9B22' }}
      />

      <div className="mx-auto max-w-content px-6 xl:px-8 py-[clamp(48px,9vw,120px)]">
        <LandingCards cards={LANDING_CARDS} />
      </div>
    </section>
  );
}
