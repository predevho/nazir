import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestbookAdmin, type AdminEntry } from './GuestbookAdmin';

vi.mock('./actions', () => ({ moderateEntry: vi.fn(), saveReply: vi.fn() }));

const entry = (over: Partial<AdminEntry> = {}): AdminEntry => ({
  id: 'e1',
  name: '정은수',
  message: '응원합니다',
  isHeld: false,
  holdReasons: [],
  createdAt: '2026-08-26T04:00:00.000Z',
  replies: [],
  ...over,
});

describe('GuestbookAdmin', () => {
  it('says so when nothing has been posted yet', () => {
    render(<GuestbookAdmin entries={[]} />);
    expect(screen.getByText('아직 등록된 응원글이 없습니다.')).toBeInTheDocument();
  });

  it('counts the entries waiting for review', () => {
    render(
      <GuestbookAdmin
        entries={[entry({ id: 'a', isHeld: true }), entry({ id: 'b', isHeld: true }), entry({ id: 'c' })]}
      />,
    );
    expect(screen.getByText(/검토 대기 2건/)).toBeInTheDocument();
  });

  it('offers 숨기기 for a visible entry and 공개하기 for a held one', () => {
    render(<GuestbookAdmin entries={[entry({ id: 'a' }), entry({ id: 'b', isHeld: true })]} />);
    expect(screen.getByRole('button', { name: '숨기기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '공개하기' })).toBeInTheDocument();
  });

  it('does not delete on the first click — it asks again', async () => {
    const user = userEvent.setup();
    render(<GuestbookAdmin entries={[entry()]} />);
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByRole('button', { name: /정말 삭제/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('button', { name: /정말 삭제/ })).not.toBeInTheDocument();
  });

  it('sends the right op for each button', async () => {
    const user = userEvent.setup();
    render(<GuestbookAdmin entries={[entry({ id: 'x', isHeld: true })]} />);
    const release = screen.getByRole('button', { name: '공개하기' });
    const form = release.closest('form')!;
    expect(form.querySelector('input[name="op"]')).toHaveValue('release');
    expect(form.querySelector('input[name="id"]')).toHaveValue('x');

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const del = screen.getByRole('button', { name: /정말 삭제/ }).closest('form')!;
    expect(del.querySelector('input[name="op"]')).toHaveValue('delete');
  });

  it('keeps the reply box closed until asked — 43개 글마다 펼쳐져 있으면 검토가 안 된다', async () => {
    const user = userEvent.setup();
    render(<GuestbookAdmin entries={[entry()]} />);
    expect(screen.queryByPlaceholderText('응원에 답하는 한 마디')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ 답글 달기' }));
    expect(screen.getByPlaceholderText('응원에 답하는 한 마디')).toBeInTheDocument();
  });

  it('shows existing replies with 고치기 · 지우기', () => {
    render(
      <GuestbookAdmin
        entries={[
          entry({
            replies: [
              { id: 'r1', entryId: 'e1', message: '고맙습니다', createdAt: '2026-08-27T04:00:00.000Z' },
            ],
          }),
        ]}
      />,
    );
    expect(screen.getByText('고맙습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '고치기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지우기' })).toBeInTheDocument();
  });

  it('edits in place — 고치기 는 새 답글이 아니라 그 답글을 가리킨다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GuestbookAdmin
        entries={[
          entry({
            replies: [
              { id: 'r1', entryId: 'e1', message: '고맙습니다', createdAt: '2026-08-27T04:00:00.000Z' },
            ],
          }),
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: '고치기' }));
    const box = screen.getByLabelText('답글 내용') as HTMLTextAreaElement;
    expect(box.value).toBe('고맙습니다');
    expect(container.querySelector('input[name="replyId"][value="r1"]')).toBeInTheDocument();
  });

  it('답글을 연 그 글에 붙인다 — 늘 첫 글로 가면 안 된다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GuestbookAdmin entries={[entry({ id: 'first' }), entry({ id: 'second' })]} />,
    );
    const openButtons = screen.getAllByRole('button', { name: '+ 답글 달기' });
    expect(openButtons).toHaveLength(2);

    await user.click(openButtons[1]);
    const ids = [...container.querySelectorAll('input[name="entryId"]')].map((n) =>
      n.getAttribute('value'),
    );
    expect(ids).toEqual(['second']);
  });

  it('한 글에 답글이 여러 개 붙을 수 있다 (1:N)', () => {
    render(
      <GuestbookAdmin
        entries={[
          entry({
            replies: [
              { id: 'r1', entryId: 'e1', message: '첫 답글', createdAt: '2026-08-27T04:00:00.000Z' },
              { id: 'r2', entryId: 'e1', message: '둘째 답글', createdAt: '2026-08-28T04:00:00.000Z' },
            ],
          }),
        ]}
      />,
    );
    expect(screen.getByText('첫 답글')).toBeInTheDocument();
    expect(screen.getByText('둘째 답글')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '지우기' })).toHaveLength(2);
  });

  it('왜 숨겨졌는지 밝힌다 — 사유 없이 숨김만 보이면 판단할 근거가 없다', () => {
    render(<GuestbookAdmin entries={[entry({ isHeld: true, holdReasons: ['promo', 'contact'] })]} />);
    expect(screen.getByText('광고성 문구 · 연락처·아이디')).toBeInTheDocument();
  });

  it('운영진이 손으로 숨긴 글에는 사유 뱃지를 붙이지 않는다', () => {
    render(<GuestbookAdmin entries={[entry({ isHeld: true, holdReasons: [] })]} />);
    expect(screen.getByText('숨김')).toBeInTheDocument();
    expect(screen.queryByText(/광고성 문구|욕설/)).not.toBeInTheDocument();
  });
});