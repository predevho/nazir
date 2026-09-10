import Link from 'next/link';
import { NAV_ITEMS } from '@/content/nav';

/**
 * 없는 주소로 들어왔을 때의 화면.
 *
 * Next 기본 404 는 흰 바탕에 영문 한 줄(`404: This page could not be found.`)이라,
 * 사이트와 아무 관계 없는 화면이 뜬다. 이 사이트는 링크가 카톡·인스타로 도는 것이 주
 * 유입이라 주소가 잘려 들어오는 사람이 실제로 생긴다 — 그 사람이 처음 보는 화면이 여기다.
 * 그래서 "잘못 왔다"보다 **나갈 길**을 크게 둔다.
 *
 * 큰 `404` 숫자는 두지 않는다. 개발자에게는 익숙한 번호지만 보는 사람 대부분에게는
 * 뜻 없는 세 자리다. 그 자리를 심볼에 준다 — 적어도 "여기가 나지르구나"는 읽힌다.
 *
 * 공통 헤더·푸터는 쓰지 않는다. 둘 다 관리자가 고친 값을 읽으려고 DB 를 부르는데,
 * 404 는 존재하지 않는 주소를 훑는 봇이 대량으로 만들어 내는 응답이다. 대신 로고와
 * 메뉴를 여기에 직접 둬서 돌아갈 길은 그대로 남긴다.
 */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center px-6 py-[clamp(48px,10vw,96px)] text-center">
      <Link href="/" aria-label="나지르 홈" className="tap-target">
        <img
          src="/images/logo-symbol.webp"
          alt=""
          width={308}
          height={320}
          className="h-[clamp(104px,26vw,148px)] w-auto"
        />
      </Link>

      <h1 className="mt-[clamp(28px,6vw,44px)] font-heir text-[clamp(24px,5vw,36px)] leading-[1.4] tracking-[-0.025em] text-ds-text">
        이 장면은 무대에 없습니다
      </h1>
      <p className="mt-4 font-heir text-[15px] leading-[2] text-ds-text/60">
        주소가 바뀌었거나, 아직 오르지 않은 장면입니다.
      </p>

      <Link
        href="/"
        className="mt-[clamp(28px,5vw,40px)] flex min-h-[48px] items-center justify-center rounded-sm bg-ds-key2 px-7 font-heir text-[15px] text-ds-key1 transition-opacity hover:opacity-90"
      >
        처음으로 돌아가기
      </Link>

      <hr className="mt-[clamp(40px,7vw,64px)] w-full border-0 border-t-[0.5px] border-ds-key2/25" />

      <nav aria-label="주요 메뉴" className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className="tap-target font-heir text-[15px] leading-[2] text-ds-text/65 transition-colors hover:text-ds-key2"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
