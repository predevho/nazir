import type { SiteContent } from '../content/types';

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
      <div className="mt-6 flex flex-col gap-2 font-heir text-[15px] text-ds-text">{children}</div>
    </div>
  );
}

export function Footer({ site }: { site?: SiteContent }) {
  return (
    <footer className="bg-ds-panel px-8 py-[clamp(40px,6vw,64px)]">
      <div className="mx-auto max-w-content">
        {/* TODO: 최종 로고 이미지로 교체 (Figma 코멘트 #24). 현재는 시안과 동일한 임시 텍스트. */}
        <p className="font-heir text-[36px] leading-none text-ds-key2">나지르 | NAZIR</p>

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
              계좌 정보 | 카카오뱅크 {site?.accountNumber ?? ''} ({site?.contactName ?? '정은수'})
            </p>
          </Column>
        </div>
      </div>
    </footer>
  );
}
