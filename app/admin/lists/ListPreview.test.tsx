import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListEditor } from './ListEditor';
import { PreviewBoundary } from './ListPreview';
import { ADMIN_LISTS } from '@/lib/adminLists';

const SITE = { budgetTotal: '₩ 9,000,000', prayerNote: '함께 기도해 주세요' };

/** 미리보기는 <aside>에 있다. 편집기 입력칸과 같은 말이 두 번 잡히지 않도록 여기로 좁힌다. */
function preview(container: HTMLElement) {
  const aside = container.querySelector('aside');
  if (!aside) throw new Error('미리보기가 없다');
  return within(aside as HTMLElement);
}

afterEach(() => vi.restoreAllMocks());

describe('ListPreview — 편집 중인 값을 그대로 그린다', () => {
  it('저장하지 않아도 입력한 값이 미리보기에 바로 나온다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ListEditor site={SITE} config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />,
    );
    expect(preview(container).getByText('기획')).toBeInTheDocument();

    await user.clear(screen.getByDisplayValue('기획'));
    await user.type(screen.getByRole('textbox'), '무대 제작');

    expect(preview(container).getByText('무대 제작')).toBeInTheDocument();
    expect(preview(container).queryByText('기획')).not.toBeInTheDocument();
  });

  it('이 목록 밖의 값(예산 총액)도 함께 그린다 — 카드가 실제로 그렇게 생겼다', () => {
    const { container } = render(
      <ListEditor site={SITE} config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />,
    );
    expect(preview(container).getByText(/₩ 9,000,000/)).toBeInTheDocument();
  });

  it('제작 일정은 상태를 바꾸면 카드를 옮겨 간다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ListEditor
        site={SITE}
        config={ADMIN_LISTS.timeline}
        initialRows={[{ id: 't0', period: '26.01', title: '대본 작업', status: '예정' }]}
      />,
    );
    const ahead = preview(container).getByRole('heading', { name: /앞으로 걸어갈 이야기/ }).closest('section')!;
    expect(within(ahead).getByText('대본 작업')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '상태' }), '완료');

    const past = preview(container).getByRole('heading', { name: /지나온 이야기/ }).closest('section')!;
    expect(within(past).getByText('대본 작업')).toBeInTheDocument();
    expect(within(ahead).queryByText('대본 작업')).not.toBeInTheDocument();
  });

  it('행을 지우면 미리보기에서도 사라진다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ListEditor
        site={SITE}
        config={ADMIN_LISTS.budget}
        initialRows={[{ id: 'b0', name: '기획' }, { id: 'b1', name: '홍보' }]}
      />,
    );
    await user.click(screen.getAllByRole('button', { name: '행 삭제' })[0]);
    expect(preview(container).queryByText('기획')).not.toBeInTheDocument();
    expect(preview(container).getByText('홍보')).toBeInTheDocument();
  });

  it('어느 화면에 나오는지 링크로 알려준다', () => {
    const { container } = render(
      <ListEditor site={SITE} config={ADMIN_LISTS.prayers} initialRows={[{ id: 'p0', text: '건강' }]} />,
    );
    const link = preview(container).getByRole('link', { name: /후원과 기도 02/ });
    expect(link).toHaveAttribute('href', '/join/prayer');
  });

  it('모든 목록이 미리보기를 그린다 — 새 목록을 붙이고 분기를 빠뜨리면 여기서 걸린다', () => {
    for (const config of Object.values(ADMIN_LISTS)) {
      const row: Record<string, string> = { id: 'x' };
      for (const c of config.columns) row[c.key] = c.options?.[0]?.value ?? '값';
      const { container, unmount } = render(<ListEditor site={SITE} config={config} initialRows={[row]} />);
      const aside = container.querySelector('aside');
      expect(aside, `${config.key} 미리보기 없음`).not.toBeNull();
      // 분기를 빠뜨리면 Rendered 가 null 을 돌려주어 상자가 텅 빈다.
      expect(aside!.querySelector('div.overflow-y-auto')!.childElementCount, config.key).toBeGreaterThan(0);
      unmount();
    }
  });

  it('모든 목록이 나오는 곳을 갖고 있다 — 링크 없는 목록이 생기지 않게', () => {
    for (const config of Object.values(ADMIN_LISTS)) {
      expect(config.where.path.startsWith('/')).toBe(true);
      expect(config.where.label.length).toBeGreaterThan(0);
    }
  });
});

describe('PreviewBoundary', () => {
  it('미리보기가 터져도 편집기는 남는다', () => {
    // React 가 경계에서 잡은 오류를 콘솔에 다시 뱉는다. 테스트 출력만 조용히 시킨다.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Boom(): React.ReactNode {
      throw new Error('망가진 값');
    }
    render(
      <PreviewBoundary>
        <Boom />
      </PreviewBoundary>,
    );
    expect(screen.getByText(/미리보기를 그릴 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByText(/편집과 저장에는 영향이 없습니다/)).toBeInTheDocument();
  });
});
