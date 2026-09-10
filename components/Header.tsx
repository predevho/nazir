"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** 시안 GNB 메뉴 5개. 라벨은 Figma `개발자용 페이지` 그대로(꺾쇠 없음). */
const items = [
  { to: "/about", label: "나지르에 대하여" },
  { to: "/process", label: "제작 과정" },
  { to: "/people", label: "함께하는 사람들" },
  { to: "/join", label: "후원과 기도" },
  { to: "/guestbook", label: "응원 게시판" },
];

const isActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`);

/**
 * 시안 규격: 높이 80px, 메뉴 그룹 gap 48px, CTA 144×37.
 * 시안의 메뉴 그룹은 중앙에서 16.5px 왼쪽으로 치우쳐 있으나 정렬 오차로 보고
 * 완전 중앙으로 구현한다 — docs/decisions.md 8번.
 * 같은 이유로 좌우 여백을 32px로 통일한다(시안은 로고 left:32 / CTA right:18로 비대칭).
 *
 * 좁은 화면에서는 메뉴가 흐름 안에서 가로 스크롤된다. 햄버거 메뉴는
 * 5단계(모바일 브레이크포인트)에서 다룬다 — docs/roadmap.md.
 */
export function Header({ supportFormUrl }: { supportFormUrl?: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-[100] h-20 bg-ds-bg/95 backdrop-blur-md">
      <nav
        aria-label="주 메뉴"
        className="relative mx-auto flex h-full max-w-[1920px] items-center gap-6 px-8"
      >
        {/* TODO: 최종 로고 심볼 이미지로 교체 (Figma 코멘트 #24). 시안은 90×94 심볼. */}
        <Link
          href="/"
          aria-label="나지르 홈"
          className="shrink-0 font-heir text-[44px] leading-none text-ds-key2"
        >
          N
        </Link>

        <ul className="flex min-w-0 items-center gap-6 overflow-x-auto lg:absolute lg:left-1/2 lg:gap-12 lg:overflow-visible lg:-translate-x-1/2">
          {items.map((it) => {
            const active = isActive(pathname, it.to);
            return (
              <li key={it.to}>
                <Link
                  href={it.to}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap border-b pb-1 font-heir text-[16px] font-bold leading-none tracking-[-0.025em] transition-colors lg:text-[20px] ${
                    active
                      ? "border-ds-key2 text-ds-key2"
                      : "border-transparent text-ds-text hover:text-ds-key2"
                  }`}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <a
          href={supportFormUrl ?? "#"}
          target="_blank"
          rel="noopener"
          className="ml-auto flex h-[37px] w-36 shrink-0 items-center justify-center bg-ds-key2 font-heir text-[16px] leading-none text-ds-key1 transition-opacity hover:opacity-85"
        >
          후원 바로가기
        </a>
      </nav>
    </header>
  );
}
