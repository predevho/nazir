"use client";
import { useState } from "react";
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
 * 시안 규격
 * - 데스크톱: 높이 80px, 메뉴 그룹 gap 48px, CTA 144×37
 * - 모바일(390): 높이 56px, 로고 + 햄버거만 두고 메뉴는 접는다 (docs/mobile-ui.md)
 *
 * 시안의 메뉴 그룹은 중앙에서 16.5px 왼쪽으로 치우쳐 있으나 정렬 오차로 보고
 * 완전 중앙으로 구현한다 — docs/decisions.md 8번.
 * 같은 이유로 좌우 여백을 통일한다(시안은 로고 left:32 / CTA right:18로 비대칭).
 */
export function Header({ supportFormUrl }: { supportFormUrl?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-[100] bg-ds-bg/95 backdrop-blur-md">
      <nav
        aria-label="주 메뉴"
        className="relative mx-auto flex h-14 max-w-[1920px] items-center gap-6 px-4 xl:h-20 xl:px-8"
      >
        {/*
          시안 90×94 심볼(Figma 코멘트 #24). 원본은 벡터가 아니라 980×1016 PNG 라
          비율 그대로 줄여 쓴다. 높이만 지정하고 폭은 auto 로 두어 원본 비율을 지킨다.
          GNB 높이가 56(모바일)·80(데스크톱)이므로 그 안에 드는 34·44 로 맞췄다.
        */}
        <Link
          href="/"
          aria-label="나지르 홈"
          onClick={close}
          className="tap-target flex shrink-0 items-center"
        >
          <img
            src="/images/logo-symbol.webp"
            alt=""
            width={308}
            height={320}
            className="h-[34px] w-auto xl:h-[44px]"
          />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-12 xl:flex">
          {items.map((it) => {
            const active = isActive(pathname, it.to);
            return (
              <li key={it.to}>
                <Link
                  href={it.to}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap border-b pb-1 font-heir text-[20px] font-bold leading-none tracking-[-0.025em] transition-colors ${
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
          className="ml-auto hidden h-[37px] w-36 shrink-0 items-center justify-center bg-ds-key2 font-heir text-[16px] leading-none text-ds-key1 transition-opacity hover:opacity-85 xl:flex"
        >
          후원 바로가기
        </a>

        {/* 시안 모바일 GNB는 햄버거 24×16 하나뿐이다. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          className="tap-target ml-auto flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] xl:hidden"
        >
          <span aria-hidden className="block h-[2px] w-6 bg-ds-text" />
          <span aria-hidden className="block h-[2px] w-6 bg-ds-text" />
          <span aria-hidden className="block h-[2px] w-6 bg-ds-text" />
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-ds-text/10 bg-ds-bg px-6 pb-6 pt-2 xl:hidden">
          <ul className="flex flex-col">
            {items.map((it) => {
              const active = isActive(pathname, it.to);
              return (
                <li key={it.to}>
                  <Link
                    href={it.to}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`block py-3 font-heir text-[18px] font-bold tracking-[-0.025em] ${
                      active ? "text-ds-key2" : "text-ds-text"
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
            onClick={close}
            className="mt-3 flex h-12 items-center justify-center bg-ds-key2 font-heir text-[16px] text-ds-key1"
          >
            후원 바로가기
          </a>
        </div>
      )}
    </header>
  );
}
