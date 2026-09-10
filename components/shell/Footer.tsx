import type { SiteContent } from '@/content/types';

/**
 * 시안 규격: 배경 #181A1B, 3컬럼 각 413px · 간격 64px,
 * 컬럼 제목 26px · 본문 15px, 구분선 0.5px solid #FFFFFF.
 * 시안의 푸터 그룹은 left:-10px, 컬럼 시작이 콘텐츠 컨테이너보다 15px 어긋나 있으나
 * 정렬 오차로 보고 컨테이너(1398px)에 맞춘다 — docs/decisions.md 8번.
 * 컬럼도 413px 고정 대신 컨테이너를 균등 3분할한다(3×413 + 2×64 = 1367로 31px이 남아
 * 시안 자체가 딱 떨어지지 않고, 균등 분할이 반응형에도 유리하다).
 *
 * 연락처는 마스킹하지 않는다 — Figma 코멘트 #47(대표 확인 완료).
 */
function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h2 className="font-heir text-[26px] leading-none text-ds-text">{title}</h2>
      <hr className="mt-6 border-0 border-t-[0.5px] border-white" />
      {/*
        모바일에서만 줄 간격을 벌린다. 링크 높이가 23px라 손가락으로 옆줄을 누르기 쉬운데,
        시안이 이 목록을 24px 간격으로 못 박아 두어 링크 자체를 키울 수는 없다.
        [&>a]:py-1 로 링크의 눌리는 높이만 39px로 올리고, 데스크톱은 시안 그대로 둔다.
      */}
      <div className="mt-6 flex flex-col gap-3 font-heir text-[15px] text-ds-text [&>a]:py-1 md:gap-2 md:[&>a]:py-0">
        {children}
      </div>
    </div>
  );
}

export function Footer({ site }: { site?: SiteContent }) {
  return (
    <footer className="bg-ds-panel px-6 xl:px-8 py-[clamp(40px,6vw,64px)]">
      <div className="mx-auto max-w-content">
        {/*
          워드마크. 가로형 로고 이미지는 없다 — 받은 브랜드 자산이 정사각 심볼뿐이라
          가로로 길게 눕는 이 자리에 그대로 쓸 수 없다. 그래서 심볼과 글자를 나란히 놓아
          하나의 덩어리로 묶는다. GNB 와 같은 심볼을 쓰므로 위아래가 한 브랜드로 읽힌다.
          가로형 워드마크가 오면 이 블록을 <img> 하나로 바꾸면 된다.

          구분선 `|` 은 글자가 아니라 획이다. 낭독기가 "세로줄"이라고 읽지 않도록
          aria-hidden 으로 감추고, 이름 두 개만 읽히게 둔다.
        */}
        <div className="flex items-center gap-[clamp(12px,2vw,18px)]">
          <img
            src="/images/logo-symbol.webp"
            alt=""
            width={308}
            height={320}
            className="h-[clamp(38px,5vw,52px)] w-auto"
          />
          <p className="flex items-center gap-[clamp(8px,1.4vw,12px)] font-heir text-[clamp(26px,4vw,36px)] leading-none text-ds-key2">
            나지르
            <span aria-hidden className="text-ds-key2/40">|</span>
            NAZIR
          </p>
        </div>

        <div className="mt-14 grid gap-16 md:grid-cols-3">
          <Column title="문의">
            <p>
              대표 {site?.contactName ?? '정은수'} |{' '}
              <a href={`tel:${(site?.contactPhone ?? '').replace(/-/g, '')}`}>
                {site?.contactPhone ?? ''}
              </a>
            </p>
          </Column>

          <Column title="더 알아보기">
            <a href={site?.instagramMain ?? '#'} target="_blank" rel="noopener">
              인스타그램 | Pray Sound
            </a>
            <a href={site?.instagramMusical ?? '#'} target="_blank" rel="noopener">
              인스타그램 | &lt;나지르&gt;
            </a>
            <a href={site?.youtube ?? '#'} target="_blank" rel="noopener">
              유튜브 | Pray Sound
            </a>
          </Column>

          <Column title="후원하기">
            <a href={site?.supportFormUrl ?? '#'} target="_blank" rel="noopener">
              후원 구글폼 바로가기
            </a>
            <p>
              {/*
                은행명은 관리자에서 고치는 값이다. 여기에 글자로 박아 두면 은행을 바꿔도
                후원 페이지만 바뀌고 푸터는 옛 은행을 계속 알린다 — 돈이 오가는 안내라
                두 곳이 어긋나면 안 된다.
              */}
              계좌 | {site?.accountBank ?? '카카오뱅크'} {site?.accountNumber ?? ''} (
              {site?.contactName ?? '정은수'})
            </p>
          </Column>
        </div>
      </div>
    </footer>
  );
}
