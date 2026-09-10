import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ADMIN_LISTS } from '@/lib/adminLists';

const PREVIEW_SITE = { budgetTotal: '₩ 9,000,000', prayerNote: '' };

vi.mock('./actions', () => ({ saveList: vi.fn() }));
import { ListEditor } from './ListEditor';

describe('ListEditor', () => {
  it('초기 행/값과 저장 버튼을 렌더한다', () => {
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />);
    expect(screen.getByDisplayValue('기획')).toBeInTheDocument();
    expect(screen.getByText('항목명')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('행 추가/삭제가 동작한다', async () => {
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />);
    expect(screen.getAllByRole('textbox').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 행 추가' }));
    expect(screen.getAllByRole('textbox').length).toBe(2);
    await userEvent.click(screen.getAllByRole('button', { name: '행 삭제' })[1]);
    expect(screen.getAllByRole('textbox').length).toBe(1);
  });
});

const timelineRows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    period: `26.0${(i % 9) + 1}`,
    title: i % 2 === 0 ? `합숙 ${i}` : `연습 ${i}`,
    status: i < 4 ? '완료' : i < 8 ? '진행 중' : '예정',
  }));

describe('ListEditor — 찾기·거르기·페이지', () => {
  const timeline = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `t${i}`,
      period: `26.0${(i % 9) + 1}`,
      title: i % 2 === 0 ? `합숙 ${i}` : `연습 ${i}`,
      status: i < 4 ? '완료' : i < 8 ? '진행 중' : '예정',
    }));

  const saved = (container: HTMLElement) =>
    JSON.parse((container.querySelector('input[name="rows"]') as HTMLInputElement).value);

  it('한 화면에 다 쏟지 않고 끊어서 보여준다', () => {
    const { container } = render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(20)} />);
    expect(screen.getByText(/^20개$/)).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    // 그려진 것은 한 장 분량뿐이다
    expect(container.querySelectorAll('input[type="search"]')).toHaveLength(1);
    expect(saved(container)).toHaveLength(20);
  });

  it('안 보이는 행도 저장에 그대로 들어간다 — 여기가 제일 위험한 곳이다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(20)} />);
    await user.selectOptions(screen.getByRole('combobox', { name: '상태로 거르기' }), '예정');

    expect(screen.getByText(/20개 중 12개 보임/)).toBeInTheDocument();
    expect(screen.getByText(/저장하면 안 보이는 것까지/)).toBeInTheDocument();
    // 걸러도 payload 는 20개 그대로
    expect(saved(container)).toHaveLength(20);
  });

  it('검색어로 거른다', async () => {
    const user = userEvent.setup();
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(20)} />);
    await user.type(screen.getByRole('searchbox'), '합숙');
    expect(screen.getByText(/20개 중 10개 보임/)).toBeInTheDocument();
  });

  it('아무것도 안 걸리면 그 사실을 말해 준다', async () => {
    const user = userEvent.setup();
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(20)} />);
    await user.type(screen.getByRole('searchbox'), '없는말');
    expect(screen.getByText(/찾는 것이 없습니다/)).toBeInTheDocument();
  });

  it('모아 보기는 보기만 바꾸고 저장 순서는 건드리지 않는다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(12)} />);
    const before = saved(container).map((r: { id: string }) => r.id);

    await user.click(screen.getByRole('button', { name: /상태별로 모아 보기/ }));
    expect(screen.getByText(/보기 순서만 바꾼 것입니다/)).toBeInTheDocument();
    expect(saved(container).map((r: { id: string }) => r.id)).toEqual(before);
  });

  it('모아 보기 중에는 ↑↓ 를 잠근다 — 보이는 자리와 저장되는 자리가 다르다', async () => {
    const user = userEvent.setup();
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(12)} />);
    await user.click(screen.getByRole('button', { name: /상태별로 모아 보기/ }));
    for (const b of screen.getAllByRole('button', { name: '위로 이동' })) expect(b).toBeDisabled();
    for (const b of screen.getAllByRole('button', { name: '아래로 이동' })) expect(b).toBeDisabled();
  });

  it('거른 상태에서 ↑ 를 누르면 보이는 이웃과 자리를 바꾼다', async () => {
    const user = userEvent.setup();
    // 완료 4개(t0~t3) 중 두 번째를 위로 올리면 t0 과 t1 이 바뀐다
    const { container } = render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timeline(12)} />);
    await user.selectOptions(screen.getByRole('combobox', { name: '상태로 거르기' }), '완료');
    await user.click(screen.getAllByRole('button', { name: '위로 이동' })[1]);
    expect(saved(container).slice(0, 2).map((r: { id: string }) => r.id)).toEqual(['t1', 't0']);
  });

  it('짧고 거를 기준도 없는 목록에는 찾기 칸을 두지 않는다', () => {
    // 작품 개요(5) · 제작 예산(8) · 기도 제목(6) 은 한 화면에 다 들어온다.
    // 찾기 칸이 자리만 차지하고 하는 일이 없다.
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.budget} initialRows={
      Array.from({ length: 8 }, (_, i) => ({ id: `b${i}`, name: `항목${i}` }))
    } />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('길어지면 저절로 나타난다', () => {
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.budget} initialRows={
      Array.from({ length: 11 }, (_, i) => ({ id: `b${i}`, name: `항목${i}` }))
    } />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('거를 기준이 있으면 짧아도 남긴다 — 편지는 9장이지만 페이지별로 갈라 봐야 한다', () => {
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.letters} initialRows={
      Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, section: 'praysound', image_url: '', caption: '' }))
    } />);
    expect(screen.getByRole('combobox', { name: '들어갈 페이지로 거르기' })).toBeInTheDocument();
  });

  it('목록 아래에도 쪽 번호를 둔다 — 다 훑고 내려온 자리에서 바로 넘길 수 있어야 한다', async () => {
    const user = userEvent.setup();
    render(<ListEditor site={PREVIEW_SITE} config={ADMIN_LISTS.timeline} initialRows={timelineRows(20)} />);
    const pager = screen.getByRole('navigation', { name: '목록 쪽 이동' });
    expect(pager).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2쪽' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });
});