import { CopyButton } from '@/components/CopyButton';
import { getContent } from '@/lib/content';

export const revalidate = 60;

export default async function Join() {
  const { site, prayers } = await getContent();
  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">03 / JOIN</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-[clamp(36px,7vw,56px)]">&lt;나지르&gt;와 함께하기</h2>

      <p className="font-display text-[clamp(17px,4.4vw,23px)] leading-[1.95] text-paper/[0.86] mb-2.5">{site.joinVerse}</p>
      <p className="font-mono text-[11px] tracking-[0.14em] text-gold mb-[clamp(48px,8vw,72px)]">{site.joinVerseRef}</p>

      <div className="border border-gold/30 bg-gradient-to-b from-velvet to-stage p-[clamp(24px,6vw,36px)] mb-[clamp(40px,7vw,60px)]">
        <h3 className="font-display text-[clamp(21px,5vw,28px)] text-gold mb-[18px]">후원으로 함께하기</h3>
        <p className="text-sm font-light leading-[2.1] text-paper/[0.78] mb-[26px]">{site.supportIntro}</p>
        <a href={site.supportFormUrl} target="_blank" rel="noopener" className="flex items-center justify-center min-h-[56px] bg-gold text-ink font-body text-base font-medium rounded-sm mb-5 hover:bg-gold-soft transition-colors">후원 신청서 작성하기</a>
        <div className="border border-dashed border-gold/35 p-[18px] flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.16em] text-paper/50">{site.accountBank}</span>
            <span className="font-mono text-[clamp(16px,4.6vw,20px)] text-paper">{site.accountNumber}</span>
            <span className="text-[12.5px] font-light text-paper/60">{site.accountHolder}</span>
          </div>
          <CopyButton value={site.accountNumber} idleLabel="계좌번호 복사하기" doneLabel="계좌번호가 복사되었습니다" />
        </div>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(40px,7vw,60px)]">
        <h3 className="font-display text-[clamp(21px,5vw,28px)] text-gold mb-4">기도로 함께하기</h3>
        <p className="font-display text-[clamp(16px,4.2vw,20px)] leading-[1.95] text-paper/[0.86] mb-7">{site.prayerIntro}</p>
        <ol className="list-none m-0 p-0 grid gap-3.5">
          {prayers.map((p, i) => (
            <li key={p.id} className="flex gap-3.5 items-baseline">
              <span className="font-mono text-[11px] text-gold flex-none">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm font-light leading-[2] text-paper/80">{p.text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)]">
        <h3 className="font-display text-[clamp(21px,5vw,28px)] text-gold mb-4">Q&amp;A · 응원으로 함께하기</h3>
        <p className="text-sm font-light leading-[2.1] text-paper/[0.78] mb-6">{site.qnaIntro}</p>
        <a href={site.qnaUrl} target="_blank" rel="noopener" className="flex items-center justify-center min-h-[56px] border border-gold/50 text-gold text-[15px] font-medium rounded-sm hover:bg-gold/[0.12] transition-colors">질문 · 응원 남기기</a>
      </div>
    </section>
  );
}
